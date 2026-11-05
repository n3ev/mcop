import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { apiGetWorlds, apiDownloadWorld } from '../lib/auth.js'
import { playError, playXp } from '../lib/sound.js'
import Avatar from '../components/Avatar.jsx'
import Ico from '../components/Ico.jsx'
import { track } from '../lib/track.js'

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
  const [busy, setBusy] = useState(null)
  const [err, setErr] = useState('')

  const download = async (key) => {
    setErr('')
    setBusy(key)
    try { await apiDownloadWorld(key); playXp(); track('world_downloaded', { from: 'my-worlds' }) } catch (e) { setErr(e.message); playError() } finally { setBusy(null) }
  }

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
        Every world saved after one of your sessions, by you or the person you played with.
        {user.campfire
          ? ' As a Campfire member, yours stay for as long as you\'re a member.'
          : <> They stay for {KEEP_DAYS} days (<Link to="/campfire" className="inline-link">longer for Campfire members</Link>), and you can download any of them to keep.</>}
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
                  {!user.campfire && (
                    <span className={'world-days' + (left <= 5 ? ' low' : '')}>
                      {left > 0 ? `${left} day${left === 1 ? '' : 's'} left` : 'expiring'}
                    </span>
                  )}
                  <button className="btn small" disabled={busy === w.matchKey} onClick={() => download(w.matchKey)}>
                    <Ico name="filled_map" className="btn-ico" />{busy === w.matchKey ? 'Zipping…' : 'Download'}
                  </button>
                </li>
              )
            })}
          </ul>
          {err && <p className="auth-error">{err}</p>}
          <p className="muted small" style={{ marginTop: 18 }}>
            Downloads are singleplayer worlds: unzip one into your <code>.minecraft/saves</code> folder
            and it's in your Singleplayer list, Nether and End included. Build Battle and Redstone Lab
            worlds come along as their own saves. Want to play it with someone again? Upload it to a
            Realm, or <Link to="/invite" className="inline-link">start a fresh hour with a friend</Link>.
          </p>
        </>
      )}
    </section>
  )
}
