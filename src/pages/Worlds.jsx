import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { apiGetWorlds } from '../lib/auth.js'
import Avatar from '../components/Avatar.jsx'

const KEEP_DAYS = 30

function daysLeft(iso) {
  // save timestamps come from sqlite datetime('now'), which is UTC without a zone
  const saved = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z')
  const gone = (Date.now() - saved.getTime()) / 86400000
  return Math.max(0, Math.ceil(KEEP_DAYS - gone))
}

// every world the user has snapshotted after a session
export default function Worlds() {
  const nav = useNavigate()
  const { user, loading } = useAuth()
  const [worlds, setWorlds] = useState(null)

  useEffect(() => {
    if (!loading && !user) nav('/login')
  }, [loading, user])

  useEffect(() => {
    if (!user) return
    apiGetWorlds().then(({ worlds }) => setWorlds(worlds || [])).catch(() => setWorlds([]))
  }, [user])

  if (loading || !user) return null

  return (
    <section className="card">
      <h2>My worlds</h2>
      <p className="muted">
        Every world you saved after a session lives here for {KEEP_DAYS} days.
      </p>

      {worlds === null ? (
        <div className="center"><div className="spinner" /></div>
      ) : worlds.length === 0 ? (
        <div className="worlds-empty">
          <p className="muted">Nothing saved yet. After your next session, hit <strong>Save world</strong> before you leave and it'll show up here.</p>
          <Link to="/questionnaire" className="btn primary">⛏ Find a buddy</Link>
        </div>
      ) : (
        <>
          <ul className="worlds-list">
            {worlds.map((w) => {
              const left = daysLeft(w.createdAt)
              return (
                <li key={w.matchKey} className="world-item">
                  <Avatar name={w.partnerName || w.matchKey} size={36} />
                  <div className="world-info">
                    <span className="world-title">
                      World with {w.partnerName || 'a buddy'}
                      {w.score != null && <span className="match-meta"> · {w.score}% match</span>}
                    </span>
                    <span className="muted small">Saved {new Date(w.createdAt.includes('T') ? w.createdAt : w.createdAt.replace(' ', 'T') + 'Z').toLocaleDateString()}</span>
                  </div>
                  <span className={'world-days' + (left <= 5 ? ' low' : '')}>
                    {left > 0 ? `${left} day${left === 1 ? '' : 's'} left` : 'expiring'}
                  </span>
                </li>
              )
            })}
          </ul>
          <p className="muted small" style={{ marginTop: 18 }}>
            Want to hop back into one? Email <a href="mailto:nchavla5@gmail.com">nchavla5@gmail.com</a> and I'll load it onto a server for you. One-click restore is coming.
          </p>
        </>
      )}
    </section>
  )
}
