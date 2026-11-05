import { useEffect, useState } from 'react'
import { renderCard } from '../lib/recapCard.js'
import { getSessionRecap } from '../lib/session.js'
import { track, trackServer } from '../lib/track.js'
import { unlock } from '../lib/achievements.js'
import { playPop } from '../lib/sound.js'
import Ico from './Ico.jsx'

const LINK = 'https://mcop.world/?ref=card'

// turn the hour into a picture to post: a story-sized card with both players,
// what they did, and mcop.world. the share sheet sends the image itself where
// the phone can; otherwise it's a download.
export default function ShareCard({ matchId, you, buddy, friends }) {
  const [blob, setBlob] = useState(null)
  const [url, setUrl] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => () => { if (url) URL.revokeObjectURL(url) }, [url])

  const make = async () => {
    setBusy(true)
    setError('')
    try {
      const r = matchId ? await getSessionRecap(matchId) : null
      const b = await renderCard({ you, buddy, friends, recap: r?.ready ? r.recap : null })
      if (!b) throw new Error('your browser could not draw the card')
      setBlob(b)
      setUrl(URL.createObjectURL(b))
      playPop()
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  const file = () => new File([blob], 'my-mcop-hour.png', { type: 'image/png' })
  const canShare = !!blob && typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file()] })
  const caption = friends ? 'An hour of Minecraft with a friend, on MCOP.' : 'Matched with a stranger on MCOP, played Minecraft for an hour.'

  const share = async () => {
    try {
      await navigator.share({ files: [file()], text: `${caption} ${LINK}` })
      trackServer('card_shared', 'share')
      track('card_shared')
      unlock('spread-the-word')
    } catch (e) { if (e?.name !== 'AbortError') setError('Sharing failed. Save the picture instead.') }
  }
  const save = () => {
    const a = Object.assign(document.createElement('a'), { href: url, download: 'my-mcop-hour.png' })
    document.body.appendChild(a)
    a.click()
    a.remove()
    trackServer('card_saved', 'download')
    track('card_saved')
    unlock('spread-the-word')
  }

  return (
    <div className="post-card share-card">
      <h3>Post your hour</h3>
      {!url ? (
        <>
          <p className="muted small">Make a picture of your hour for your story: both of you, what you got up to, and where you found each other.</p>
          <button className="btn primary" disabled={busy} onClick={make}>
            <Ico name="filled_map" className="btn-ico" />{busy ? 'Drawing it…' : 'Make my card'}
          </button>
        </>
      ) : (
        <>
          <img className="share-card-preview" src={url} alt={`A picture of your hour with ${buddy.name}, made by MCOP`} />
          <div className="cta-row share-card-actions">
            {canShare && <button className="btn primary" onClick={share}>Share</button>}
            <button className={'btn' + (canShare ? '' : ' primary')} onClick={save}>Save the picture</button>
          </div>
          <p className="muted small">The link on it is mcop.world. Tag your buddy.</p>
        </>
      )}
      {error && <p className="auth-error small">{error}</p>}
    </div>
  )
}
