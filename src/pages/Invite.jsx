import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { loadSession } from '../lib/storage.js'
import { createParty, loadParty, saveParty } from '../lib/party.js'
import { playError } from '../lib/sound.js'
import PartyRoom from '../components/PartyRoom.jsx'
import { track } from '../lib/track.js'
import PlayerFields, { MC_RE } from '../components/PlayerFields.jsx'
import Ico from '../components/Ico.jsx'
import Under13 from '../components/Under13.jsx'
import ReferralNote from '../components/ReferralNote.jsx'
import { AGE_UNDER_13 } from '../data/fixedQuestions.js'

const GONE = {
  expired: 'That invite ran out. Make a fresh one below.',
  closed: 'That invite was cancelled.',
  cancelled: 'Invite cancelled.',
  left: 'You left the invite.',
}

// "play with a friend": make an invite link, wait by the fire for them
export default function Invite() {
  const { user, loading } = useAuth()
  const [party, setParty] = useState(() => loadParty())
  const [gone, setGone] = useState(null)
  const last = loadSession()
  const [name, setName] = useState(last.user?.displayName || '')
  const [mc, setMc] = useState(last.mcUsername || '')
  const [age, setAge] = useState(last.answers?.age || null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    if (!name) setName(user.displayName || '')
    if (!mc) setMc(user.mcUsername || '')
    if (user.preferences?.age) setAge(user.preferences.age)
  }, [user])

  if (party) return <PartyRoom party={party} onGone={(why) => { setParty(null); setGone(why) }} />

  if (age === AGE_UNDER_13) return <Under13 />

  const ready = !!age && (user?.mcVerified || (name.trim() && MC_RE.test(mc)))
  const make = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const me = user?.mcVerified ? { displayName: user.displayName || user.mcUsername, mcUsername: user.mcUsername } : { displayName: name.trim(), mcUsername: mc }
      const p = await createParty({ ...me, age })
      const stored = { code: p.code, key: p.key, role: 'a', me }
      saveParty(stored)
      setParty(stored)
      track('invite_made', { account: !!user })
    } catch (err) {
      setError(err.message)
      playError()
    } finally { setBusy(false) }
  }

  return (
    <section className="card invite-page">
      <span className="tag">Play with a friend</span>
      <h2>Got someone to play with already?</h2>
      <p className="muted">
        Make an invite link and send it to them. When they open it, MCOP gives you both a private
        server for an hour, with everything a matched pair gets: quests, the build battle, the
        redstone lab, One Block and Copycat. Free.
      </p>
      <ReferralNote />
      {gone && <p className="panel-banner">{GONE[gone] || GONE.expired}</p>}
      {!loading && (
        <form onSubmit={make} className="invite-form">
          <PlayerFields name={name} setName={setName} mc={mc} setMc={setMc} age={age} setAge={setAge} user={user} />
          {error && <p className="auth-error">{error}</p>}
          <button className="btn primary big" type="submit" disabled={busy || !ready}>
            <Ico name="lead" className="btn-ico" />{busy ? 'Making your link…' : 'Make my invite link'}
          </button>
        </form>
      )}
      <p className="muted small invite-alt">
        No one to invite? <Link to="/questionnaire" className="inline-link">Get matched with a buddy instead</Link>.
      </p>
    </section>
  )
}
