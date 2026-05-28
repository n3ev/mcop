import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fixedQuestions } from '../data/fixedQuestions.js'
import { variableQuestions, pickVariableQuestions } from '../data/variableQuestions.js'
import { saveSession } from '../lib/storage.js'
import { joinQueue } from '../lib/api.js'

export default function Questionnaire() {
  const nav = useNavigate()
  // pick 3 bonus questions once per mount, prefix with v_ so they count less in matching
  const variables = useMemo(() => pickVariableQuestions(3).map(q => ({ ...q, id: 'v_' + q.id })), [])
  const allQuestions = useMemo(() => [...fixedQuestions, ...variables], [variables])

  const [name, setName] = useState('')
  const [step, setStep] = useState(0) // 0 = name, 1..N = questions
  const [answers, setAnswers] = useState({})
  const [email, setEmail] = useState('')
  const [awaitingEmail, setAwaitingEmail] = useState(false)

  const total = allQuestions.length + 1 // +1 for the name step
  const progress = Math.round((step / (total - 1)) * 100)

  const submitAndNavigate = async (currentAnswers) => {
    const mcUsername = name.trim()
    const patience = currentAnswers.patience ?? 'Right now'
    saveSession({
      user: { displayName: mcUsername },
      answers: currentAnswers,
      email: email || null,
      questionIds: allQuestions.map(q => q.id),
      startedAt: Date.now(),
    })
    try {
      const { queueId } = await joinQueue({ displayName: mcUsername, mcUsername, answers: currentAnswers, email: email || null })
      saveSession({ queueId })
    } catch {
      // backend unavailable — destination page handles demo fallback
    }
    nav(patience === 'Right now' ? '/matching' : '/waiting')
  }

  const advance = (currentAnswers) => {
    if (step === allQuestions.length) {
      submitAndNavigate(currentAnswers)
    } else {
      setStep(step + 1)
    }
  }

  const onPickName = () => {
    if (!name.trim()) return
    setStep(1)
  }

  const onAnswer = (qid, value) => {
    const next = { ...answers, [qid]: value }
    setAnswers(next)
    if (qid === 'patience' && value !== 'Right now') {
      setAwaitingEmail(true)
      return
    }
    advance(next)
  }

  const onEmailSubmit = () => {
    setAwaitingEmail(false)
    advance(answers)
  }

  return (
    <section className="card">
      <div className="progress"><div className="progress-bar" style={{ width: progress + '%' }} /></div>

      {step === 0 && (
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
