import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import { loadSession, saveSession } from '../lib/storage.js'
import { API_URL } from '../lib/api.js'
import { askNotifyPermission, notifyMatchFound } from '../lib/notify.js'
import { joinSavedQueue } from '../lib/play.js'
import { unlock } from '../lib/achievements.js'
import MatchOffline from '../components/MatchOffline.jsx'
import ShareInvite from '../components/ShareInvite.jsx'
import MatchNight from '../components/MatchNight.jsx'

const PUNS = [
  "Your duo is strip-mining at y=-59. We'll drag them up.",
  "They're lost in a cave. Classic.",
  "Currently negotiating with a villager on your behalf.",
  "Your future buddy is AFK. We're throwing snowballs at them.",
  "They punched a tree and now they're building a mansion. Give them a sec.",
  "Somewhere out there, a Creeper just ended their run. They'll be back.",
  "Loading chunks. You know how it is.",
  "Your match is 47 blocks underground and completely fine.",
]

export default function Waiting() {
  const nav = useNavigate()
  const session = useMemo(() => loadSession(), [])
  const [pun] = useState(() => PUNS[Math.floor(Math.random() * PUNS.length)])
  const [position, setPosition] = useState(null)
  const [offline, setOffline] = useState(() => !loadSession().queueId)
  const [attempt, setAttempt] = useState(0)   // bumps after a successful retry

  const patience = session.answers?.patience ?? 'Within 1 hour'

  useEffect(() => {
    if (!session.answers) { nav('/'); return }
    const queueId = loadSession().queueId
    if (!queueId) { setOffline(true); return }   // the server couldn't be reached
    setOffline(false)

    askNotifyPermission()
    const socket = io(API_URL, { transports: ['websocket'], reconnectionAttempts: 4 })
    let fails = 0
    socket.on('connect_error', () => {
      if (++fails < 4) return
      socket.disconnect()
      setOffline(true)
    })
    socket.emit('queue_identify', queueId)

    socket.on('queue_joined', ({ position: pos }) => setPosition(pos))

    socket.on('match_found', ({ partner, score, server, matchId, role, quest, modes, endsAt, campfire }) => {
      saveSession({ partner, score, server, matchId, role, quest, modes: modes || null, endsAt, party: false, campfire: !!campfire })
      notifyMatchFound(partner?.displayName || 'your buddy')
      unlock('player-two')
      socket.disconnect()
      nav('/session')
    })

    return () => socket.disconnect()
  }, [attempt])

  if (offline) {
    return <MatchOffline onRetry={async () => { const ok = await joinSavedQueue(); if (ok) setAttempt(a => a + 1); return ok }} />
  }

  return (
    <section className="card center">
      <span className="tag">You're in the queue</span>
      <h2 className="waiting-pun">{pun}</h2>
      <p className="muted">
        We'll email <strong>{session.email}</strong> the moment your match is ready.
        {position && <> You're <strong>#{position}</strong> in line.</>}
      </p>
      <div className="waiting-tier">
        Patience tier: <strong>{patience}</strong>
      </div>
      <p className="muted small">
        Keep this tab open and we'll drop you straight into the server when matched.
        Or close it, the email has everything you need.
      </p>
      <MatchNight className="in-card" />
      <ShareInvite compact label="Bring a buddy faster" />
      <button className="btn ghost" onClick={() => nav('/')}>Back to start</button>
    </section>
  )
}
