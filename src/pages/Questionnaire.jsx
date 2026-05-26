import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fixedQuestions } from '../data/fixedQuestions.js'
import { variableQuestions, pickVariableQuestions } from '../data/variableQuestions.js'
import { saveSession } from '../lib/storage.js'

export default function Questionnaire() {
  const nav = useNavigate()
  // Pick 3 variable questions ONCE per mount. Prefix their IDs with v_ so matching weights them lower.
  const variables = useMemo(() => pickVariableQuestions(3).map(q => ({ ...q, id: 'v_' + q.id })), [])
  const allQuestions = useMemo(() => [...fixedQuestions, ...variables], [variables])

  const [name, setName] = useState('')
  const [step, setStep] = useState(0) // 0 = name, 1..N = questions
  const [answers, setAnswers] = useState({})

  const total = allQuestions.length + 1 // +1 for the name step
  const progress = Math.round((step / (total - 1)) * 100)

  const onPickName = () => {
    if (!name.trim()) return
    setStep(1)
  }

  const onAnswer = (qid, value) => {
    const next = { ...answers, [qid]: value }
    setAnswers(next)
    const isLast = step === allQuestions.length
    if (isLast) {
      saveSession({
        user: { displayName: name.trim() },
        answers: next,
        questionIds: allQuestions.map(q => q.id),
        startedAt: Date.now(),
      })
      nav('/matching')
    } else {
      setStep(step + 1)
    }
  }

  return (
    <section className="card">
      <div className="progress"><div className="progress-bar" style={{ width: progress + '%' }} /></div>

      {step === 0 && (
        <div className="step">
          <h2>What should we call you?</h2>
          <p className="muted">This is just for the session. No account needed.</p>
          <input
            className="text-input"
            placeholder="Steve, AlexCrafter, etc."
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onPickName()}
            autoFocus
          />
          <button className="btn primary" disabled={!name.trim()} onClick={onPickName}>Continue</button>
        </div>
      )}

      {step >= 1 && (() => {
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
