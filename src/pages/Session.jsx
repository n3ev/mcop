import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadSession, saveSession } from '../lib/storage.js'
import { useAuth } from '../context/AuthContext.jsx'
import { getSessionState, sessionCommand, extendSession } from '../lib/session.js'

const SESSION_MS = 60 * 60 * 1000 // 1 hour

export default function Session() {
  const nav = useNavigate()
  const { user } = useAuth()
  const loadout = user?.preferences?.loadout
  const session = useMemo(() => loadSession(), [])
  const [server, setServer] = useState(session.server || null)
  const [endsAt, setEndsAt] = useState(session.endsAt || null)
  const [remaining, setRemaining] = useState(SESSION_MS)
  const [copied, setCopied] = useState('')
  const [quest] = useState(session.quest || null)
  const [partnerOnline, setPartnerOnline] = useState(false)
  const [youOnline, setYouOnline] = useState(false)
  const [msg, setMsg] = useState('')

  const live = !!session.matchId && !!session.role

  useEffect(() => {
    if (!session.partner) { nav('/'); return }
    if (!session.server) { setServer({ unavailable: true }); return }
    if (!session.endsAt) {
      const ends = Date.now() + SESSION_MS
      setEndsAt(ends)
      saveSession({ endsAt: ends })
    }
  }, [])

  // poll live session state (presence + extended end time)
  useEffect(() => {
    if (!live) return
    let on = true
    const poll = async () => {
      const s = await getSessionState(session.matchId, session.role)
      if (!on || !s || !s.active) return
      setPartnerOnline(s.partnerOnline)
      setYouOnline(s.youOnline)
      if (s.endsAt && s.endsAt !== endsAt) { setEndsAt(s.endsAt); saveSession({ endsAt: s.endsAt }) }
    }
    poll()
    const t = setInterval(poll, 5000)
    return () => { on = false; clearInterval(t) }
  }, [live, endsAt])

  // tick the timer
  useEffect(() => {
    if (!endsAt) return
    const t = setInterval(() => {
      const r = Math.max(0, endsAt - Date.now())
      setRemaining(r)
      if (r === 0) { clearInterval(t); nav('/post-session') }
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

  const runCmd = async (action, label) => {
    setMsg('')
    try { await sessionCommand(session.matchId, session.role, action); setMsg(`${label} ✓`) }
    catch (e) { setMsg(e.message) }
    setTimeout(() => setMsg(''), 2500)
  }

  const onExtend = async () => {
    setMsg('')
    try {
      const { endsAt: newEnds } = await extendSession(session.matchId, session.role)
      setEndsAt(newEnds); saveSession({ endsAt: newEnds }); setMsg('Extended +30 min ✓')
    } catch (e) { setMsg(e.message) }
    setTimeout(() => setMsg(''), 3000)
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
      {quest && (
        <div className="quest-banner">
          <span className="quest-label">🎯 Quest of the session</span>
          <span className="quest-text">{quest}</span>
        </div>
      )}

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

          {loadout && loadout !== 'Vanilla' && (
            <p className="muted small">Your start: <strong>{loadout}</strong>, applied automatically when you join.</p>
          )}

          {live && (
            <div className="ingame-controls">
              <span className="controls-label">In-game controls</span>
              <div className="controls-row">
                <button className="btn small" onClick={() => runCmd('day', 'Set to day')}>☀️ Day</button>
                <button className="btn small" onClick={() => runCmd('clear', 'Cleared weather')}>🌤️ Clear weather</button>
                <button className="btn small" onClick={() => runCmd('tp', 'Teleported to buddy')} disabled={!partnerOnline}>🧭 Teleport to buddy</button>
              </div>
              {msg && <p className="muted small">{msg}</p>}
            </div>
          )}
        </div>

        <aside className="timer">
          <span className="timer-label">Time left together</span>
          <div className="timer-clock">{mm}:{ss}</div>
          {live && (
            <button className="btn small" style={{ marginTop: 6 }} onClick={onExtend}>+30 min</button>
          )}
          <p className="muted small" style={{ marginTop: 10 }}>When this hits zero you'll be offered to swap socials.</p>
          <button className="btn ghost" onClick={() => nav('/post-session')}>End early</button>
        </aside>
      </div>

      <div className="partner-strip">
        Playing with <strong>{session.partner?.displayName}</strong> · {session.score}% match
        {live && (
          <span className={'presence ' + (partnerOnline ? 'on' : 'off')}>
            {partnerOnline ? '● in-game' : '○ not joined yet'}
          </span>
        )}
      </div>
    </section>
  )
}
