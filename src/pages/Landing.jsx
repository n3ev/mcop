import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { clearSession } from '../lib/storage.js'
import { fetchActivity } from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import Dashboard from './Dashboard.jsx'
import Logo from '../components/Logo.jsx'
import SplashText from '../components/SplashText.jsx'
import Ores from '../components/Ores.jsx'
import Reviews from '../components/Reviews.jsx'

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
      <p className="included-label">Every match includes</p>
      <ul className="included-list">
        <li>A private server, just the two of you</li>
        <li>A shared quest for the hour</li>
        <li>Your pick of starting loadout</li>
        <li>In-game controls: time, weather, teleport</li>
        <li>A free 30-day save of your world</li>
      </ul>
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

      {/* ── ground level: how it works + your hour ── */}
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

      {/* ── a concrete walk-through of a real session ── */}
      <section className="stratum-surface">
        <div className="wrap frame timeline-frame">
          <p className="section-eyebrow">A typical hour</p>
          <ol className="timeline">
            <li className="tl-step">
              <span className="tl-time">0:00</span>
              <div className="tl-body">
                <h3>Answer a few questions</h3>
                <p>How you play, what you're into, how long you've got. Under a minute, no account needed.</p>
              </div>
            </li>
            <li className="tl-step">
              <span className="tl-time">0:01</span>
              <div className="tl-body">
                <h3>Meet your buddy</h3>
                <p>We pair you with someone whose answers line up with yours, and show you exactly where you match.</p>
              </div>
            </li>
            <li className="tl-step">
              <span className="tl-time">0:02</span>
              <div className="tl-body">
                <h3>Hop into a private world</h3>
                <p>Both usernames get whitelisted on a fresh server. Copy the IP, paste it into Multiplayer, join.</p>
              </div>
            </li>
            <li className="tl-step">
              <span className="tl-time">0:05</span>
              <div className="tl-body">
                <h3>Your quest lands in chat</h3>
                <p>Starting loadouts drop and a shared goal for the hour appears in-game. Build it, find it, survive it.</p>
              </div>
            </li>
            <li className="tl-step">
              <span className="tl-time">0:30</span>
              <div className="tl-body">
                <h3>Add more time if you need it</h3>
                <p>Deep in a build and the clock's running low? One click buys another half hour, if nobody's waiting.</p>
              </div>
            </li>
            <li className="tl-step">
              <span className="tl-time">1:00</span>
              <div className="tl-body">
                <h3>Save it, rate it, stay in touch</h3>
                <p>Keep the world alive for 30 days, rate your buddy, and swap Discords only if you both want to.</p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      {/* ── the mine: live status + what players say ── */}
      <section className="stratum-stone">
        <Ores variant="stone" />
        <div className="pair">
          <WorldStatus />
          <Reviews />
        </div>
        <Link to="/about" className="descend-link">▼ Read the story and how it really works ▼</Link>
      </section>

      {/* ── the bottom of the world: the ask ── */}
      <section className="stratum-mineshaft">
        <Ores variant="mineshaft" />
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
          <div className="end-links">
            <Link to="/about" className="inline-link">The story</Link>
            <span className="end-sep">·</span>
            <Link to="/help" className="inline-link">Questions</Link>
            <span className="end-sep">·</span>
            <Link to="/contact" className="inline-link">Say hi</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
