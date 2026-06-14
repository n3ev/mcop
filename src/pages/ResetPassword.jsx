import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { apiReset } from '../lib/auth.js'

export default function ResetPassword() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token')

  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setBusy(true)
    try {
      await apiReset(token, password)
      setDone(true)
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  if (!token) {
    return (
      <section className="card auth-card">
        <h2>Invalid link</h2>
        <p className="muted">This reset link is missing its token. Request a new one.</p>
        <p className="auth-switch muted"><Link to="/forgot">Reset password</Link></p>
      </section>
    )
  }

  return (
    <section className="card auth-card">
      <h2>Set a new password</h2>
      {done ? (
        <>
          <p className="success">Password updated ✓</p>
          <button className="btn primary big" onClick={() => nav('/login')}>Log in</button>
        </>
      ) : (
        <form onSubmit={submit} className="auth-form">
          <input
            className="text-input"
            type="password"
            placeholder="New password (min 8 characters)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoFocus
            required
          />
          {error && <p className="auth-error">{error}</p>}
          <button className="btn primary big" type="submit" disabled={busy || !password.trim()}>
            {busy ? 'Saving…' : 'Update password'}
          </button>
        </form>
      )}
    </section>
  )
}
