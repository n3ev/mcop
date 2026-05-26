import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadSession, saveSession } from '../lib/storage.js'
import { compatibilityScore, generateFakePartner } from '../lib/matching.js'
import { fixedQuestions } from '../data/fixedQuestions.js'
import { variableQuestions } from '../data/variableQuestions.js'

const MATCH_DELAY_MS = 9000
const PHASE_INTERVAL_MS = 3500

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

  // Build a question lookup so the fake partner picks valid options.
  const questionsById = useMemo(() => {
    const all = [
      ...fixedQuestions,
      ...variableQuestions.map(q => ({ ...q, id: 'v_' + q.id })),
    ]
    return Object.fromEntries(all.map(q => [q.id, q]))
  }, [])

  useEffect(() => {
    if (!session.answers) {
      nav('/')
      return
    }
    const rotateT = setInterval(() => {
      setPhase(p => (p + 1) % PHASES.length)
    }, PHASE_INTERVAL_MS)

    const matchT = setTimeout(() => {
      clearInterval(rotateT)
      const p2 = generateFakePartner(session.answers, questionsById)
      const s = compatibilityScore(session.answers, p2.answers)
      setPartner(p2)
      setScore(s)
    }, MATCH_DELAY_MS)

    return () => {
      clearInterval(rotateT)
      clearTimeout(matchT)
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

  return (
    <section className="card center">
      <span className="tag good">Match found</span>
      <h2 className="match-name">You're paired with <span className="highlight">{partner.displayName}</span></h2>
      <div className="score">
        <span className="score-num">{score}%</span>
        <span className="score-label">compatibility</span>
      </div>
      <p className="muted">Both of you are about to share a private Minecraft world for one hour.</p>
      <button className="btn primary big" onClick={goPlay}>Open the server →</button>
    </section>
  )
}
