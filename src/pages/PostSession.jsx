import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadSession, clearSession } from '../lib/storage.js'
import { shareContact, getPartnerContact } from '../lib/session.js'

const SOCIALS = [
  { id: 'discord',   label: 'Discord',   placeholder: 'username or @user' },
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
  const [partnerContact, setPartnerContact] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [saveRequested, setSaveRequested] = useState(false)

  const canExchange = !!session.matchId && !!session.role

  // once we've shared, poll for the partner's handle until it arrives
  useEffect(() => {
    if (!shared || !canExchange || partnerContact || picked === 'none') return
    const t = setInterval(async () => {
      const { partner } = await getPartnerContact(session.matchId, session.role)
      if (partner) setPartnerContact(partner)
    }, 4000)
    return () => clearInterval(t)
  }, [shared, partnerContact, picked])

  const submitShare = async (e) => {
    e.preventDefault()
    setError('')
    if (picked === 'none') { setShared(true); return }
    if (!canExchange) { setShared(true); return } // demo / no live session to exchange through
    setBusy(true)
    try {
      const label = SOCIALS.find(s => s.id === picked)?.label
      const { partner } = await shareContact({ matchId: session.matchId, role: session.role, platform: label, handle })
      setShared(true)
      if (partner) setPartnerContact(partner)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const newSession = () => { clearSession(); nav('/') }

  return (
    <section className="card">
      <h2>Hour's up — that was fun.</h2>
      <p className="muted">
        You played with <strong>{session.partner?.displayName}</strong> ({session.score}% match)
        {session.server?.host && <> on <code>{session.server.host}</code></>}.
      </p>

      <div className="post-grid">
        <div className="post-card">
          <h3>Stay in touch?</h3>
          <p className="muted small">Optional. We'll only show your handle to your buddy if they share back.</p>

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
              {error && <p className="auth-error">{error}</p>}
              <button className="btn primary" type="submit" disabled={busy || (picked !== 'none' && !handle.trim())}>
                {busy ? 'Sharing…' : picked === 'none' ? 'Skip sharing' : 'Share with buddy'}
              </button>
            </form>
          ) : partnerContact ? (
            <div className="contact-reveal">
              <p className="success">You're connected! 🎉</p>
              <p className="muted small">{session.partner?.displayName} shared:</p>
              <div className="contact-box">{partnerContact}</div>
            </div>
          ) : picked === 'none' ? (
            <p className="muted">No worries — maybe next time.</p>
          ) : (
            <p className="success">Shared ✓ Waiting for {session.partner?.displayName || 'your buddy'} to share back… {canExchange ? '' : '(they\'ll get it next time they\'re on)'}</p>
          )}
        </div>

        <div className="post-card">
          <h3>Save your world</h3>
          <p className="muted small">
            We can keep your world alive for one free month so you can hop back in.
          </p>
          {!saveRequested ? (
            <button className="btn primary" onClick={() => setSaveRequested(true)}>Save world — free for 30 days</button>
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
