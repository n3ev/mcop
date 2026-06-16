import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import { loadSession, saveSession } from '../lib/storage.js'
import { compatibilityScore, generateFakePartner } from '../lib/matching.js'
import { fixedQuestions, patienceQuestion } from '../data/fixedQuestions.js'
import { profileQuestions } from '../data/profileQuestions.js'
import { variableQuestions } from '../data/variableQuestions.js'
import { API_URL } from '../lib/api.js'
import Avatar from '../components/Avatar.jsx'

const PHASE_INTERVAL_MS = 3500
const DEMO_FALLBACK_MS = 90000

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
  'Almost there — probably…',
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
  const [phase, setPhase] = useState(0)
  const [partner, setPartner] = useState(null)
  const [score, setScore] = useState(0)
  const [server, setServer] = useState(null)
  const [matchMeta, setMatchMeta] = useState({ matchId: null, role: null })

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

    let socket = null

    const rotateT = setInterval(() => {
      setPhase(p => (p + 1) % phases.length)
    }, PHASE_INTERVAL_MS)

    const showMatch = (p2, s, srv, meta) => {
      clearInterval(rotateT)
      setPartner(p2)
      setScore(Math.max(s, 60))
      setServer(srv)
      if (meta) setMatchMeta(meta)
    }

    // demo fallback if no real match shows up in time
    const demoT = setTimeout(() => {
      socket?.disconnect()
      const p2 = generateFakePartner(session.answers, questionsById)
      const s = compatibilityScore(session.answers, p2.answers)
      showMatch(p2, s, { host: 'videos-treating.gl.joinmc.link', port: 25565, world: 'mcop-world', note: 'Your private MCOP session' }, null)
    }, DEMO_FALLBACK_MS)

    // real socket match
    if (session.queueId) {
      socket = io(API_URL, { transports: ['websocket'] })
      socket.emit('queue_identify', session.queueId)
      socket.on('match_found', ({ partner: p2, score: s, server: srv, matchId, role }) => {
        clearTimeout(demoT)
        showMatch(p2, s, srv, { matchId, role })
      })
    }

    return () => {
      clearInterval(rotateT)
      clearTimeout(demoT)
      socket?.disconnect()
    }
  }, [])

  const goPlay = () => {
    saveSession({ partner, score, server, matchId: matchMeta.matchId, role: matchMeta.role })
    nav('/session')
  }

  if (!partner) {
    return (
      <section className="card center">
        <h2>{phases[phase]}</h2>
        <div className="xpbar" role="progressbar" aria-label="Finding your buddy">
          <div className="xpbar-fill" />
        </div>
        <p className="muted">Hang tight — this usually takes under a minute.</p>
      </section>
    )
  }

  const breakdown = Object.keys(partner.answers)
    .filter(qid => qid !== 'patience')
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
