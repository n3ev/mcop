import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearSession } from '../lib/storage.js'
import { fetchActivity, joinWaitlist } from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import Dashboard from './Dashboard.jsx'
import Logo from '../components/Logo.jsx'
import SplashText from '../components/SplashText.jsx'

const reduced = () =>
  window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

function ActivityTicker() {
  const [stats, setStats] = useState(null)
  useEffect(() => {
    let on = true
    const load = () => fetchActivity().then(s => { if (on) setStats(s) })
    load()
    const t = setInterval(load, 12000)
    return () => { on = false; clearInterval(t) }
  }, [])
  if (!stats) return null
  const bits = []
  if (stats.online > 0) bits.push(`${stats.online} online now`)
  if (stats.matchesToday > 0) bits.push(`${stats.matchesToday} matched today`)
  if (bits.length === 0) return null
  return (
    <div className="activity-ticker">
      <span className="activity-dot" />
      {bits.join(' · ')}
    </div>
  )
}

// bedrock players can leave an email for when (if) cross-play lands
function BedrockWaitlist() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState('idle') // idle | busy | done | error
  const submit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setState('busy')
    try { await joinWaitlist(email.trim()); setState('done') }
    catch { setState('error') }
  }
  if (state === 'done') return <p className="success small">You're on the list. I'll email you if Bedrock happens.</p>
  return (
    <form className="wl-form" onSubmit={submit}>
      <input
        className="text-input wl-input"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
        aria-label="Email for the Bedrock waitlist"
      />
      <button className="btn small primary" type="submit" disabled={state === 'busy' || !email.trim()}>
        {state === 'busy' ? '…' : 'Notify me'}
      </button>
      {state === 'error' && <p className="auth-error small">That didn't work, is the email right?</p>}
    </form>
  )
}

const REVIEWS = [
  {
    handle: '@neevchavla',
    initial: 'N',
    text: '"Tried r/minecraftbuddies for weeks. Two replies, nothing came of either. Set up MCOP in 60 seconds, matched in under a minute, and played for two hours straight. Actually made a proper friend."',
    source: 'via Instagram',
  },
  {
    handle: '@ayman_alam1',
    initial: 'A',
    text: '"r/minecraftbuddies took 3 days to get one low-effort reply. MCOP matched me in 40 seconds with someone who had the exact same playstyle. We swapped Discords at the end. Still playing together."',
    source: 'via Instagram',
  },
  {
    handle: '@neevchavla',
    initial: 'N',
    text: '"Hadn\'t opened Minecraft in months. A world by yourself gets old fast. First MCOP session we built a massive base together. Already planning a third session. This actually makes Minecraft feel alive again."',
    source: 'via Instagram',
  },
  {
    handle: '@ayman_alam1',
    initial: 'A',
    text: '"Didn\'t think a random matchmaking site would work but here we are. Got matched with someone also into Redstone and we spent the whole hour planning an automatic farm. Rare W, genuinely."',
    source: 'via Instagram',
  },
]

function Reviews() {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % REVIEWS.length), 6000)
    return () => clearInterval(t)
  }, [])
  const r = REVIEWS[idx]
  return (
    <div className="frame reviews-section">
      <p className="section-eyebrow">What players say</p>
      <div className="review-card">
        <div className="review-stars" aria-label="5 out of 5">★★★★★</div>
        <p className="review-text">{r.text}</p>
        <div className="review-author">
          <div className="review-avatar" aria-hidden="true">{r.initial}</div>
          <div>
            <div className="review-handle">{r.handle}</div>
            <div className="review-source">{r.source}</div>
          </div>
        </div>
      </div>
      <div className="review-dots">
        {REVIEWS.map((_, i) => (
          <button
            key={i}
            className={`review-dot${i === idx ? ' active' : ''}`}
            aria-label={`Review ${i + 1}`}
            onClick={() => setIdx(i)}
          />
        ))}
      </div>
    </div>
  )
}

