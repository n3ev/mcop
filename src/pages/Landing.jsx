import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearSession } from '../lib/storage.js'
import { fetchActivity } from '../lib/api.js'
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
    text: '"Hadn\'t opened Minecraft in months — a world by yourself gets old fast. First MCOP session we built a massive base together. Already planning a third session. This actually makes Minecraft feel alive again."',
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
    <div className="wrap reviews-section">
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

// drifting campfire embers rising through the hero — GPU-cheap, fixed count
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

// blocky clouds crossing the title sky
function Clouds() {
  if (reduced()) return null
  return (
    <div className="clouds" aria-hidden="true">
      <span className="cloud" style={{ '--ct': '10%', '--cd': '150s', '--cdelay': '-40s' }} />
      <span className="cloud" style={{ '--ct': '24%', '--cd': '190s', '--cdelay': '-130s' }} />
      <span className="cloud" style={{ '--ct': '42%', '--cd': '170s', '--cdelay': '-90s' }} />
    </div>
  )
}

// fireflies wandering the dirt stratum at dusk
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

// sprites growing on the grass ridge (sourced CC0 pixel flora)
const FLORA = [
  ['sprite-grass', '6%'], ['sprite-dandelion', '14%'], ['sprite-grass', '23%'],
  ['sprite-sapling', '34%'], ['sprite-daisy', '47%'], ['sprite-grass', '58%'],
  ['sprite-fern', '69%'], ['sprite-grass', '80%'], ['sprite-daisy', '91%'],
]

function Ridge({ variant, flora }) {
  return (
    <div className={'ridge' + (variant ? ` ridge--${variant}` : '')} aria-hidden="true">
      {flora && FLORA.map(([name, fx], i) => (
        <img
          key={i}
          className="flora"
          src={`/assets/textures/blocks/${name}.png`}
          alt=""
          style={{ '--fx': fx, '--fdelay': -(i * 0.7) + 's' }}
        />
      ))}
    </div>
  )
}

// ore veins glinting in the stone stratum
const ORES = [
  ['ore-diamond', '5%', '18%'], ['ore-gold', '12%', '64%'], ['ore-redstone', '88%', '30%'],
  ['ore-diamond', '93%', '72%'], ['ore-gold', '81%', '12%'], ['ore-redstone', '8%', '84%'],
]

export default function Landing() {
  const nav = useNavigate()
  const { user, loading } = useAuth()
  const start = () => {
    clearSession()
    nav('/questionnaire')
  }

  return (
    <div className="cross-section">
      <h1 className="sr-only">MCOP — get matched with a random Minecraft buddy and play together for an hour</h1>

      {/* ── sky: the title screen ── */}
      <section className="stratum-sky hero">
        <Clouds />
        <Embers />

        <div className="title-screen">
          <Logo size={106} />
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
            <button className="btn primary big" onClick={start}>Find my buddy ⛏</button>
            <ul className="hero-bullets">
              <li>🎯 Matched by playstyle, not luck</li>
              <li>🌍 Free Minecraft server for 1 hour</li>
              <li>💬 Optional Discord swap after</li>
              <li>💾 Save your world for 30 days, free</li>
            </ul>
          </>
        )}
      </section>

      {/* ── ground level ── */}
      <Ridge flora />
      <section className="stratum-surface">
        <Fireflies />
        <div className="wrap how-section">
          <p className="section-eyebrow">How it works</p>
          <div className="how-grid">
            <div className="how-card">
              <span className="how-num">STEP 01</span>
              <h3 className="how-title">Answer a few questions</h3>
              <p className="how-desc">Playstyle, game mode, experience, vibe. Done in under 60 seconds — sign up to save it.</p>
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
      </section>

      {/* ── the mine ── */}
      <Ridge variant="gravel" />
      <section className="stratum-stone">
        {ORES.map(([name, ox, oy], i) => (
          <img
            key={i}
            className="ore"
            src={`/assets/textures/blocks/${name}.png`}
            alt=""
            aria-hidden="true"
            style={{ '--ox': ox, '--oy': oy, '--odelay': -(i * 1.7) + 's' }}
          />
        ))}
        <div className="wrap stats-section">
          <p className="section-eyebrow">Mined so far</p>
          <div className="stats-bar">
            <div className="stat"><span className="stat-num">60s</span><span className="stat-label">to match</span></div>
            <div className="stat"><span className="stat-num">1hr</span><span className="stat-label">free server</span></div>
            <div className="stat"><span className="stat-num">30d</span><span className="stat-label">world save</span></div>
            <div className="stat"><span className="stat-num">free</span><span className="stat-label">always</span></div>
          </div>
        </div>
      </section>

      {/* ── the cave ── */}
      <section className="stratum-deep">
        <img className="cave-torch" src="/assets/textures/blocks/torch.png" alt="" aria-hidden="true" style={{ '--tx': '12%', '--ty': '32%' }} />
        <img className="cave-torch" src="/assets/textures/blocks/torch.png" alt="" aria-hidden="true" style={{ '--tx': '85%', '--ty': '38%' }} />
        <img className="cave-decor" src="/assets/textures/blocks/sprite-web.png" alt="" aria-hidden="true" style={{ '--dx': '3%', '--dy': '4%' }} />
        <img className="cave-decor" src="/assets/textures/blocks/sprite-mushroom-red.png" alt="" aria-hidden="true" style={{ '--dx': '22%', '--db': '5%' }} />
        <img className="cave-decor" src="/assets/textures/blocks/sprite-mushroom-brown.png" alt="" aria-hidden="true" style={{ '--dx': '74%', '--db': '5%' }} />
        <img className="cave-decor" src="/assets/textures/blocks/sprite-crystal.png" alt="" aria-hidden="true" style={{ '--dx': '91%', '--db': '8%' }} />
        <Reviews />
      </section>
    </div>
  )
}
