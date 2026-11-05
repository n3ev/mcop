import { useEffect, useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { loadSession, clearSession } from '../lib/storage.js'
import { shareContact, getPartnerContact, saveWorld, rateBuddy, reportBuddy, getSessionState, worldZipUrl } from '../lib/session.js'
import { addFriend, blockBuddy } from '../lib/social.js'
import { useAuth } from '../context/AuthContext.jsx'
import Avatar from '../components/Avatar.jsx'
import { playError, playPop, playXp } from '../lib/sound.js'
import { toast } from '../lib/toast.js'
import Ico from '../components/Ico.jsx'
import HourRecap from '../components/HourRecap.jsx'
import RewardBanner from '../components/RewardBanner.jsx'
import ShareCard from '../components/ShareCard.jsx'
import { track } from '../lib/track.js'

// a server host MCOP has a referral deal with, if any: set at build time.
// shown with a plain disclosure; Realms (Mojang's own) is always offered too
const HOST_NAME = import.meta.env.VITE_HOST_PARTNER_NAME || ''
const HOST_URL = import.meta.env.VITE_HOST_PARTNER_URL || ''

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
  const { user } = useAuth()
  const [friendMsg, setFriendMsg] = useState('')
  const [blocked, setBlocked] = useState(false)
  const [picked, setPicked] = useState('discord')
  const [handle, setHandle] = useState('')
  const [shared, setShared] = useState(false)
  const [partnerContact, setPartnerContact] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [saveRequested, setSaveRequested] = useState(false)
  const [saveErr, setSaveErr] = useState('')
  const [rated, setRated] = useState(0)
  const [reporting, setReporting] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDetails, setReportDetails] = useState('')
  const [reportSent, setReportSent] = useState(false)

  const canExchange = !!session.matchId && !!session.role
  const friends = !!session.party
  const [world, setWorld] = useState(null) // null | 'saving' | 'saved'

  // after asking for a save: wait for the copy to land, then offer the download
  useEffect(() => {
    if (!saveRequested || !canExchange || world === 'saved') return
    let on = true
    const t = setInterval(async () => {
      const s = await getSessionState(session.matchId, session.role)
      if (!on) return
      if (s?.world) setWorld(s.world)
      else if (s && !s.active) clearInterval(t) // the session record is gone
    }, 2000)
    return () => { on = false; clearInterval(t) }
  }, [saveRequested, world])

  // nothing to wrap up (opened directly, or the session was cleared): home, like /session does
  useEffect(() => { if (!session.partner) nav('/', { replace: true }) }, [])

  // once we've shared, poll for the partner's handle until it arrives
  useEffect(() => {
    if (!shared || !canExchange || partnerContact || picked === 'none') return
    const t = setInterval(async () => {
      const { partner } = await getPartnerContact(session.matchId, session.role)
      if (partner) { setPartnerContact(partner); playPop() }
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
      playError()
    } finally {
      setBusy(false)
    }
  }

  const newSession = () => { clearSession(); nav('/') }

  const onAddFriend = async () => {
    try {
      const { status } = await addFriend(session.matchId)
      setFriendMsg(status === 'accepted' ? "You're now friends!" : 'Friend request sent ✓')
    } catch (e) { setFriendMsg(e.message) }
  }
  const onBlock = async () => {
    try { await blockBuddy(session.matchId); setBlocked(true) } catch { /* ignore */ }
  }

  const onSaveWorld = async () => {
    setSaveErr('')
    if (!canExchange) { setSaveRequested(true); return } // demo session, nothing to snapshot
    try {
      await saveWorld(session.matchId, session.role)
      setSaveRequested(true)
      playXp()
      toast('Saving your world…', '/assets/textures/items/filled_map.png')
    } catch (e) {
      setSaveErr(e.message)
      playError()
    }
  }

  const onRate = async (value) => {
    setRated(value)
    playPop()
    if (canExchange) rateBuddy(session.matchId, session.role, value).catch(() => {})
  }

  const submitReport = async () => {
    try {
      if (canExchange) await reportBuddy({ matchId: session.matchId, role: session.role, reason: reportReason, details: reportDetails })
      setReportSent(true)
      setReporting(false)
    } catch (e) {
      setSaveErr(e.message)
      playError()
    }
  }

  if (!session.partner) return null

  return (
    <section className="card post-session">
      <h2>Hour's up, that was fun.</h2>
      <div className="post-partner">
        <Avatar name={session.partner?.mcUsername || session.partner?.displayName} size={44} />
        <p className="muted">
          You played with <strong>{session.partner?.displayName}</strong>{friends ? '' : ` (${session.score}% match)`}
          {session.server?.host && <> on <code>{session.server.host}</code></>}.
        </p>
      </div>

      {canExchange && friends && <RewardBanner matchId={session.matchId} role={session.role} />}

      {!friends && <div className="rate-row">
        <span className="muted small">How was your buddy?</span>
        <button
          className={'btn small' + (rated === 1 ? ' primary' : '')}
          onClick={() => onRate(1)}
          aria-pressed={rated === 1}
        ><Ico name="egg" className="btn-ico" />Good egg</button>
        <button
          className={'btn small' + (rated === -1 ? ' danger' : '')}
          onClick={() => onRate(-1)}
          aria-pressed={rated === -1}
        ><Ico name="rotten_flesh" className="btn-ico" />Not great</button>
        {!reportSent ? (
          <button className="btn small ghost" onClick={() => setReporting(r => !r)}>Report</button>
        ) : (
          <span className="success small">Report sent. We'll handle it.</span>
        )}
      </div>}

      {reporting && (
        <div className="report-box">
          <div className="chip-row">
            {['Griefing', 'Slurs or hate', 'Harassment', 'Cheating', 'Other'].map(r => (
              <button
                type="button"
                key={r}
                className={'chip' + (reportReason === r ? ' chip-active' : '')}
                onClick={() => setReportReason(r)}
              >{r}</button>
            ))}
          </div>
          <textarea
            className="bug-textarea"
            rows={3}
            placeholder="What happened? (optional)"
            value={reportDetails}
            onChange={e => setReportDetails(e.target.value)}
          />
          <button className="btn primary small" disabled={!reportReason} onClick={submitReport}>Send report</button>
        </div>
      )}

      {user && session.matchId && !friends && (
        <div className="buddy-actions">
          {blocked ? (
            <span className="muted small">You won't be matched with them again.</span>
          ) : friendMsg ? (
            <span className="success small">{friendMsg}</span>
          ) : (
            <>
              <button className="btn small primary" onClick={onAddFriend}>+ Add friend</button>
              <button className="btn small ghost" onClick={onBlock}>Don't match again</button>
            </>
          )}
        </div>
      )}

      {session.matchId && <HourRecap matchId={session.matchId} partnerMc={session.partner?.mcUsername} friends={friends} />}

      <div className="post-grid">
        {!friends && <div className="post-card">
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
              <p className="success">You're connected!</p>
              <p className="muted small">{session.partner?.displayName} shared:</p>
              <div className="contact-box">{partnerContact}</div>
            </div>
          ) : picked === 'none' ? (
            <p className="muted">No worries, maybe next time.</p>
          ) : (
            <p className="success">Shared ✓ Waiting for {session.partner?.displayName || 'your buddy'} to share back… {canExchange ? '' : '(they\'ll get it next time they\'re on)'}</p>
          )}
        </div>}

        <div className="post-card">
          <h3>Save your world</h3>
          <p className="muted small">
            Keep what you built: download it as a singleplayer world, or find it in My Worlds
            for {user?.campfire ? 'as long as you\'re a member' : '30 days'}.
          </p>
          {!saveRequested ? (
            <button className="btn primary" onClick={onSaveWorld}>Save this world</button>
          ) : !canExchange ? (
            <p className="success">Saved ✓</p>
          ) : world === 'saved' ? (
            <>
              <a className="btn primary" href={worldZipUrl(session.matchId, session.role)} onClick={() => { playXp(); track('world_downloaded', { friends }) }}>
                <Ico name="filled_map" className="btn-ico" />Download the world (.zip)
              </a>
              <p className="muted small">Unzip it into your <code>.minecraft/saves</code> folder and it shows up in Singleplayer, Nether and all.{user ? ' It\'s in My Worlds too.' : ''}</p>
            </>
          ) : (
            <>
              <p className="success">Saving ✓ Packing it up…</p>
              <div className="xpbar" role="progressbar" aria-label="Saving your world"><div className="xpbar-fill" /></div>
            </>
          )}
          {saveErr && <p className="auth-error">{saveErr}</p>}
        </div>

        <ShareCard
          matchId={canExchange ? session.matchId : null}
          you={{ name: session.user?.displayName || session.mcUsername || 'You', mc: session.mcUsername }}
          buddy={{ name: session.partner?.displayName || 'Buddy', mc: session.partner?.mcUsername }}
          friends={friends}
        />

        <div className="post-card">
          <h3>Keep playing together</h3>
          <ul className="keep-list">
            <li>
              <strong>Another hour, same {friends ? 'friend' : 'buddy'}.</strong>{' '}
              <span className="muted small">{friends ? 'Make a fresh invite whenever you two are free.' : 'Swap socials above, then send them an invite link next time.'}</span>{' '}
              <Link to="/invite" className="inline-link">Make an invite</Link>
            </li>
            <li>
              <strong>A world that never closes.</strong>{' '}
              <span className="muted small">Download the world, then upload it to a Minecraft Realm (Mojang's own servers){HOST_URL ? <> or a server from <a href={HOST_URL} target="_blank" rel="sponsored noopener noreferrer" className="inline-link">{HOST_NAME || 'our hosting partner'}</a></> : ' or any server host'}.</span>
              {HOST_URL && <span className="muted small affiliate-note"> That's an affiliate link: MCOP gets a small cut, you pay the same.</span>}
            </li>
          </ul>
        </div>
      </div>

      {!user?.campfire && (
        <p className="muted small campfire-nudge">
          <Ico name="campfire" className="btn-ico" />Had a good hour? <Link to="/campfire" className="inline-link">The Campfire</Link> keeps MCOP free for everyone.
        </p>
      )}

      <div className="cta-row">
        <button className="btn ghost" onClick={newSession}>{friends ? 'Back to the start' : 'Find another buddy'}</button>
      </div>
    </section>
  )
}
