import { useState } from 'react'
import { Link } from 'react-router-dom'
import { apiForgot } from '../lib/auth.js'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    await apiForgot(email)
    setBusy(false)
    setSent(true)
  }

  return (
    <section className="card auth-card">
      <h2>Reset your password</h2>
      {sent ? (
        <>
          <p className="muted">If an account exists for <strong>{email}</strong>, we've sent a reset link. Check your inbox.</p>
          <p className="auth-switch muted"><Link to="/login">Back to log in</Link></p>
        </>
      ) : (
        <>
          <p className="muted">Enter your email and we'll send you a link to set a new password.</p>
          <form onSubmit={submit} className="auth-form">
            <input
              className="text-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoFocus
              required
            />
            <button className="btn primary big" type="submit" disabled={busy || !email.trim()}>
              {busy ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
          <p className="auth-switch muted"><Link to="/login">Back to log in</Link></p>
        </>
      )}
    </section>
  )
}
