import { useState } from 'react'
import { unlock } from '../lib/achievements.js'
import { toast } from '../lib/toast.js'

// "bring a buddy": the phone's own share sheet where there is one, otherwise
// the link goes on the clipboard. every extra player in the queue makes the
// next match faster, so it turns up wherever someone is waiting or done.
const SITE = 'https://mcop.world'
const PITCH = 'Find a Minecraft buddy in 60 seconds: answer a few questions, get matched by playstyle, and play on a private server for an hour. Free.'
const enc = encodeURIComponent

// share sheet, else clipboard, else a prompt to copy from. 'copied' when it
// went to the clipboard (worth saying so on the button), else ''
export async function shareMcop(text = PITCH) {
  if (navigator.share) {
    try {
      await navigator.share({ title: 'MCOP: find a Minecraft buddy', text, url: SITE })
      unlock('spread-the-word')
      return ''
    } catch (e) {
      if (e && e.name === 'AbortError') return ''   // they closed the sheet
    }
  }
  try {
    await navigator.clipboard.writeText(`${text} ${SITE}`)
    toast('Link copied. Paste it anywhere.', '/assets/textures/items/paper.png')
    unlock('spread-the-word')
    return 'copied'
  } catch {
    window.prompt('Copy this link:', SITE)
    return ''
  }
}

export default function ShareInvite({ compact = false, label = 'Invite a friend' }) {
  const [copied, setCopied] = useState(false)
  const share = async () => {
    if (await shareMcop() === 'copied') {
      setCopied(true)
      setTimeout(() => setCopied(false), 2400)
    }
  }
  return (
    <div className={'share-invite' + (compact ? ' compact' : '')}>
      <button type="button" className="btn share-btn" onClick={share}>
        <img src="/assets/textures/items/writable_book.png" alt="" className="btn-ico" />
        {copied ? 'Link copied' : label}
      </button>
      {!compact && (
        <div className="share-links">
          <a href={`https://twitter.com/intent/tweet?text=${enc(PITCH)}&url=${enc(SITE)}`} target="_blank" rel="noreferrer" onClick={() => unlock('spread-the-word')}>Post on X</a>
          <a href={`https://www.reddit.com/submit?url=${enc(SITE)}&title=${enc('MCOP: get matched with a Minecraft buddy who plays like you')}`} target="_blank" rel="noreferrer" onClick={() => unlock('spread-the-word')}>Share on Reddit</a>
          <a href={`https://wa.me/?text=${enc(PITCH + ' ' + SITE)}`} target="_blank" rel="noreferrer" onClick={() => unlock('spread-the-word')}>Send on WhatsApp</a>
        </div>
      )}
    </div>
  )
}
