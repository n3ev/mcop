import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { loadSession } from '../lib/storage.js'
import { getParty, joinParty, loadParty, saveParty } from '../lib/party.js'
import { playError } from '../lib/sound.js'
import PartyRoom from '../components/PartyRoom.jsx'
import { track } from '../lib/track.js'
import PlayerFields, { MC_RE } from '../components/PlayerFields.jsx'
import Avatar from '../components/Avatar.jsx'
import Ico from '../components/Ico.jsx'
import Under13 from '../components/Under13.jsx'
import ReferralNote from '../components/ReferralNote.jsx'
import { AGE_UNDER_13, AGE_TEEN, AGE_ADULT } from '../data/fixedQuestions.js'

const POOL = { [AGE_TEEN]: '13-17', [AGE_ADULT]: '18+' }
const LABEL = { '13-17': '13 to 17', '18+': '18 or older' }

function Dead({ title, text }) {
  return (
    <section className="card center">
      <h2>{title}</h2>
      <p className="muted">{text}</p>
      <div className="cta-row">
        <Link to="/invite" className="btn primary"><Ico name="lead" className="btn-ico" />Make your own invite</Link>
        <Link to="/questionnaire" className="btn">Find a random buddy</Link>
      </div>
    </section>
  )
}

// mcop.world/p/CODE: the page a friend lands on from an invite link
export default function JoinInvite() {
  const { code: raw } = useParams()
  const code = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  const { user, loading } = useAuth()
  const [party, setParty] = useState(() => { const p = loadParty(); return p?.code === code ? p : null })
  const [info, setInfo] = useState(null)
  const last = loadSession()
  const [name, setName] = useState(last.user?.displayName || '')
  const [mc, setMc] = useState(last.mcUsername || '')
  const [age, setAge] = useState(last.answers?.age || null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (party) return
    getParty(code).then(setInfo).catch(e => setInfo({ status: e.status === 404 ? 'expired' : 'offline' }))
  }, [code, party])

  useEffect(() => {
    if (!user) return
    if (!name) setName(user.displayName || '')
    if (!mc) setMc(user.mcUsername || '')
    if (user.preferences?.age) setAge(user.preferences.age)
  }, [user])

  if (party) return <PartyRoom party={party} onGone={(why) => { setParty(null); setInfo({ status: why === 'left' ? 'left' : 'expired' }) }} />
  if (!info) return <section className="card center"><div className="xpbar" role="progressbar" aria-label="Loading the invite"><div className="xpbar-fill" /></div></section>
  if (info.status === 'offline') return <Dead title="Can't reach MCOP right now" text="The matchmaking server didn't answer. Give it a minute and refresh." />
  if (info.status === 'expired' || info.status === 'closed') return <Dead title="This invite has run out" text="Invite links last 30 minutes. Ask your friend for a fresh one, or start your own." />
  if (info.status === 'left') return <Dead title="You left the invite" text="No worries. Ask your friend for a new link whenever you're ready." />
  if (info.full || info.status !== 'open') return <Dead title="Someone already took this seat" text="Each invite is for one friend. Ask for a fresh link, or start your own." />

  if (age === AGE_UNDER_13) return <Under13 />

  const ready = !!age && (user?.mcVerified || (name.trim() && MC_RE.test(mc)))
  // an adult and an under-18 in one private world: allowed (a parent and their
  // kid), but only after a plain warning and a deliberate click
  const mine = POOL[age]
  const theirs = info.hostAge
  const differs = !!mine && (theirs === '13-17' || theirs === '18+') && mine !== theirs
  const join = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const me = user?.mcVerified ? { displayName: user.displayName || user.mcUsername, mcUsername: user.mcUsername } : { displayName: name.trim(), mcUsername: mc }
      const p = await joinParty(code, { ...me, age, confirmMixed: differs })
      const stored = { code, key: p.key, role: 'b', me }
      saveParty(stored)
      setParty(stored)
      track('invite_taken', { account: !!user })
    } catch (err) {
      setError(err.message)
      playError()
    } finally { setBusy(false) }
  }

  return (
    <section className="card center invite-page">
      <span className="tag good">You're invited</span>
      <h2>{info.hostName} wants to play Minecraft with you</h2>
      <div className="campfire-seats small-seats">
        <div className="seat"><Avatar name={info.hostName} size={56} /><span className="seat-name">{info.hostName}</span></div>
        <div className="party-fire" aria-hidden="true"><Ico name="campfire" /></div>
        <div className="seat empty"><span className="seat-empty" aria-hidden="true">?</span><span className="seat-name">you?</span></div>
      </div>
      <p className="muted">
        MCOP gives you two a private Minecraft server for an hour, free. When you're both in,
        you pick what to play: quests, a build battle, the redstone lab, One Block or Copycat.
      </p>
      <ReferralNote newcomer />
      {!loading && (
        <form onSubmit={join} className="invite-form">
          <PlayerFields name={name} setName={setName} mc={mc} setMc={setMc} age={age} setAge={setAge} user={user} />
          {differs && (
            <div className="age-warning" role="alert">
              <strong>{info.hostName} said they're {LABEL[theirs]}, and you said you're {LABEL[mine]}.</strong>
              {mine === '13-17'
                ? <span>Only join if you know them in real life, like family. If someone you met online asks you to join a private server, don't, and tell a parent or an adult you trust.</span>
                : <span>Only join if you know them in real life, like your own kid or a younger brother or sister.</span>}
            </div>
          )}
          {error && <p className="auth-error">{error}</p>}
          <button className="btn primary big" type="submit" disabled={busy || !ready}>{busy ? 'Taking your seat…' : differs ? 'I know them in real life: take my seat' : 'Take my seat'}</button>
        </form>
      )}
      <p className="muted small">You'll need Minecraft: Java Edition. New to MCOP? <Link to="/about" className="inline-link">Here's what it is</Link>.</p>
    </section>
  )
}
