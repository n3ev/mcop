import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fixedQuestions } from '../data/fixedQuestions.js'
import { variableQuestions, pickVariableQuestions } from '../data/variableQuestions.js'
import { useAuth } from '../context/AuthContext.jsx'
import { apiSavePreferences } from '../lib/auth.js'
import { startMatch } from '../lib/play.js'

export default function Questionnaire() {
  const nav = useNavigate()
  const { user, setUser } = useAuth()

  // verified accounts skip the username step — we use their linked username.
  // guests and unverified accounts still type one.
  const needsName = !user || !user.mcVerified

  // pick 3 bonus questions once per mount, prefix with v_ so they count less in matching
  const variables = useMemo(() => pickVariableQuestions(3).map(q => ({ ...q, id: 'v_' + q.id })), [])
  const allQuestions = useMemo(() => [...fixedQuestions, ...variables], [variables])

  const [name, setName] = useState('')
  const [step, setStep] = useState(needsName ? 0 : 1) // 0 = name, 1..N = questions
  const [answers, setAnswers] = useState({})
  const [email, setEmail] = useState('')
  const [awaitingEmail, setAwaitingEmail] = useState(false)
  const [savedView, setSavedView] = useState(false) // logged-in "preferences saved" screen
  const [busy, setBusy] = useState(false)

  const progress = Math.min(100, Math.round((step / allQuestions.length) * 100))

  const identity = () => ({
    displayName: needsName ? name.trim() : (user.displayName || user.mcUsername),
    mcUsername: needsName ? name.trim() : user.mcUsername,
  })

  const play = async (finalAnswers) => {
    setBusy(true)
    const { displayName, mcUsername } = identity()
    const target = await startMatch({ displayName, mcUsername, answers: finalAnswers, email: email || null })
    nav(target)
  }

  // reached the end of the questions
  const finish = async (finalAnswers) => {
    if (user) {
      // save to the account, then let them choose to play now or head back
      try {
        const { user: updated } = await apiSavePreferences(finalAnswers)
        setUser(updated)
      } catch { /* ignore, they can still play */ }
      setSavedView(true)
    } else {
      play(finalAnswers)
    }
  }

  const advance = (currentAnswers) => {
    if (step === allQuestions.length) finish(currentAnswers)
    else setStep(step + 1)
  }

  const onPickName = () => {
    if (!name.trim()) return
    setStep(1)
  }

  const onAnswer = (qid, value) => {
    const next = { ...answers, [qid]: value }
    setAnswers(next)
    // guests give an email for the non-instant patience tiers
    if (qid === 'patience' && value !== 'Right now' && !user) {
      setAwaitingEmail(true)
      return
    }
    advance(next)
  }

  const onEmailSubmit = () => {
    setAwaitingEmail(false)
    advance(answers)
  }

  if (savedView) {
    return (
      <section className="card center">
        <span className="tag good">Saved</span>
        <h2>Your play style is locked in</h2>
        <p className="muted">We'll remember these so you can jump straight into a match next time.</p>
        <div className="saved-actions">
          <button className="btn primary big" disabled={busy} onClick={() => play(answers)}>
            {busy ? 'Finding your buddy…' : 'Play now ⛏'}
          </button>
          <button className="btn ghost" onClick={() => nav('/')}>Back to dashboard</button>
        </div>
      </section>
    )
  }

  return (
    <section className="card">
      <div className="progress"><div className="progress-bar" style={{ width: progress + '%' }} /></div>

      {step === 0 && needsName && (
        <div className="step">
          <h2>What's your Minecraft username?</h2>
          <p className="muted">Must match your in-game name exactly — we use it to whitelist you on the server.</p>
          <input
            className="text-input"
            placeholder="e.g. Steve, xX_Notch_Xx"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onPickName()}
            autoFocus
          />
          <button className="btn primary" disabled={!name.trim()} onClick={onPickName}>Continue</button>
        </div>
      )}

      {awaitingEmail && (
        <div className="step">
          <span className="tag">One more thing</span>
          <h2>What's your email?</h2>
          <p className="muted">We'll ping you the moment your match is ready.</p>
          <input
            className="text-input"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && email.trim() && onEmailSubmit()}
            autoFocus
          />
          <button className="btn primary" disabled={!email.trim()} onClick={onEmailSubmit}>
            Lock in my spot →
          </button>
        </div>
      )}

      {step >= 1 && !awaitingEmail && (() => {
        const q = allQuestions[step - 1]
        const isVariable = q.id.startsWith('v_')
        return (
          <div className="step">
            <span className="tag">{isVariable ? 'Bonus question' : `Question ${step} of ${fixedQuestions.length}`}</span>
            <h2>{q.text}</h2>
            <div className="options">
              {q.options.map(opt => (
                <button key={opt} className="option" onClick={() => onAnswer(q.id, opt)}>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )
      })()}
    </section>
  )
}
