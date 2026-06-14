import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { apiUpdateProfile, apiChangePassword, apiDeleteAccount, apiGetBlocked, apiUnblock } from '../lib/auth.js'
import Avatar from '../components/Avatar.jsx'

export default function Settings() {
  const nav = useNavigate()
  const { user, setUser, logout, loading } = useAuth()

  const [name, setName] = useState('')
  const [nameMsg, setNameMsg] = useState('')
  const [curPw, setCurPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [pwMsg, setPwMsg] = useState('')
  const [blocked, setBlocked] = useState([])
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  useEffect(() => {
    if (!loading && !user) nav('/login')
  }, [loading, user])

  useEffect(() => {
    if (user) setName(user.displayName || '')
    apiGetBlocked().then(d => setBlocked(d.blocked)).catch(() => {})
  }, [user])

  if (loading || !user) return null

  const saveName = async (e) => {
    e.preventDefault(); setNameMsg('')
    try { const { user: u } = await apiUpdateProfile(name); setUser(u); setNameMsg('Saved ✓') }
    catch (err) { setNameMsg(err.message) }
  }

  const changePw = async (e) => {
    e.preventDefault(); setPwMsg('')
    try { await apiChangePassword(curPw, newPw); setPwMsg('Password changed ✓'); setCurPw(''); setNewPw('') }
    catch (err) { setPwMsg(err.message) }
  }

  const unblock = async (id) => {
    await apiUnblock(id).catch(() => {})
    setBlocked(b => b.filter(u => u.id !== id))
  }

  const del = async () => {
    await apiDeleteAccount().catch(() => {})
    logout()
    nav('/')
  }

  return (
    <section className="card prefs-card">
      <h2>Settings</h2>

      <div className="settings-block">
        <h3>Display name</h3>
        <form onSubmit={saveName} className="settings-row">
          <input className="text-input" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
          <button className="btn primary" type="submit">Save</button>
        </form>
        {nameMsg && <p className="muted small">{nameMsg}</p>}
      </div>

      <div className="settings-block">
        <h3>Change password</h3>
        <form onSubmit={changePw} className="auth-form">
          <input className="text-input" type="password" placeholder="Current password" value={curPw} onChange={e => setCurPw(e.target.value)} />
          <input className="text-input" type="password" placeholder="New password (min 8)" value={newPw} onChange={e => setNewPw(e.target.value)} />
          <button className="btn primary" type="submit" disabled={!curPw || !newPw}>Update password</button>
        </form>
        {pwMsg && <p className="muted small">{pwMsg}</p>}
      </div>

      <div className="settings-block">
        <h3>Blocked players</h3>
        {blocked.length === 0 ? (
          <p className="muted small">You haven't blocked anyone.</p>
        ) : (
          <ul className="match-list">
            {blocked.map(b => (
              <li key={b.id} className="match-item">
                <span className="friend-row">
                  <Avatar name={b.mcUsername || b.displayName} size={28} />
                  {b.displayName || b.mcUsername || 'Player'}
                </span>
                <button className="btn small ghost" onClick={() => unblock(b.id)}>Unblock</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="settings-block danger">
        <h3>Delete account</h3>
        <p className="muted small">Permanently removes your account, preferences, friends and history. Can't be undone.</p>
        {confirmingDelete ? (
          <div className="settings-row">
            <button className="btn danger" onClick={del}>Yes, delete everything</button>
            <button className="btn ghost" onClick={() => setConfirmingDelete(false)}>Cancel</button>
          </div>
        ) : (
          <button className="btn ghost" onClick={() => setConfirmingDelete(true)}>Delete my account</button>
        )}
      </div>
    </section>
  )
}
