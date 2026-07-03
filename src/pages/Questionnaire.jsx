import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fixedQuestions, patienceQuestion } from '../data/fixedQuestions.js'
import { useAuth } from '../context/AuthContext.jsx'
import { startMatch } from '../lib/play.js'
import Avatar from '../components/Avatar.jsx'

// the temporary / one-off flow: guests, or a logged-in user trying a different style for a single session.
// nothing here is saved to the account — permanent preferences live on /preferences.
export default function Questionnaire() {
  const nav = useNavigate()
  const { user } = useAuth()

  // verified accounts already have a linked username, so skip that step
  const needsName = !user || !user.mcVerified

  const [name, setName] = useState('')
  const [step, setStep] = useState(needsName ? 0 : 1) // 0 = name, 1..N = questions
  const [answers, setAnswers] = useState({})
  const [phase, setPhase] = useState('questions') // questions | patience | email
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)

  const totalQ = fixedQuestions.length
  const progress = Math.min(100, Math.round((step / (totalQ + 1)) * 100))

  const identity = () => ({
    displayName: needsName ? name.trim() : (user.displayName || user.mcUsername),
    mcUsername: needsName ? name.trim() : user.mcUsername,
  })

  const play = async (finalAnswers, finalEmail) => {
    setBusy(true)
    const { displayName, mcUsername } = identity()
    const target = await startMatch({ displayName, mcUsername, answers: finalAnswers, email: finalEmail || email || user?.email || null })
    nav(target)
  }

  const onPickName = () => { if (name.trim()) setStep(1) }

  const onAnswer = (qid, value) => {
    const next = { ...answers, [qid]: value }
    setAnswers(next)
    if (step === totalQ) setPhase('patience')   // done with the core questions
    else setStep(step + 1)
  }

  const onPatience = (value) => {
    const next = { ...answers, patience: value }
    setAnswers(next)
    if (value !== 'Right now' && !user) setPhase('email') // guests leave an email
    else play(next)
  }

  // name step
  if (phase === 'questions' && step === 0 && needsName) {
    return (
      <section className="card">
        <div className="progress"><div className="progress-bar" style={{ width: progress + '%' }} /></div>
        <div className="step">
          <span className="tag">Step 1</span>
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
          {name.trim().length >= 3 && (
            <div className="skin-preview">
              <Avatar name={name.trim()} size={56} />
              <span className="muted small">Found your skin — looking good.</span>
            </div>
          )}
          <button className="btn primary" disabled={!name.trim()} onClick={onPickName}>Continue</button>
        </div>
      </section>
    )
  }

  // patience step
  if (phase === 'patience') {
    return (
      <section className="card">
        <div className="progress"><div className="progress-bar" style={{ width: '90%' }} /></div>
        <div className="step">
          <span className="tag">Last one</span>
          <h2>{patienceQuestion.text}</h2>
          <div className="options">
            {patienceQuestion.options.map(opt => (
              <button key={opt} className="option" disabled={busy} onClick={() => onPatience(opt)}>{opt}</button>
            ))}
          </div>
        </div>
      </section>
    )
  }

  // email step (guests choosing a non-instant tier)
  if (phase === 'email') {
    return (
      <section className="card">
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
            onKeyDown={e => e.key === 'Enter' && email.trim() && play(answers, email)}
            autoFocus
          />
          <button className="btn primary" disabled={!email.trim() || busy} onClick={() => play(answers, email)}>
            Lock in my spot →
          </button>
        </div>
      </section>
    )
  }

  // a core question
  const q = fixedQuestions[step - 1]
  return (
    <section className="card">
      <div className="progress"><div className="progress-bar" style={{ width: progress + '%' }} /></div>
      <div className="step">
        <span className="tag">Question {step}/{totalQ}</span>
        <h2>{q.text}</h2>
        <div className="options">
          {q.options.map(opt => (
            <button key={opt} className="option" onClick={() => onAnswer(q.id, opt)}>{opt}</button>
          ))}
        </div>
      </div>
    </section>
  )
}
