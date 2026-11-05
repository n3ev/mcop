import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { apiMe } from '../lib/auth.js'
import { getBillingConfig, startCheckout, openBillingPortal, money } from '../lib/billing.js'
import { joinWaitlist } from '../lib/api.js'
import { playError, playXp } from '../lib/sound.js'
import { toast } from '../lib/toast.js'
import Ico from '../components/Ico.jsx'
import { track } from '../lib/track.js'
import ReferralNote from '../components/ReferralNote.jsx'

// every perk is access or cosmetic. none of them changes the game, so a member
// and a free player in the same world always play exactly the same Minecraft
const PERKS = [
  { icon: 'clock_00', title: 'Longer hours', text: 'Add up to 2 extra hours to any session, even when people are waiting for a server.' },
  { icon: 'compass_00', title: 'First in line', text: "When every server is busy, you're next. Free players still get in whenever there's room." },
  { icon: 'campfire', title: 'Embers', text: 'A trail of embers behind you in-game and a ✦ by your name. Looks only: your buddy plays the same game.' },
  { icon: 'filled_map', title: 'Worlds that stay', text: 'Your saved worlds stay saved for as long as you\'re a member, not just 30 days.' },
  { icon: 'name_tag', title: 'The mark', text: 'A ✦ next to your name on the site, so people know who keeps the lights on.' },
  { icon: 'lead', title: 'Friends come first too', text: 'Invites you make or join skip the line the same way when servers are busy.' },
]

