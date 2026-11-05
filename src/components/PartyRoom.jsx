import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import { API_URL } from '../lib/api.js'
import { getParty, leaveParty, confirmParty, clearParty, inviteUrl, prettyCode } from '../lib/party.js'
import { saveSession, clearSession } from '../lib/storage.js'
import { askNotifyPermission, notifyMatchFound } from '../lib/notify.js'
import { playPop, playXp } from '../lib/sound.js'
import { unlock } from '../lib/achievements.js'
import Avatar from './Avatar.jsx'
import Ico from './Ico.jsx'

const AGE_LABEL = { '13-17': '13 to 17', '18+': '18 or older' }

function Seat({ name, you, empty }) {
  return (
    <div className={'seat' + (empty ? ' empty' : '')}>
      {empty ? <span className="seat-empty" aria-hidden="true">?</span> : <Avatar name={name} size={64} />}
      <span className="seat-name">{empty ? 'Saving a seat…' : name}{you && !empty && <em> (you)</em>}</span>
    </div>
  )
}

// the room two friends wait in: a seat each by the fire, the invite link, and
// what's happening. hands over to /session the moment the server is ready.
// party = { code, key, role: 'a' (made the invite) | 'b' (opened it), me }
export default function PartyRoom({ party, onGone }) {
  const nav = useNavigate()
  const [view, setView] = useState(null)
  const [copied, setCopied] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const host = party.role === 'a'

  useEffect(() => {
    let on = true
    askNotifyPermission()
    const toSession = (m) => {
      if (!on) return
      on = false
      clearSession()
      saveSession({
        user: { displayName: party.me?.displayName },
        mcUsername: party.me?.mcUsername,
        partner: m.partner, score: null, server: m.server, matchId: m.matchId, role: m.role,
        quest: m.quest, modes: m.modes || null, endsAt: m.endsAt, party: true, campfire: !!m.campfire,
      })
      clearParty()
      unlock('plus-one')
      notifyMatchFound(m.partner?.displayName || 'your friend')
      nav('/session')
    }
    const apply = (v) => {
      if (!on || !v) return
      if (v.status === 'started' && v.session) return toSession(v.session)
      if (v.status === 'expired' || v.status === 'closed') { on = false; clearParty(); onGone?.(v.status); return }
      setView(prev => {
        if (prev && !prev.guestName && v.guestName) playXp() // they sat down
        return v
      })
    }
    const sock = io(API_URL, { transports: ['websocket'], reconnectionAttempts: 8 })
    sock.on('connect', () => sock.emit('party_identify', { code: party.code, key: party.key }))
    sock.on('party_update', apply)
    sock.on('match_found', toSession)
    // a slow poll too, so a blocked socket can't strand anyone
    const poll = () => getParty(party.code, party.key).then(apply).catch((e) => {
      if (e.status === 404 && on) { on = false; clearParty(); onGone?.('expired') }
    })
    poll()
    const t = setInterval(poll, 8000)
    return () => { on = false; clearInterval(t); sock.disconnect() }
  }, [party.code, party.key])

  const link = inviteUrl(party.code)
  const hostName = view?.hostName || (host ? party.me?.displayName : '…')
  const guestName = view?.guestName || (host ? null : party.me?.displayName)
  const both = !!guestName
  const status = view?.status || 'open'

  const copy = async () => {
    try { await navigator.clipboard.writeText(link) } catch { return }
    setCopied(true)
    playPop()
    setTimeout(() => setCopied(false), 1600)
  }
  const share = () => navigator.share?.({
    title: 'Play Minecraft with me',
    text: `${hostName} wants to play Minecraft with you: a private server for an hour, free.`,
    url: link,
  }).catch(() => {})
  const leave = async () => {
    setLeaving(true)
    await leaveParty(party.code, party.key).catch(() => {})
    clearParty()
    onGone?.(host ? 'cancelled' : 'left')
  }

  // an adult and an under-18: the inviter says yes too before anything starts
  const needsConfirm = both && view?.mixed && !view?.hostConfirmed
  const confirm = async () => {
    setConfirming(true)
    try { setView(await confirmParty(party.code, party.key)) } catch { /* the poll catches up */ } finally { setConfirming(false) }
  }

  let line
  if (!both) line = 'Send your friend the link. As soon as they open it and add their Minecraft name, your server starts.'
  else if (needsConfirm) line = host ? '' : `Waiting for ${hostName} to confirm they know you.`
  else if (view?.waitingForServer) line = "You're both here. Every server is busy right now, so you're next in line."
  else line = host ? `${guestName} sat down. Lighting up your world…` : 'Lighting up your world…'

  return (
    <section className="card center party-room">
      <span className={'tag' + (both ? ' good' : '')}>{both ? 'Both here' : 'Invite open'}</span>
      <h2>{needsConfirm ? 'One more thing' : both ? 'Your world is coming' : 'Pull up a seat'}</h2>

      <div className="campfire-seats" aria-live="polite">
        <Seat name={hostName} you={host} />
        <div className={'party-fire' + (both ? ' lit' : '')} aria-hidden="true">
          <Ico name="campfire" />
          {both && <><span className="party-spark" /><span className="party-spark" /><span className="party-spark" /></>}
        </div>
        <Seat name={guestName} you={!host} empty={!guestName} />
      </div>

      {line && <p className="muted party-line">{line}</p>}

      {host && needsConfirm && (
        <div className="age-warning" role="alert">
          <strong>{guestName} said they're {AGE_LABEL[view.guestAge] || 'in a different age group'}.</strong>
          {view.guestAge === '13-17'
            ? <span>Only start if you know them in real life, like your own kid or a younger brother or sister.</span>
            : <span>Only start if you know them in real life, like family. If someone you met online took your invite, cancel it and tell a parent or an adult you trust.</span>}
          <div className="cta-row">
            <button className="btn primary" disabled={confirming} onClick={confirm}>I know them in real life: start</button>
          </div>
        </div>
      )}

      {host && !both && (
        <div className="invite-box">
          <div className="invite-link-row">
            <code className="invite-link">{link.replace(/^https?:\/\//, '')}</code>
            <button className="btn small primary" onClick={copy}>{copied ? 'Copied ✓' : 'Copy link'}</button>
            {typeof navigator !== 'undefined' && navigator.share && <button className="btn small" onClick={share}>Share</button>}
          </div>
          <p className="muted small">Reading it out? The code is <strong className="invite-code">{prettyCode(party.code)}</strong>. The link works for 30 minutes.</p>
        </div>
      )}

      {both && !needsConfirm && (
        <div className="xpbar" role="progressbar" aria-label="Starting your server"><div className="xpbar-fill" /></div>
      )}

      <p className="muted small">You'll both need Minecraft: Java Edition. The server is on 1.21.4.</p>
      {status !== 'starting' && (
        <button className="btn ghost" disabled={leaving} onClick={leave}>{host ? 'Cancel the invite' : 'Leave'}</button>
      )}
    </section>
  )
}
