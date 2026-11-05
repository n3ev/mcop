import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { loadSession, saveSession } from '../lib/storage.js'
import { useAuth } from '../context/AuthContext.jsx'
import { getSessionState, sessionCommand, extendSession } from '../lib/session.js'
import { toast } from '../lib/toast.js'
import Ico from '../components/Ico.jsx'
import HourPanel from '../components/HourPanel.jsx'

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
  const [hour, setHour] = useState(null)
  const [msg, setMsg] = useState('')
  const [extendHint, setExtendHint] = useState(false)
  const [reward, setReward] = useState(session.reward || null)
  const rewardSeen = useRef(!!session.reward)
  const friends = !!session.party

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

  // poll live session state (presence + extended end time + no-shows)
  useEffect(() => {
    if (!live) return
    let on = true
    const poll = async () => {
      const s = await getSessionState(session.matchId, session.role)
      if (!on || !s) return
      // buddy never joined: the backend released the server. if we're the one
      // who showed up, it requeued us with priority — hop back to matching.
      if (s.noShow) {
        if (s.youAbsent) {
          setServer({ released: true })
          setEndsAt(null)
        } else if (s.party) {
          saveSession({ matchId: null, role: null, partner: null, server: null, quest: null, modes: null, endsAt: null })
          toast("Your friend never joined, so we freed the server. Send them a fresh invite.", '/assets/textures/items/clock_00.png')
          nav('/invite')
        } else {
          saveSession({ queueId: s.requeueId, matchId: null, role: null, partner: null, server: null, quest: null, modes: null, endsAt: null })
          toast('Your buddy never showed. Back at the front of the queue.', '/assets/textures/items/clock_00.png')
          nav('/matching')
        }
        return
      }
      if (!s.active) return
      setPartnerOnline(s.partnerOnline)
      setYouOnline(s.youOnline)
      setHour(s.live || null)
      // the referral week lands mid-session, once you've played together a while
      if (s.reward && !rewardSeen.current) {
        rewardSeen.current = true
        setReward(s.reward)
        saveSession({ reward: s.reward })
        if (s.reward.status === 'granted' || s.reward.status === 'claimable') {
          toast('You earned a free week of the Campfire ✦', '/assets/textures/items/campfire.png')
        }
      }
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
    } catch (e) { setMsg(e.message); setExtendHint(e.campfire && !session.campfire) }
    setTimeout(() => setMsg(''), 4000)
  }

  if (server?.released) {
    return (
      <section className="card center">
        <h2>This session was released</h2>
        <p className="muted">You didn't join the server in time, so we freed it up. No stress, {friends ? 'make a fresh invite whenever you\'re ready' : 'hop back in the queue whenever'}.</p>
        <button className="btn primary" onClick={() => nav(friends ? '/invite' : '/questionnaire')}>{friends ? 'Make a new invite' : 'Find a buddy'}</button>
      </section>
    )
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

  // game servers with the session plugin run modes; older ones roll one quest.
  // until you're both playing, the server address matters more, so the mode
  // menu sits under it (on phones it would push the IP off the screen)
  const playing = hour?.phase === 'playing'
  const hourPanel = session.modes && <HourPanel live={hour} suggest={session.modes.suggest} partnerName={session.partner?.displayName} />

  return (
    <section className="card">
      {playing ? hourPanel : !session.modes && quest && (
        <div className="quest-banner">
          <span className="quest-label"><Ico name="book" className="btn-ico" />Quest of the session</span>
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
                <button className="btn small" onClick={() => runCmd('day', 'Set to day')}><Ico name="block:sun" className="btn-ico" />Day</button>
                <button className="btn small" onClick={() => runCmd('clear', 'Cleared weather')}><Ico name="feather" className="btn-ico" />Clear weather</button>
                <button className="btn small" onClick={() => runCmd('tp', 'Teleported to buddy')} disabled={!partnerOnline}><Ico name="ender_pearl" className="btn-ico" />Teleport to buddy</button>
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
          {session.campfire && <p className="muted small campfire-note">✦ Campfire session: up to 2 extra hours, even when it's busy</p>}
          {extendHint && <p className="muted small campfire-note"><Link to="/campfire" className="inline-link">Campfire members</Link> can extend even when it's busy.</p>}
          <p className="muted small" style={{ marginTop: 10 }}>{friends ? "When this hits zero you can save your world and download it." : "When this hits zero you'll be offered to swap socials."}</p>
          <button className="btn ghost" onClick={() => nav('/post-session')}>End early</button>
        </aside>
      </div>

      {!playing && hourPanel && <div className="hour-panel-below">{hourPanel}</div>}

      {reward && (reward.status === 'granted' || reward.status === 'claimable') && (
        <p className="referral-note in-session">
          <span className="campfire-mark" aria-hidden="true">✦</span>
          {reward.status === 'granted'
            ? `You earned a free week of the Campfire. It runs until ${new Date(reward.until).toLocaleDateString()}, from your next session.`
            : 'You earned a free week of the Campfire. Claim it after the hour: it just needs a free account.'}
        </p>
      )}

      <div className="partner-strip">
        Playing with <strong>{session.partner?.displayName}</strong> · {friends ? 'friend invite' : `${session.score}% match`}
        {live && (
          <span className={'presence ' + (partnerOnline ? 'on' : 'off')}>
            {partnerOnline ? '● in-game' : '○ not joined yet'}
          </span>
        )}
      </div>
    </section>
  )
}
