import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { apiGetMatches } from '../lib/auth.js'
import { startMatch } from '../lib/play.js'
import { fixedQuestions } from '../data/fixedQuestions.js'

const PREF_KEYS = fixedQuestions.filter(q => q.id !== 'patience')

function timeAgo(iso) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000
  if (d < 60) return 'just now'
  if (d < 3600) return `${Math.floor(d / 60)}m ago`
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`
  return `${Math.floor(d / 86400)}d ago`
}

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
    <section className="dash">
      <h1 className="dash-title">Welcome back{user.displayName ? `, ${user.displayName}` : ''} ⛏</h1>

      {!user.mcVerified && (
        <div className="dash-card warn">
          <div>
            <h3>Link your Minecraft account</h3>
            <p className="muted small">Verify your username once to unlock one-click play and skip typing it every time.</p>
          </div>
          <Link to="/account" className="btn primary">Link now</Link>
        </div>
      )}

      <div className="dash-card">
        <div className="dash-card-head">
          <h3>Your play style</h3>
          {hasPrefs && <Link to="/questionnaire" className="header-link">Try a new style →</Link>}
        </div>

        {hasPrefs ? (
          <>
            <div className="pref-chips">
              {PREF_KEYS.map(q => prefs[q.id] && (
                <span key={q.id} className="pref-chip"><span className="pref-chip-k">{q.id}</span>{prefs[q.id]}</span>
              ))}
            </div>
            {user.mcVerified ? (
              <button className="btn primary big" disabled={busy} onClick={quickPlay}>
                {busy ? 'Finding your buddy…' : 'Play with saved preferences ⛏'}
              </button>
            ) : (
              <p className="muted small">Link your Minecraft account above to play with one click.</p>
            )}
          </>
        ) : (
          <>
            <p className="muted small">You haven't set your preferences yet. Answer a few quick questions and we'll remember them.</p>
            <button className="btn primary big" onClick={() => nav('/questionnaire')}>Set my play style</button>
          </>
        )}
      </div>

      <div className="dash-card">
        <div className="dash-card-head">
          <h3>Match history</h3>
          <span className="muted small">{history.total} total</span>
        </div>
        {history.matches.length === 0 ? (
          <p className="muted small">No matches yet. Your past buddies will show up here.</p>
        ) : (
          <ul className="match-list">
            {history.matches.map((m, i) => (
              <li key={i} className="match-item">
                <span className="match-partner">{m.partner_name || 'A buddy'}</span>
                <span className="match-meta">{m.score}% · {timeAgo(m.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
