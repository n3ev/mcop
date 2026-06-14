import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Auth({ mode }) {
  const nav = useNavigate()
  const { login, signup } = useAuth()
  const isSignup = mode === 'signup'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (isSignup) {
        await signup({ email, password, displayName })
        nav('/preferences') // first thing: set up your profile
      } else {
        await login({ email, password })
        nav('/')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card auth-card">
      <h2>{isSignup ? 'Create your account' : 'Welcome back'}</h2>
      <p className="muted">
        {isSignup
          ? 'Save your stats, track who you played with, and link your Minecraft account.'
          : 'Sign in to pick up where you left off.'}
      </p>

      <form onSubmit={submit} className="auth-form">
        {isSignup && (
          <input
            className="text-input"
            placeholder="Display name (optional)"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
          />
        )}
        <input
          className="text-input"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoFocus
          required
        />
        <input
          className="text-input"
          type="password"
          placeholder={isSignup ? 'Password (min 8 characters)' : 'Password'}
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />

        {error && <p className="auth-error">{error}</p>}

        <button className="btn primary big" type="submit" disabled={busy}>
          {busy ? 'One sec…' : isSignup ? 'Sign up' : 'Log in'}
        </button>
      </form>

      <p className="auth-switch muted">
        {isSignup ? (
          <>Already have an account? <Link to="/login">Log in</Link></>
        ) : (
          <>New here? <Link to="/signup">Create an account</Link></>
        )}
      </p>
      {!isSignup && (
        <p className="auth-switch muted"><Link to="/forgot">Forgot password?</Link></p>
      )}
    </section>
  )
}