function Perks() {
  return (
    <ul className="campfire-perks">
      {PERKS.map(p => (
        <li key={p.title} className="campfire-perk">
          <span className="campfire-perk-icon"><Ico name={p.icon} /></span>
          <span>
            <strong className="campfire-perk-title">{p.title}</strong>
            <span className="muted small">{p.text}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

// before payments are switched on: take an email instead of a card
function OpensSoon() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')
  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    try { await joinWaitlist(email, 'campfire'); setDone(true); playXp() } catch (er) { setErr(er.message); playError() }
  }
  if (done) return <p className="success">You're on the list ✓ We'll email you the day it opens.</p>
  return (
    <form className="campfire-soon" onSubmit={submit}>
      <p className="muted small">The Campfire isn't open yet. Leave your email and you'll hear first.</p>
      <div className="campfire-soon-row">
        <input className="text-input" type="email" required placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
        <button className="btn primary" type="submit">Tell me</button>
      </div>
      {err && <p className="auth-error">{err}</p>}
    </form>
  )
}

export default function Campfire() {
  const nav = useNavigate()
  const [params, setParams] = useSearchParams()
  const { user, setUser, loading } = useAuth()
  const [cfg, setCfg] = useState(null)
  const [interval, setInterval_] = useState('year')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [welcome, setWelcome] = useState(params.get('joined') === '1')

  useEffect(() => { getBillingConfig().then(setCfg) }, [])

  // back from Stripe: the webhook usually lands within a few seconds
  useEffect(() => {
    if (!welcome || loading || !user) return
    if (user.campfirePaid) { playXp(); return }
    let tries = 0
    const t = setInterval(async () => {
      const u = await apiMe()
      if (u?.campfirePaid) { setUser(u); clearInterval(t); playXp(); track('campfire_joined'); toast('Welcome to the Campfire ✦', '/assets/textures/items/campfire.png') }
      if (++tries > 20) clearInterval(t)
    }, 1500)
    return () => clearInterval(t)
  }, [welcome, loading, user?.campfirePaid])

  const prices = cfg?.prices || {}
  const hasYear = !!prices.year
  const pick = hasYear ? interval : 'month'
  const saving = hasYear && prices.month && prices.year.currency === prices.month.currency
    ? Math.round((1 - prices.year.amount / (prices.month.amount * 12)) * 100) : 0

  const join = async () => {
    setError('')
    if (!user) { track('campfire_signup_click'); nav('/signup?next=/campfire'); return }
    setBusy(true)
    try {
      const { url } = await startCheckout(pick)
      track('checkout_opened', { interval: pick })
      window.location.assign(url)
    } catch (e) {
      setError(e.message)
      playError()
      setBusy(false)
    }
  }
  const manage = async () => {
    setBusy(true)
    try { const { url } = await openBillingPortal(); window.location.assign(url) } catch (e) { setError(e.message); setBusy(false) }
  }

  // paying members manage their plan; anyone on a free referral week can still join
  const member = !!user?.campfirePaid
  const freeWeek = !member && user?.bonusUntil
  return (
    <section className="card campfire-page">
      <div className="campfire-hero">
        <div className="campfire-glow" aria-hidden="true"><Ico name="campfire" /></div>
        <span className="tag">The Campfire</span>
        <h2>Keep the fire going</h2>
        <p className="muted">
          MCOP is free and it's staying free. It runs on one person's computer in Sydney, and every
          hour you play is a real server switched on just for you two. The Campfire is how you chip
          in, and you get a few warm things for it.
        </p>
      </div>

      {welcome && member && (
        <div className="campfire-welcome">
          <strong>✦ You're in. Thank you.</strong>
          <span className="muted small">Your perks start with your next session. A welcome email is on its way.</span>
          <button className="btn small ghost" onClick={() => { setWelcome(false); setParams({}) }}>Close</button>
        </div>
      )}
      {welcome && !member && user && <p className="muted small center">Confirming your membership with Stripe…</p>}

      <Perks />
      <ReferralNote />
      {freeWeek && <p className="success center">✦ You're on a free week until {new Date(user.bonusUntil).toLocaleDateString()}. Join below to keep it going after that.</p>}

      <div className="campfire-buy">
        {member ? (
          <>
            <p className="success">✦ You're a member. {user.planRenews ? 'It renews by itself on' : "You've cancelled, so it ends on"} {new Date(user.planUntil).toLocaleDateString()}.</p>
            <button className="btn" disabled={busy} onClick={manage}>Change or cancel</button>
          </>
        ) : !cfg ? (
          <div className="xpbar" role="progressbar" aria-label="Loading prices"><div className="xpbar-fill" /></div>
        ) : !cfg.enabled ? (
          <OpensSoon />
        ) : !prices.month ? (
          <p className="muted">Couldn't load the prices just now. Refresh in a minute.</p>
        ) : (
          <>
            {hasYear && (
              <div className="campfire-toggle" role="radiogroup" aria-label="Billing period">
                <button role="radio" aria-checked={pick === 'month'} className={'chip' + (pick === 'month' ? ' chip-active' : '')} onClick={() => setInterval_('month')}>Monthly</button>
                <button role="radio" aria-checked={pick === 'year'} className={'chip' + (pick === 'year' ? ' chip-active' : '')} onClick={() => setInterval_('year')}>
                  Yearly{saving > 0 && <em> · save {saving}%</em>}
                </button>
              </div>
            )}
            <p className="campfire-price">
              <span className="campfire-amount">{money(prices[pick])}</span>
              <span className="muted"> / {pick}</span>
              {pick === 'year' && prices.year && <span className="muted small campfire-permonth">that's {money(prices.year, { perMonthOf: 12 })} a month</span>}
            </p>
            <button className="btn primary big cta" disabled={busy} onClick={join}>
              <Ico name="campfire" className="btn-ico" />{busy ? 'Opening checkout…' : user ? 'Join the Campfire' : 'Sign up to join'}
            </button>
            {user?.billing && !member && <button className="btn small ghost" onClick={manage}>Billing history</button>}
          </>
        )}
        {error && <p className="auth-error">{error}</p>}
      </div>

      <div className="campfire-fine muted small">
        <p>Payments go through Stripe; MCOP never sees your card. It renews each {hasYear ? 'month or year' : 'month'} until you cancel, which you can do any time from your <Link to="/account" className="inline-link">account</Link>. You keep the perks until the end of what you've paid for. See the <Link to="/terms" className="inline-link">terms</Link> for refunds.</p>
        <p>Nothing here changes gameplay. Minecraft's rules say everyone on a server should play the same game, and we agree: no kits, items or advantages are for sale.</p>
        <p>Not an official Minecraft service. Not approved by or associated with Mojang or Microsoft.</p>
      </div>
    </section>
  )
}
