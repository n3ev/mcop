import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadSession, saveSession } from '../lib/storage.js'
import { checkoutServer } from '../lib/serverPool.js'

const SESSION_MS = 60 * 60 * 1000 // 1 hour

export default function Session() {
  const nav = useNavigate()
  const session = useMemo(() => loadSession(), [])
  const [server, setServer] = useState(session.server || null)
  const [endsAt, setEndsAt] = useState(session.endsAt || null)
  const [remaining, setRemaining] = useState(SESSION_MS)
  const [copied, setCopied] = useState('')

  // Assign server on first visit
  useEffect(() => {
    if (!session.partner) { nav('/'); return }
    if (!server) {
      const s = checkoutServer()
      if (!s) {
        // pool empty — show a friendly message
        setServer({ unavailable: true })
        return
      }
      const ends = Date.now() + SESSION_MS
      setServer(s)
      setEndsAt(ends)
      saveSession({ server: s, endsAt: ends })
    }
  }, [])

  // Tick the timer
  useEffect(() => {
    if (!endsAt) return
    const t = setInterval(() => {
      const r = Math.max(0, endsAt - Date.now())
      setRemaining(r)
      if (r === 0) {
        clearInterval(t)
        nav('/post-session')
      }
    }, 500)
    return () => clearInterval(t)
  }, [endsAt])

  const mm = String(Math.floor(remaining / 60000)).padStart(2, '0')
  const ss = String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0')

  const copy = (text, label) => {
    navigator.clipboard?.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(''), 1500)
  }

  if (server?.unavailable) {
    return (
      <section className="card center">
        <h2>All servers are busy right now</h2>
        <p className="muted">We're out of free slots. Try again in a few minutes.</p>
        <button className="btn" onClick={() => nav('/')}>Back to start</button>
      </section>
    )
  }

  if (!server) return <section className="card center"><div className="spinner" /><h2>Spinning up your world…</h2></section>

  return (
    <section className="card">
      <div className="session-grid">
        <div>
          <span className="tag good">Server ready</span>
          <h2>Connect to <span className="highlight">{server.host}</span></h2>
          <p className="muted">World: {server.world} · {server.note}</p>

          <div className="kv">
            <div className="kv-row">
              <span className="kv-key">IP</span>
              <code className="kv-val">{server.host}</code>
              <button className="btn small" onClick={() => copy(server.host, 'IP')}>Copy</button>
            </div>
            <div className="kv-row">
              <span className="kv-key">Port</span>
              <code className="kv-val">{server.port}</code>
              <button className="btn small" onClick={() => copy(String(server.port), 'Port')}>Copy</button>
            </div>
          </div>
          {copied && <p className="muted small">{copied} copied ✓</p>}

          <ol className="steps">
            <li>Open Minecraft → Multiplayer → Add Server</li>
            <li>Paste <code>{server.host}</code> into Server Address</li>
            <li>Hit Done, then Join</li>
          </ol>
        </div>

        <aside className="timer">
          <span className="timer-label">Time left together</span>
          <div className="timer-clock">{mm}:{ss}</div>
          <p className="muted small">When this hits zero you'll be offered to share socials or save the world.</p>
          <button className="btn ghost" onClick={() => nav('/post-session')}>End early</button>
        </aside>
      </div>

      <div className="partner-strip">
        Playing with <strong>{session.partner?.displayName}</strong> · {session.score}% match
      </div>
    </section>
  )
}