// live numbers from the real matchmaking server
function WorldStatus() {
  const [stats, setStats] = useState(null)
  useEffect(() => {
    let on = true
    const load = () => fetchActivity().then(d => { if (on) setStats(d) })
    load()
    const t = setInterval(load, 15000)
    return () => { on = false; clearInterval(t) }
  }, [])
  return (
    <div className="frame stats-section">
      <p className="section-eyebrow">World status</p>
      <div className="stats-bar">
        <div className="stat"><span className="stat-num">{stats ? stats.online : '…'}</span><span className="stat-label">online now</span></div>
        <div className="stat"><span className="stat-num">{stats ? stats.queue : '…'}</span><span className="stat-label">in the queue</span></div>
        <div className="stat"><span className="stat-num">{stats ? stats.matchesToday : '…'}</span><span className="stat-label">matched today</span></div>
      </div>
      <div className="kv spec-rows">
        <div className="kv-row"><span className="kv-key">Server</span><span className="kv-val">Paper 1.21.4 · Java Edition</span><span /></div>
        <div className="kv-row"><span className="kv-key">Worlds</span><span className="kv-val">private · whitelisted · fresh every session</span><span /></div>
        <div className="kv-row"><span className="kv-key">Home</span><span className="kv-val">hosted in Sydney, AU. Playable anywhere</span><span /></div>
      </div>
    </div>
  )
}

// drifting campfire embers rising through the hero
function Embers() {
  if (reduced()) return null
  return (
    <div className="embers" aria-hidden="true">
      {Array.from({ length: 9 }, (_, i) => (
        <span
          key={i}
          className="ember"
          style={{
            '--x': (8 + (i * 83) % 88) + '%',
            '--dur': (6 + (i * 137) % 50 / 10) + 's',
            '--delay': -((i * 211) % 70 / 10) + 's',
            '--drift': (((i * 53) % 40) - 20) + 'px',
          }}
        />
      ))}
    </div>
  )
}

// fireflies wandering the surface at dusk
function Fireflies() {
  if (reduced()) return null
  return (
    <>
      {Array.from({ length: 6 }, (_, i) => (
        <span
          key={i}
          className="firefly"
          aria-hidden="true"
          style={{
            '--x': (6 + (i * 157) % 86) + '%',
            '--y': (18 + (i * 97) % 60) + '%',
            '--dur': (9 + (i * 41) % 60 / 10) + 's',
            '--delay': -((i * 173) % 80 / 10) + 's',
            '--wx': (((i * 67) % 120) - 60) + 'px',
            '--wy': (((i * 43) % 70) - 35) + 'px',
          }}
        />
      ))}
    </>
  )
}

