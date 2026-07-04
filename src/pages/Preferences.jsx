import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { apiSavePreferences } from '../lib/auth.js'
import { profileQuestions } from '../data/profileQuestions.js'

export default function Preferences() {
  const nav = useNavigate()
  const { user, setUser, loading } = useAuth()

  const [answers, setAnswers] = useState({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // prefill from saved preferences once the user is loaded
  useEffect(() => {
    if (user?.preferences) setAnswers(user.preferences)
  }, [user])

  useEffect(() => {
    if (!loading && !user) nav('/login')
  }, [loading, user])

  const firstTime = useMemo(() => !user?.preferences || Object.keys(user.preferences).length === 0, [user])
  const answered = profileQuestions.filter(q => answers[q.id]).length
  const complete = answered === profileQuestions.length

  if (loading || !user) return null

  const pick = (qid, value) => setAnswers(a => ({ ...a, [qid]: value }))

  const save = async () => {
    setError(''); setBusy(true)
    try {
      const { user: updated } = await apiSavePreferences(answers)
      setUser(updated)
      nav('/')
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  return (
    <section className="card prefs-card">
      <h2>{firstTime ? 'Set up your profile' : 'Edit your play style'}</h2>
      <p className="muted">
        {firstTime
          ? 'Answer these once and we\'ll use them to find your best matches. You can change them anytime.'
          : 'Update your saved style, this is what we match you on by default.'}
      </p>

      <div className="prefs-list">
        {profileQuestions.map(q => (
          <div key={q.id} className="prefs-q">
            <h3 className="prefs-q-text">{q.text}</h3>
            <div className="prefs-options">
              {q.options.map(opt => (
                <button
                  key={opt}
                  className={'option' + (answers[q.id] === opt ? ' selected' : '')}
                  onClick={() => pick(q.id, opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {error && <p className="auth-error">{error}</p>}

      <div className="prefs-footer">
        <span className="muted small">{answered} of {profileQuestions.length} answered</span>
        <button className="btn primary big" disabled={busy || !complete} onClick={save}>
          {busy ? 'Saving…' : firstTime ? 'Save & continue' : 'Save changes'}
        </button>
      </div>
    </section>
  )
}
