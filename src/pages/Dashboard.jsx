import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { apiGetMatches } from '../lib/auth.js'
import { startMatch } from '../lib/play.js'
import { profileQuestions } from '../data/profileQuestions.js'

function timeAgo(iso) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000
  if (d < 60) return 'just now'
  if (d < 3600) return `${Math.floor(d / 60)}m ago`
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`
  return `${Math.floor(d / 86400)}d ago`
}

// personalized panel shown inside the shared landing page for logged-in users
export default function Dashboard() {
  const nav = useNavigate()
  const { user } = useAuth()
  const [history, setHistory] = useState({ matches: [], total: 0 })
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    apiGetMatches().then(setHistory).catch(() => {})
  }, [])

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
              <button className="btn primary big" disabled={busy} onClick={quickPlay}>
                {busy ? 'Finding your buddy…' : 'Play with my style ⛏'}
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

      {history.matches.length > 0 && (
        <div className="panel-history">
          <span className="panel-history-label">Recent buddies</span>
          <ul className="match-list">
            {history.matches.slice(0, 4).map((m, i) => (
              <li key={i} className="match-item">
                <span className="match-partner">{m.partner_name || 'A buddy'}</span>
                <span className="match-meta">{timeAgo(m.created_at)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
