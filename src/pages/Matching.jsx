import { useEffect, useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { io } from 'socket.io-client'
import { loadSession, saveSession } from '../lib/storage.js'
import { fixedQuestions, patienceQuestion } from '../data/fixedQuestions.js'
import { profileQuestions } from '../data/profileQuestions.js'
import { variableQuestions } from '../data/variableQuestions.js'
import { API_URL } from '../lib/api.js'
import Avatar from '../components/Avatar.jsx'
import { playXp } from '../lib/sound.js'
import { fireworks } from '../lib/particles.js'
import { toast } from '../lib/toast.js'
import { askNotifyPermission, notifyMatchFound } from '../lib/notify.js'
import { joinSavedQueue } from '../lib/play.js'
import { unlock } from '../lib/achievements.js'
import MatchOffline from '../components/MatchOffline.jsx'
import ShareInvite from '../components/ShareInvite.jsx'
import MatchNight from '../components/MatchNight.jsx'

const PHASE_INTERVAL_MS = 3500
const QUIET_MS = 75000 // this long with no match and the queue's just quiet: say so

const ALL_PHASES = [
  'Scouting the End cities…',
  'Brewing potion of compatibility…',
  'Sorting through 1,247 candidates…',
  'Consulting the village librarian…',
  'Checking diamond vein coordinates…',
  'Rolling for loot table compatibility…',
  'Negotiating with the piglin brutes…',
  'Triangulating spawn points…',
  'Waiting for the stronghold to load…',
  'Scanning active server logs…',
  'Asking the wandering trader…',
  'Comparing enchantment tables…',
  'Herding the cats… and the players…',
  'Planting carrots while we wait…',
  'Speed-running the matching algorithm…',
  'Checking if your buddy rage-quit yet…',
  'Trading emeralds for a good match…',
  'Digging straight down to find someone…',
  'Avoiding lava on the way to your match…',
  'Building a dirt house for temporary shelter…',
  'Looking for someone who also punched a tree today…',
  'Counting creepers in the queue…',
  'Asking Herobrine for help (no response)…',
  'Enchanting your patience with Infinity…',
  'Locating nearest village with good vibes…',
  'Calculating nether portal coordinates…',
  'Waiting for the chunks to load…',
  'Polling the ender dragon for suggestions…',
  'Cross-referencing seed values…',
  "Making sure your match isn't a griefer…",
  'Checking biome preferences…',
  'Consulting the ancient debris…',
  'Someone in the queue keeps dying to fall damage…',
  'Almost there, probably…',
]

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function Matching() {
  const nav = useNavigate()
  const session = useMemo(() => loadSession(), [])
  const phases = useMemo(() => shuffle(ALL_PHASES), [])
  const seed = useMemo(() => String((Math.random() * 2 - 1) * 9007199254740991 | 0), [])
  const [phase, setPhase] = useState(0)
  const [partner, setPartner] = useState(null)
  const [score, setScore] = useState(0)
  const [server, setServer] = useState(null)
  const [matchMeta, setMatchMeta] = useState({ matchId: null, role: null, quest: null, modes: null, endsAt: null })
  const [offline, setOffline] = useState(() => !loadSession().queueId)
  const [quiet, setQuiet] = useState(false)
  const [attempt, setAttempt] = useState(0)   // bumps after a successful retry

  const questionsById = useMemo(() => {
    const all = [
      ...fixedQuestions,
      ...profileQuestions,
      patienceQuestion,
      ...variableQuestions.map(q => ({ ...q, id: 'v_' + q.id })),
    ]
    return Object.fromEntries(all.map(q => [q.id, q]))
  }, [])

  useEffect(() => {
    if (!session.answers) { nav('/'); return }
    const queueId = loadSession().queueId
    if (!queueId) { setOffline(true); return }   // the server couldn't be reached at all
    setOffline(false)
    setQuiet(false)
    askNotifyPermission()

    const rotateT = setInterval(() => {
      setPhase(p => (p + 1) % phases.length)
    }, PHASE_INTERVAL_MS)

    const showMatch = (p2, s, srv, meta) => {
      clearInterval(rotateT)
      setPartner(p2)
      setScore(Math.max(s, 60))
      setServer(srv)
      if (meta) setMatchMeta(meta)
      playXp()
      fireworks()
      toast(`Buddy found: ${p2.displayName}`, '/assets/textures/items/totem_of_undying.png')
      unlock('player-two')
      notifyMatchFound(p2.displayName)
    }

    // no match for a while: nobody suitable is in the queue yet. keep waiting,
    // honestly — the socket stays open and the match lands whenever it lands
    const quietT = setTimeout(() => setQuiet(true), QUIET_MS)

    const socket = io(API_URL, { transports: ['websocket'], reconnectionAttempts: 4 })
    let fails = 0
    socket.on('connect_error', () => {
      if (++fails < 4) return
      socket.disconnect()
      setOffline(true)
    })
    socket.emit('queue_identify', queueId)
    socket.on('match_found', ({ partner: p2, score: s, server: srv, matchId, role, quest, modes, endsAt, campfire }) => {
      clearTimeout(quietT)
      showMatch(p2, s, srv, { matchId, role, quest, modes: modes || null, endsAt, party: false, campfire: !!campfire })
    })

    return () => {
      clearInterval(rotateT)
      clearTimeout(quietT)
      socket.disconnect()
    }
  }, [attempt])

  const goPlay = () => {
    saveSession({
      partner, score, server,
      matchId: matchMeta.matchId, role: matchMeta.role,
      quest: matchMeta.quest, modes: matchMeta.modes, endsAt: matchMeta.endsAt,
    })
    nav('/session')
  }

  if (offline) {
    return <MatchOffline onRetry={async () => { const ok = await joinSavedQueue(); if (ok) setAttempt(a => a + 1); return ok }} />
  }

  if (!partner) {
    return (
      <section className="card center">
        <span className="tag">Generating world</span>
        <div className="compass" aria-hidden="true"><span className="compass-needle" /></div>
        <h2>{phases[phase]}</h2>
        <div className="xpbar" role="progressbar" aria-label="Finding your buddy">
          <div className="xpbar-fill" />
        </div>
        {quiet ? (
          <>
            <p className="muted">
              The queue's quiet right now: nobody who fits you has joined yet. Keep this tab
              open and you're in the moment someone does.
            </p>
            <MatchNight className="in-card" />
            <p className="muted small">
              Know someone who plays? <Link to="/invite" className="inline-link">Make an invite link</Link> and
              skip the queue.
            </p>
            <ShareInvite compact label="Bring a buddy faster" />
          </>
        ) : (
          <p className="muted">Hang tight: you'll be paired with the first good fit that joins.</p>
        )}
        <p className="gen-seed">Seed: {seed} · Biome: Friendship Plains</p>
      </section>
    )
  }

  const breakdown = Object.keys(partner.answers)
    .filter(qid => qid !== 'patience' && qid !== 'age') // age is a filter (you're always in the same group), not a match
    .map(qid => ({
      qid,
      q: questionsById[qid],
      theirAnswer: partner.answers[qid],
      myAnswer: session.answers?.[qid],
    }))
    .filter(({ q }) => q)

  return (
    <section className="card center">
      <span className="tag good">Match found</span>
      <Avatar name={partner.mcUsername || partner.displayName} size={72} className="match-avatar" />
      <h2 className="match-name">You're paired with <span className="highlight">{partner.displayName}</span></h2>
      <div className="score">
        <span className="score-num">{score}%</span>
        <div className="hearts-row" role="img" aria-label={`${Math.round(score / 10)} of 10 hearts`}>
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} className={'px-heart' + (i < Math.round(score / 10) ? ' full' : '')} />
          ))}
        </div>
        <span className="score-label">compatibility</span>
      </div>

      {breakdown.length > 0 && (
        <div className="answer-breakdown">
          <p className="breakdown-label">How they play</p>
          {breakdown.map(({ qid, q, theirAnswer, myAnswer }) => (
            <div key={qid} className="answer-row">
              <span className="answer-q">{q.text}</span>
              <div className="answer-vals">
                <span className="answer-them">{theirAnswer}</span>
                {myAnswer === theirAnswer
                  ? <span className="answer-badge match">✓ same as you</span>
                  : myAnswer && <span className="answer-badge diff">You: {myAnswer}</span>
                }
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="muted" style={{ marginTop: 24 }}>Both of you are about to share a private Minecraft world for one hour.</p>
      <button className="btn primary big" onClick={goPlay}>Open the server →</button>
    </section>
  )
}
