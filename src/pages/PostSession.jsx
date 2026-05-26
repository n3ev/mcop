import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadSession, clearSession } from '../lib/storage.js'
import { releaseServer } from '../lib/serverPool.js'

const SOCIALS = [
  { id: 'discord',   label: 'Discord',   placeholder: 'username#0000 or @user' },
  { id: 'instagram', label: 'Instagram', placeholder: '@handle' },
  { id: 'snapchat',  label: 'Snapchat',  placeholder: '@handle' },
  { id: 'steam',     label: 'Steam',     placeholder: 'profile URL or ID' },
  { id: 'none',      label: 'No thanks', placeholder: '' },
]

export default function PostSession() {
  const nav = useNavigate()
  const session = useMemo(() => loadSession(), [])
  const [picked, setPicked] = useState('discord')
  const [handle, setHandle] = useState('')
  const [shared, setShared] = useState(false)
  const [saveRequested, setSaveRequested] = useState(false)

  // Free up the server slot once they reach this page
  useMemo(() => {
    if (session.server?.id) releaseServer(session.server.id)
  }, [])

  const submitShare = (e) => {
    e.preventDefault()
    // TODO: POST to backend so both players see each other's contact
    setShared(true)
  }

  const requestSave = () => {
    // TODO: POST to backend → trigger world archive on your Aternos pool server
    setSaveRequested(true)
  }

  const newSession = () => {
    clearSession()
    nav('/')
  }

  return (
    <section className="card">
      <h2>Hour's up — that was fun.</h2>
      <p className="muted">
        You played with <strong>{session.partner?.displayName}</strong> ({session.score}% match)
        on <code>{session.server?.host}</code>.
      </p>

      <div className="post-grid">
        <div className="post-card">
          <h3>Stay in touch?</h3>
          <p className="muted small">Optional. We'll only share your handle if your buddy shares back.</p>

          {!shared ? (
            <form onSubmit={submitShare}>
              <div className="chip-row">
                {SOCIALS.map(s => (
                  <button
                    type="button"
                    key={s.id}
                    className={'chip' + (picked === s.id ? ' chip-active' : '')}
                    onClick={() => setPicked(s.id)}
                  >{s.label}</button>
                ))}
              </div>
              {picked !== 'none' && (
                <input
                  className="text-input"
                  placeholder={SOCIALS.find(s => s.id === picked)?.placeholder}
                  value={handle}
                  onChange={e => setHandle(e.target.value)}
                />
              )}
              <button className="btn primary" type="submit" disabled={picked !== 'none' && !handle.trim()}>
                {picked === 'none' ? 'Skip sharing' : 'Share with buddy'}
              </button>
            </form>
          ) : (
            <p className="success">Shared. If your buddy reciprocates, we'll email both of you.</p>
          )}
        </div>

        <div className="post-card">
          <h3>Save your world</h3>
          <p className="muted small">
            We can keep <strong>{session.server?.world}</strong> alive on our Aternos pool for one free month
            so you can hop back in.
          </p>
          {!saveRequested ? (
            <button className="btn primary" onClick={requestSave}>Save world — free for 30 days</button>
          ) : (
            <p className="success">Saved ✓ You'll get the connect details by email.</p>
          )}
          <p className="muted small soon">
            <em>Coming soon:</em> keep playing past 30 days for $3.99/month.
          </p>
        </div>
      </div>

      <div className="cta-row">
        <button className="btn ghost" onClick={newSession}>Find another buddy</button>
      </div>
    </section>
  )
}