export default function Landing() {
  const nav = useNavigate()
  const { user, loading } = useAuth()
  const start = () => {
    clearSession()
    nav('/questionnaire')
  }

  return (
    <div className="cross-section">
      <h1 className="sr-only">MCOP: get matched with a random Minecraft buddy and play together for an hour</h1>

      {/* ── the sky: title screen ── */}
      <section className="stratum-sky hero">
        <Embers />
        {!reduced() && <span className="shooting-star" aria-hidden="true" />}

        <div className="title-screen">
          <Logo size={128} />
          <SplashText />
        </div>

        <div className="hero-eyebrow">
          <span className="hero-eyebrow-dot" />
          {user ? `Welcome back, ${user.displayName || 'player'}` : 'Now in Beta · Free to play'}
        </div>

        <p className="hero-sub">
          Find a Minecraft buddy in 60 seconds. Answer a few quick questions, we pair you
          with someone whose vibe matches yours. Private server. One hour. No strings.
        </p>

        <ActivityTicker />

        {loading ? null : user ? (
          <Dashboard />
        ) : (
          <>
            <button className="btn primary big cta" onClick={start}>⛏ Find my buddy</button>
            <div className="dig-cue">▼ dig deeper ▼</div>
            <ul className="hero-bullets">
              <li>🎯 Matched by playstyle, not luck</li>
              <li>🌍 Free Minecraft server for 1 hour</li>
              <li>💬 Optional Discord swap after</li>
              <li>💾 Save your world for 30 days, free</li>
            </ul>
          </>
        )}
      </section>

      {/* ── ground level: the pitch ── */}
      <section className="stratum-surface">
        <Fireflies />
        <div className="pair">
          <div className="frame how-section">
            <p className="section-eyebrow">How it works</p>
            <div className="how-grid">
              <div className="how-card">
                <span className="how-num">STEP 01</span>
                <h3 className="how-title">Answer a few questions</h3>
                <p className="how-desc">Playstyle, game mode, experience, vibe. Done in under 60 seconds. Sign up to save it.</p>
              </div>
              <div className="how-card">
                <span className="how-num">STEP 02</span>
                <h3 className="how-title">We find your match</h3>
                <p className="how-desc">Our algorithm pairs you with someone whose answers align with yours. Usually takes under a minute.</p>
              </div>
              <div className="how-card">
                <span className="how-num">STEP 03</span>
                <h3 className="how-title">Jump in together</h3>
                <p className="how-desc">You both get a private server for one hour. Keep the world for 30 days, completely free.</p>
              </div>
            </div>
          </div>

          <div className="frame how-section">
            <p className="section-eyebrow">In your hour</p>
            <div className="hour-grid">
              <div className="hour-card">
                <span className="hour-icon" aria-hidden="true">🎯</span>
                <h3 className="hour-title">A shared quest</h3>
                <p className="hour-desc">Every session spawns with a quest of the hour: something to build, find, or survive together.</p>
              </div>
              <div className="hour-card">
                <span className="hour-icon" aria-hidden="true">🧭</span>
                <h3 className="hour-title">In-game controls</h3>
                <p className="hour-desc">Set the time to day, clear the weather, or teleport straight to your buddy.</p>
              </div>
              <div className="hour-card">
                <span className="hour-icon" aria-hidden="true">⚔️</span>
                <h3 className="hour-title">Starting loadouts</h3>
                <p className="hour-desc">Vanilla purist? Iron kit? Elytra? Creative? Pick your start in your profile.</p>
              </div>
              <div className="hour-card">
                <span className="hour-icon" aria-hidden="true">⏳</span>
                <h3 className="hour-title">+30 when you need it</h3>
                <p className="hour-desc">Mid-build when the timer runs low? Extend the session by half an hour.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── the story + the quest board ── */}
      <section className="stratum-surface">
        <div className="pair">
          <div className="frame how-section">
            <p className="section-eyebrow">Why MCOP exists</p>
            <div className="story-copy">
              <p>I'm a uni student in Sydney who kept hitting the same wall: a world of your own gets old fast, and finding someone to share one with was miserable. Forum posts that died in silence. Discord servers full of strangers talking past each other. Friends who "totally would" but never log on.</p>
              <p>So I built the thing I wanted: press one button, get a real person who plays like you do, and be punching trees together inside a minute. No small talk required. The game is the small talk.</p>
              <p className="story-sign">Neev, somewhere in a mineshaft</p>
            </div>
          </div>

          <div className="frame how-section">
            <p className="section-eyebrow">Quests from the board</p>
            <p className="muted" style={{ margin: '0 auto 18px' }}>
              Every session rolls a shared quest. The kind of thing you'll see:
            </p>
            <div className="chip-row" style={{ justifyContent: 'center' }}>
              <span className="chip quest-chip">🌾 Build a wheat farm before the hour ends</span>
              <span className="chip quest-chip">⛏️ Full iron armour before sunset</span>
              <span className="chip quest-chip">🏘️ Find a village and rob... trade with it</span>
              <span className="chip quest-chip">🌉 Bridge a ravine, no scaffolding deaths</span>
              <span className="chip quest-chip">🔥 Light a nether portal together</span>
              <span className="chip quest-chip">🐄 Two cows, one boat. Good luck</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── the mine: mechanics + live status ── */}
      <section className="stratum-stone">
        <div className="pair">
          <div className="frame how-section">
            <p className="section-eyebrow">Under the hood</p>
            <div className="hour-grid">
              <div className="hour-card">
                <span className="hour-icon" aria-hidden="true">⏱️</span>
                <h3 className="hour-title">Patience tiers</h3>
                <p className="hour-desc">"Right now" matches fastest. Willing to wait? We hold your spot and email you.</p>
              </div>
              <div className="hour-card">
                <span className="hour-icon" aria-hidden="true">⚖️</span>
                <h3 className="hour-title">Weighted answers</h3>
                <p className="hour-desc">Core questions weigh double. A chatty builder won't get a silent speedrunner.</p>
              </div>
              <div className="hour-card">
                <span className="hour-icon" aria-hidden="true">🔐</span>
                <h3 className="hour-title">Whitelist, not luck</h3>
                <p className="hour-desc">The server only admits the two exact usernames in your match.</p>
              </div>
              <div className="hour-card">
                <span className="hour-icon" aria-hidden="true">🌱</span>
                <h3 className="hour-title">Fresh worlds</h3>
                <p className="hour-desc">Every session spawns a clean world, unless you save yours for 30 days, free.</p>
              </div>
            </div>
          </div>

          <WorldStatus />
        </div>
      </section>

      {/* ── the cave: players + questions ── */}
      <section className="stratum-deep">
        <div className="pair">
          <Reviews />

          <div className="frame reviews-section">
            <p className="section-eyebrow">Common questions</p>
            <div className="faq-list">
              <details className="faq">
                <summary>What do I need to play?</summary>
                <p className="faq-a">Minecraft Java Edition (1.21.4) and a Microsoft account. We whitelist your exact username on a private server. No mods, no launcher tricks. Bedrock isn't supported yet.</p>
              </details>
              <details className="faq">
                <summary>Is it actually free?</summary>
                <p className="faq-a">Yes. Matching, the private server, and the 30-day world save are all free while we're in beta. Long term we may charge a small fee to keep worlds alive past 30 days. Playing stays free.</p>
              </details>
              <details className="faq">
                <summary>What if we don't vibe?</summary>
                <p className="faq-a">It happens. Finish the hour or bail early, then hit "don't match again" and you'll never see each other in the queue again. Swapping socials afterwards is always optional, never required.</p>
              </details>
              <details className="faq">
                <summary>Can we keep playing after the hour?</summary>
                <p className="faq-a">Extend the session by 30 minutes from the session page, and save the world for 30 days free. Jump back in together whenever you both want.</p>
              </details>
              <details className="faq">
                <summary>Do I need an account?</summary>
                <p className="faq-a">No. Guests can jump straight into the queue. An account saves your playstyle, keeps your match history, remembers your buddies, and gets you one-click matching with a verified username.</p>
              </details>
              <details className="faq">
                <summary>Can I pick who I get matched with?</summary>
                <p className="faq-a">Not yet. The random buddy is the whole point. Friends lists already exist, and "play again with a friend" is on the roadmap.</p>
              </details>
              <details className="faq">
                <summary>Where are the servers?</summary>
                <p className="faq-a">Sydney, Australia, so Oceania pings are dreamy. It's absolutely playable from elsewhere; block games are forgiving.</p>
              </details>
              <details className="faq">
                <summary>Is it safe to play with a stranger?</summary>
                <p className="faq-a">You're on a whitelisted private server: just you two, verified usernames only. No personal info is exchanged unless you choose to share socials at the end. Block and report tools are one click away.</p>
              </details>
            </div>
          </div>
        </div>
      </section>

      {/* ── the mineshaft: rules + what's coming ── */}
      <section className="stratum-mineshaft">
        <div className="pair">
          <div className="frame how-section">
            <p className="section-eyebrow">House rules</p>
            <ul className="rules-list">
              <li>Be cool. You're someone's hour of Minecraft today.</li>
              <li>No griefing your buddy. You're on the same team.</li>
              <li>Slurs or hate = instant, permanent ban. Zero appeals.</li>
              <li>What happens on the server stays there. No doxing, no drama.</li>
              <li>One account per player, real usernames only.</li>
            </ul>
          </div>

          <div className="frame how-section">
            <p className="section-eyebrow">Mining next</p>
            <div className="hour-grid">
              <div className="hour-card">
                <span className="mc-badge">digging now</span>
                <h3 className="hour-title" style={{ marginTop: 10 }}>Play again</h3>
                <p className="hour-desc">Reconnect with a past buddy from your friends list.</p>
              </div>
              <div className="hour-card">
                <span className="mc-badge">surveyed</span>
                <h3 className="hour-title" style={{ marginTop: 10 }}>Bedrock support</h3>
                <p className="hour-desc">Java only for now. On Bedrock? Leave your email and you'll be first to know.</p>
                <BedrockWaitlist />
              </div>
            </div>
            <ul className="patch-list shipped-list">
              <li><span className="patch-date">Jul 2026</span> Smarter matchmaking, no-show requeue, saved worlds page, email verification.</li>
              <li><span className="patch-date">Jul 2026</span> World saves, buddy ratings and reports went live.</li>
              <li><span className="patch-date">Jul 2026</span> The big redesign: the world you're scrolling through.</li>
              <li><span className="patch-date">Jun 2026</span> Loadouts, social swap, friends, account linking, accounts.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── the bottom of the world ── */}
      <section className="stratum-mineshaft">
        {!reduced() && Array.from({ length: 5 }, (_, i) => (
          <span
            key={'o' + i}
            className="xp-orb"
            aria-hidden="true"
            style={{
              '--x': (10 + (i * 173) % 82) + '%',
              '--dur': (8 + (i * 61) % 40 / 10) + 's',
              '--delay': -((i * 227) % 90 / 10) + 's',
              '--drift': (((i * 37) % 30) - 15) + 'px',
            }}
          />
        ))}
        <div className="wrap frame" style={{ maxWidth: 760 }}>
          <p className="section-eyebrow">End of the line</p>
          <h2>Grab a pickaxe. Find your buddy.</h2>
          <p className="muted" style={{ maxWidth: 560, margin: '0 auto 26px' }}>
            You made it to the bottom of the world. The only thing left to do is play.
          </p>
          <button className="btn primary big cta" onClick={start}>⛏ Find my buddy</button>
        </div>
      </section>
    </div>
  )
}
