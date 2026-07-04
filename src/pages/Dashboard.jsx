import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { apiGetMatches, apiResendVerification } from '../lib/auth.js'
import { getFriends, respondFriend } from '../lib/social.js'
import { startMatch } from '../lib/play.js'
import { profileQuestions } from '../data/profileQuestions.js'
import Avatar from '../components/Avatar.jsx'

function timeAgo(iso) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000
  if (d < 60) return 'just now'
  if (d < 3600) return `${Math.floor(d / 60)}m ago`
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`
  return `${Math.floor(d / 86400)}d ago`
}

// nag (gently) until the email link is clicked, with a one-tap resend
function VerifyEmailBanner() {
  const [sent, setSent] = useState(false)
  const resend = () => {
    setSent(true)
    apiResendVerification().catch(() => {})
  }
  return (
    <div className="panel-banner">
      <span>Check your inbox and verify your email so we can reach you.</span>
      {sent
        ? <span className="success small">Sent ✓</span>
        : <button className="btn small" onClick={resend}>Resend link</button>}
    </div>
  )
}

// personalized panel shown inside the shared landing page for logged-in users
export default function Dashboard() {
  const nav = useNavigate()
  const { user } = useAuth()
  const [history, setHistory] = useState({ matches: [], total: 0, stats: { total: 0, buddies: 0, hours: 0 } })
  const [social, setSocial] = useState({ friends: [], pending: [] })
  const [busy, setBusy] = useState(false)

  const loadSocial = () => getFriends().then(setSocial).catch(() => {})
  useEffect(() => {
    apiGetMatches().then(setHistory).catch(() => {})
    loadSocial()
  }, [])

  const respond = async (fromUserId, accept) => {
    await respondFriend(fromUserId, accept).catch(() => {})
    loadSocial()
  }

  const prefs = user.preferences
  const hasPrefs = prefs && Object.keys(prefs).length > 0
  const chips = hasPrefs ? profileQuestions.filter(q => prefs[q.id]).slice(0, 6) : []

  const quickPlay = async () => {
    setBusy(true)
    const target = await startMatch({
      displayName: user.displayName || user.mcUsername,
      mcUsername: user.mcUsername,
      answers: { ...prefs, patience: 'Right now' },
      email: user.email,
    })
    nav(target)
  }

  return (
    <div className="user-panel">
      {user.emailVerified === false && <VerifyEmailBanner />}
      {!user.mcVerified && (
        <div className="panel-banner">
          <span>Link your Minecraft account to play with one click.</span>
          <Link to="/account" className="btn small primary">Link now</Link>
        </div>
      )}

      <div className="panel-main">
        {hasPrefs ? (
          <>
            <div className="panel-prefs">
              {chips.map(q => (
                <span key={q.id} className="pref-chip"><span className="pref-chip-k">{q.id}</span>{prefs[q.id]}</span>
              ))}
              <Link to="/preferences" className="pref-edit">Edit</Link>
            </div>

            {user.mcVerified ? (
              <button className="btn primary big cta" disabled={busy} onClick={quickPlay}>
                {busy ? 'Finding your buddy…' : '⛏ Play with my style'}
              </button>
            ) : (
              <button className="btn primary big" onClick={() => nav('/account')}>Link account to play ⛏</button>
            )}
            <button className="btn ghost" onClick={() => nav('/questionnaire')}>Play a different style</button>
          </>
        ) : (
          <>
            <p className="muted">Set up your profile so we can find your best matches.</p>
            <button className="btn primary big" onClick={() => nav('/preferences')}>Set up my profile</button>
            <button className="btn ghost" onClick={() => nav('/questionnaire')}>Or just play a quick one</button>
          </>
        )}
      </div>

      {history.stats?.total > 0 && (
        <div className="panel-stats">
          <div className="stat"><span className="stat-num">{history.stats.total}</span><span className="stat-label">sessions</span></div>
          <div className="stat-divider" />
          <div className="stat"><span className="stat-num">{history.stats.buddies}</span><span className="stat-label">buddies</span></div>
          <div className="stat-divider" />
          <div className="stat"><span className="stat-num">{history.stats.hours}h</span><span className="stat-label">played</span></div>
        </div>
      )}

      <Link to="/worlds" className="panel-worlds-link">🗺 My saved worlds →</Link>

      {social.pending.length > 0 && (
        <div className="panel-history">
          <span className="panel-history-label">Friend requests</span>
          <ul className="match-list">
            {social.pending.map(p => (
              <li key={p.id} className="match-item">
                <span className="friend-row">
                  <Avatar name={p.mcUsername || p.displayName} size={28} />
                  {p.displayName || p.mcUsername || 'Someone'}
                </span>
                <span className="friend-actions">
                  <button className="btn small primary" onClick={() => respond(p.id, true)}>Accept</button>
                  <button className="btn small ghost" onClick={() => respond(p.id, false)}>Decline</button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {social.friends.length > 0 && (
        <div className="panel-history">
          <span className="panel-history-label">Friends</span>
          <ul className="match-list">
            {social.friends.map(f => (
              <li key={f.id} className="match-item">
                <span className="friend-row">
                  <Avatar name={f.mcUsername || f.displayName} size={28} />
                  {f.displayName || f.mcUsername || 'Friend'}
                </span>
                {f.mcUsername && <span className="match-meta">{f.mcUsername}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {history.matches.length > 0 && (
        <div className="panel-history">
          <span className="panel-history-label">Recent buddies</span>
          <ul className="match-list">
            {history.matches.slice(0, 4).map((m, i) => (
              <li key={i} className="match-item">
                <span className="friend-row">
                  <Avatar name={m.partner_name} size={28} />
                  <span className="match-partner">
                    {m.partner_name || 'A buddy'}
                    {m.partner_contact && <span className="match-contact">{m.partner_contact}</span>}
                  </span>
                </span>
                <span className="match-meta">{timeAgo(m.created_at)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
