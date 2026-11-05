import { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { playError } from '../lib/sound.js'

export default function Auth({ mode }) {
  const nav = useNavigate()
  const { login, signup } = useAuth()
  const isSignup = mode === 'signup'
  // ?next=/campfire etc: where to go after. same-site paths only
  const [params] = useSearchParams()
  const next = /^\/(?!\/)[\w\-/?=&.]*$/.test(params.get('next') || '') ? params.get('next') : null

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [over13, setOver13] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (isSignup) {
        await signup({ email, password, displayName, over13 })
        nav(next || '/preferences') // first thing: set up your profile
      } else {
        await login({ email, password })
        nav(next || '/')
      }
    } catch (err) {
      setError(err.message)
      playError()
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

        {isSignup && (
          <label className="check-row">
            <input type="checkbox" checked={over13} onChange={e => setOver13(e.target.checked)} required />
            <span>I'm 13 or older, and I agree to the <Link to="/terms" className="inline-link">terms</Link></span>
          </label>
        )}

        {error && <p className="auth-error">{error}</p>}

        <button className="btn primary big" type="submit" disabled={busy || (isSignup && !over13)}>
          {busy ? 'One sec…' : isSignup ? 'Sign up' : 'Log in'}
        </button>
      </form>

      <p className="auth-switch muted">
        {isSignup ? (
          <>Already have an account? <Link to={'/login' + (next ? '?next=' + encodeURIComponent(next) : '')}>Log in</Link></>
        ) : (
          <>New here? <Link to={'/signup' + (next ? '?next=' + encodeURIComponent(next) : '')}>Create an account</Link></>
        )}
      </p>
      {!isSignup && (
        <p className="auth-switch muted"><Link to="/forgot">Forgot password?</Link></p>
      )}
    </section>
  )
}
