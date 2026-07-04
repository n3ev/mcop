import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { apiVerifyEmail } from '../lib/auth.js'
import { playXp, playError } from '../lib/sound.js'

// landing page for the link in the "verify your email" mail
export default function VerifyEmail() {
  const [params] = useSearchParams()
  const { user, setUser } = useAuth()
  const [state, setState] = useState('checking') // checking | done | failed
  const [error, setError] = useState('')

  useEffect(() => {
    const token = params.get('token')
    if (!token) { setState('failed'); setError('This link is missing its token.'); return }
    let on = true
    apiVerifyEmail(token)
      .then(({ user: updated }) => {
        if (!on) return
        setState('done')
        playXp()
        if (user && updated && updated.id === user.id) setUser(updated)
      })
      .catch((e) => {
        if (!on) return
        setState('failed')
        setError(e.message)
        playError()
      })
    return () => { on = false }
  }, [])

  if (state === 'checking') {
    return <section className="card center"><div className="spinner" /><h2>Checking your link…</h2></section>
  }

  if (state === 'failed') {
    return (
      <section className="card center">
        <h2>That link didn't work</h2>
        <p className="muted">{error || 'It may have expired.'} You can request a fresh one from your account page.</p>
        <Link to="/account" className="btn primary">Go to my account</Link>
      </section>
    )
  }

  return (
    <section className="card center">
      <span className="tag good">Verified</span>
      <h2>Your email is confirmed ✓</h2>
      <p className="muted">We can reach you when a buddy is ready. That's all we'll use it for.</p>
      <Link to="/" className="btn primary">Back to the world</Link>
    </section>
  )
}
