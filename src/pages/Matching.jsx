import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import { loadSession, saveSession } from '../lib/storage.js'
import { compatibilityScore, generateFakePartner } from '../lib/matching.js'
import { fixedQuestions } from '../data/fixedQuestions.js'
import { variableQuestions } from '../data/variableQuestions.js'
import { API_URL } from '../lib/api.js'

const PHASE_INTERVAL_MS = 3500
const DEMO_FALLBACK_MS = 15000

const PHASES = [
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
]

export default function Matching() {
  const nav = useNavigate()
  const session = useMemo(() => loadSession(), [])
  const [phase, setPhase] = useState(0)
  const [partner, setPartner] = useState(null)
  const [score, setScore] = useState(0)

  const questionsById = useMemo(() => {
    const all = [
      ...fixedQuestions,
      ...variableQuestions.map(q => ({ ...q, id: 'v_' + q.id })),
    ]
    return Object.fromEntries(all.map(q => [q.id, q]))
  }, [])

  useEffect(() => {
    if (!session.answers) { nav('/'); return }

    let socket = null

    const rotateT = setInterval(() => {
      setPhase(p => (p + 1) % PHASES.length)
    }, PHASE_INTERVAL_MS)

    const showMatch = (p2, s) => {
      clearInterval(rotateT)
      setPartner(p2)
      setScore(s)
    }

    // Demo fallback — triggers if no real match arrives in time
    const demoT = setTimeout(() => {
      socket?.disconnect()
      const p2 = generateFakePartner(session.answers, questionsById)
      const s = compatibilityScore(session.answers, p2.answers)
      showMatch(p2, s)
    }, DEMO_FALLBACK_MS)

    // Real socket match
    if (session.queueId) {
      socket = io(API_URL, { transports: ['websocket'] })
      socket.emit('queue_identify', session.queueId)
      socket.on('match_found', ({ partner: p2, score: s }) => {
        clearTimeout(demoT)
        showMatch(p2, s)
      })
    }

    return () => {
      clearInterval(rotateT)
      clearTimeout(demoT)
      socket?.disconnect()
    }
  }, [])

  const goPlay = () => {
    saveSession({ partner, score })
    nav('/session')
  }

  if (!partner) {
    return (
      <section className="card center">
        <div className="spinner" />
        <h2>{PHASES[phase]}</h2>
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
