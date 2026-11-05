import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getNights, rsvpNight, nightWhen, clockTime, untilText, downloadIcs } from '../lib/nights.js'
import { fetchActivity } from '../lib/api.js'
import { playPop } from '../lib/sound.js'
import Ico from './Ico.jsx'

const SAID = 'mcop_rsvp_v1'
const said = () => { try { return Number(localStorage.getItem(SAID)) || 0 } catch { return 0 } }

// the next match night, or the one that's on now: when everyone queues at
// once, so a buddy turns up fast. one click to say you'll come (an email an
// hour before) or to put it in your calendar.
export default function MatchNight({ className = '' }) {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [rsvpd, setRsvpd] = useState(said)
  const [queue, setQueue] = useState(null)
  const [, setTick] = useState(0)

  useEffect(() => {
    getNights().then(d => {
      setData(d)
      // during a night, say how many are really in the queue (never a guess)
      if (d?.live) fetchActivity().then(s => setQueue(s ? s.queue : null))
    })
    const t = setInterval(() => setTick(n => n + 1), 60000) // keep "in 12 minutes" honest
    return () => clearInterval(t)
  }, [])

  if (!data?.nights?.length) return null
  const now = Date.now()
  const live = data.nights.find(n => n.start <= now && now < n.end)
  const next = data.nights.find(n => n.start > now)

  if (live) {
    return (
      <div className={'match-night live ' + className}>
        <span className="match-night-dot" aria-hidden="true" />
        <span><strong>Match night is on</strong> until {clockTime(live.end)}.{' '}
          {queue > 0 ? `${queue} ${queue === 1 ? 'person is' : 'people are'} in the queue right now.` : 'Jump in and be the first in the queue.'}</span>
        <Link to="/questionnaire" className="btn small primary">Find my buddy</Link>
      </div>
    )
  }
  if (!next) return null

  const rsvp = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await rsvpNight(next.start, user ? undefined : email)
      try { localStorage.setItem(SAID, String(next.start)) } catch { /* private mode */ }
      setRsvpd(next.start)
      playPop()
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  return (
    <div className={'match-night ' + className}>
      <div className="match-night-head">
        <Ico name="bell" />
        <span><strong>Next match night:</strong> {nightWhen(next.start)} your time <span className="muted">({untilText(next.start, now)})</span></span>
      </div>
      <p className="muted small">
        It's when everyone tries to come at once, so you're more likely to get a buddy.{next.going >= 3 ? ` ${next.going} people said they'll come.` : ''}
      </p>
      {rsvpd === next.start ? (
        <p className="success small">You're coming ✓ We'll email you an hour before.{' '}
          <button type="button" className="link-btn" onClick={() => downloadIcs(next)}>Add it to your calendar</button>
        </p>
      ) : (
        <form className="match-night-form" onSubmit={rsvp}>
          {!user && <input className="text-input" type="email" required placeholder="you@example.com" aria-label="Your email" value={email} onChange={e => setEmail(e.target.value)} />}
          <button className="btn small primary" disabled={busy}>{busy ? 'Saving…' : user ? "I'll be there" : 'Remind me'}</button>
          <button type="button" className="btn small" onClick={() => downloadIcs(next)}>Add to calendar</button>
        </form>
      )}
      {error && <p className="auth-error small">{error}</p>}
    </div>
  )
}
