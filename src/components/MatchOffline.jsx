import { useState } from 'react'
import { Link } from 'react-router-dom'

// what the queue pages show when the matchmaking server can't be reached —
// the game's own "Failed to connect" screen, honestly, instead of pretending.
// onRetry() resolves true once the queue has been joined.
export default function MatchOffline({ onRetry }) {
  const [busy, setBusy] = useState(false)
  const [tries, setTries] = useState(0)
  const retry = async () => {
    setBusy(true)
    const ok = await onRetry()
    setBusy(false)
    if (!ok) setTries(t => t + 1)
  }
  return (
    <section className="card center mc-disconnect">
      <h2 className="mc-disconnect-title">Failed to connect to the server</h2>
      <p className="mc-disconnect-reason">io.netty.channel.AbstractChannel$AnnotatedConnectException: Connection refused</p>
      <p className="muted">
        The MCOP matchmaking server isn't answering right now, so nobody can be matched
        until it's back. Your answers are saved: try again in a bit and you'll go
        straight into the queue.
      </p>
      {tries > 0 && <p className="muted small">Still down. It's usually back within the hour.</p>}
      <div className="mc-disconnect-actions">
        <button className="btn primary" onClick={retry} disabled={busy}>{busy ? 'Connecting…' : 'Try again'}</button>
        <Link to="/" className="btn ghost">Back to title screen</Link>
      </div>
      <p className="muted small mc-disconnect-tip">While you wait: the ores in the cave walls are real. Hold one down.</p>
    </section>
  )
}
