import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { linkStart, linkVerify, linkStatus } from '../lib/mc.js'
import { toast } from '../lib/toast.js'
import { playXp } from '../lib/sound.js'

export default function Account() {
  const nav = useNavigate()
  const { user, setUser, loading, logout } = useAuth()

  const [phase, setPhase] = useState('idle') // idle | joining | done
  const [username, setUsername] = useState('')
  const [serverHost, setServerHost] = useState('')
  const [code, setCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  // not logged in? bounce to login
  useEffect(() => {
    if (!loading && !user) nav('/login')
  }, [loading, user])

  // while waiting for them to join, poll so we can say "check your chat"
  useEffect(() => {
    if (phase !== 'joining') return
    const t = setInterval(async () => {
      try {
        const { codeSent } = await linkStatus()
        if (codeSent) setCodeSent(true)
      } catch { /* ignore */ }
    }, 4000)
    return () => clearInterval(t)
  }, [phase])

  if (loading || !user) return null

  const start = async () => {
    setError(''); setBusy(true)
    try {
      const { serverHost } = await linkStart(username.trim())
      setServerHost(serverHost)
      setPhase('joining')
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  const verify = async () => {
    setError(''); setBusy(true)
    try {
      const { user: updated } = await linkVerify(code.trim())
      setUser(updated)
      setPhase('done')
      playXp()
      toast('Minecraft account linked')
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  const copyHost = () => {
    navigator.clipboard?.writeText(serverHost)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <section className="card account-card">
      <h2>Your account</h2>
      <div className="account-rows">
        <div className="account-row">
          <span className="account-key">Email</span>
          <span>{user.email}</span>
        </div>
        <div className="account-row">
          <span className="account-key">Display name</span>
          <span>{user.displayName || '—'}</span>
        </div>
        <div className="account-row">
          <span className="account-key">Minecraft</span>
          <span>
            {user.mcVerified
              ? <>{user.mcUsername} <span className="mc-badge">✓ verified</span></>
              : <span className="muted">not linked</span>}
          </span>
        </div>
      </div>

      {!user.mcVerified && (
        <div className="link-box">
          <h3>Link your Minecraft account</h3>

          {phase === 'idle' && (
            <>
              <p className="muted small">We'll have you join a quick server and message you a code in-game to prove the account is yours.</p>
              <input
                className="text-input"
                placeholder="Your Minecraft username"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
              <button className="btn primary" disabled={busy || !username.trim()} onClick={start}>
                {busy ? 'One sec…' : 'Get my code'}
              </button>
            </>
          )}

          {phase === 'joining' && (
            <>
              <ol className="steps">
                <li>Open Minecraft (1.21.4) → Multiplayer → Add Server</li>
                <li>
                  Join <code>{serverHost}</code>
                  <button className="btn small" style={{ marginLeft: 8 }} onClick={copyHost}>{copied ? 'Copied ✓' : 'Copy'}</button>
                </li>
                <li>{codeSent ? '✅ We see you — check your in-game chat for the code' : 'Once you\'re on, we\'ll message your code in chat'}</li>
              </ol>
              <input
                className="text-input"
                placeholder="Enter the 6-digit code"
                value={code}
                onChange={e => setCode(e.target.value)}
                inputMode="numeric"
              />
              <button className="btn primary" disabled={busy || !code.trim()} onClick={verify}>
                {busy ? 'Checking…' : 'Verify'}
              </button>
            </>
          )}

          {phase === 'done' && (
            <p className="success">Linked ✓ Your Minecraft account is verified.</p>
          )}

          {error && <p className="auth-error">{error}</p>}
        </div>
      )}

      <div className="cta-row" style={{ marginTop: 24 }}>
        <button className="btn ghost" onClick={logout}>Log out</button>
      </div>
    </section>
  )
}
