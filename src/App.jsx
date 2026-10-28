import { Routes, Route, Link, NavLink, useLocation } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import About from './pages/About.jsx'
import Help from './pages/Help.jsx'
import Contact from './pages/Contact.jsx'
import Questionnaire from './pages/Questionnaire.jsx'
import Matching from './pages/Matching.jsx'
import Waiting from './pages/Waiting.jsx'
import Session from './pages/Session.jsx'
import PostSession from './pages/PostSession.jsx'
import Auth from './pages/Auth.jsx'
import Account from './pages/Account.jsx'
import Preferences from './pages/Preferences.jsx'
import Settings from './pages/Settings.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import NotFound from './pages/NotFound.jsx'
import VerifyEmail from './pages/VerifyEmail.jsx'
import Worlds from './pages/Worlds.jsx'
import { Terms, Privacy } from './pages/Legal.jsx'
import { useEffect, useRef, useState } from 'react'
import BugReport from './components/BugReport.jsx'
import SoundToggle from './components/SoundToggle.jsx'
import Lever from './components/Lever.jsx'
import { useAuth } from './context/AuthContext.jsx'
import { playClick, playTick, playHissBoom, playError, isMusicOn, startMusic, stopMusic } from './lib/sound.js'
import { burst, explosion } from './lib/particles.js'
import { subscribeScroll, remeasureSoon } from './lib/scroll.js'
import { unlock, isUnlocked } from './lib/achievements.js'
import AchievementsOverlay, { AchievementsButton } from './components/Achievements.jsx'
import EasterEggs from './components/EasterEggs.jsx'
import Ambience from './components/Ambience.jsx'
import BuildLayer from './components/BuildLayer.jsx'
import WorldBackdrop from './components/WorldBackdrop.jsx'
import Toasts from './components/Toasts.jsx'
import OreLayer from './components/OreLayer.jsx'
import Hotbar from './components/Hotbar.jsx'

const reduced = () =>
  window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// the site's main sections, each a hanging sign that swings a little on the
// active route. NavLink handles the active state for us.
function PrimaryNav() {
  return (
    <nav className="header-nav" aria-label="Sections">
      <NavLink to="/" end className="header-link">Home</NavLink>
      <NavLink to="/about" className="header-link">About</NavLink>
      <NavLink to="/help" className="header-link">Help</NavLink>
      <NavLink to="/contact" className="header-link">Contact</NavLink>
      <AchievementsButton />
    </nav>
  )
}

function HeaderAuth() {
  const { user, logout, loading } = useAuth()
  if (loading) return <nav className="header-auth" aria-label="Account" />
  if (user) {
    return (
      <nav className="header-auth" aria-label="Account">
        <Link to="/account" className="header-user">
          {user.displayName || user.email}
          {user.mcVerified && <span className="mc-dot" title="Minecraft linked" />}
        </Link>
        <Link to="/settings" className="header-link">Settings</Link>
        <button className="header-link" onClick={logout}>Log out</button>
      </nav>
    )
  }
  return (
    <nav className="header-auth" aria-label="Account">
      <Link to="/login" className="header-link">Log in</Link>
      <Link to="/signup" className="header-link primary">Sign up</Link>
    </nav>
  )
}

// day/night — a real redstone lever. lit lever = daylight on. dusk is home.
function ThemeToggle() {
  const [day, setDay] = useState(localStorage.getItem('mcop_theme') === 'day')
  useEffect(() => {
    document.documentElement.dataset.theme = day ? 'day' : 'night'
    localStorage.setItem('mcop_theme', day ? 'day' : 'night')
  }, [day])
  // /time set day|night from the command bar syncs the lever too
  useEffect(() => {
    const on = (e) => { const d = e.detail === 'day'; setDay(d); unlock(d ? 'broad-daylight' : 'night-owl') }
    window.addEventListener('mcop:set-theme', on)
    return () => window.removeEventListener('mcop:set-theme', on)
  }, [])
  const flip = (v) => { setDay(v); unlock(v ? 'broad-daylight' : 'night-owl') }
  return <Lever on={day} label={day ? 'Day' : 'Dusk'} onChange={flip} />
}

// ambient note-block tune; a lever on the jukebox, never autoplays
function JukeboxToggle() {
  const [on, setOn] = useState(false)
  useEffect(() => () => stopMusic(), [])
  return (
    <Lever
      on={on}
      label="Jukebox"
      onChange={(v) => { setOn(v); if (v) { startMusic(); unlock('going-gold') } else stopMusic() }}
    />
  )
}

// the MCOP logo, top right on the planks (animated; still if reduced motion)
function TopbarLogo() {
  const still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  return (
    <Link to="/" className="topbar-logo" aria-label="MCOP home">
      <img src={still ? '/assets/logo/mcop-static.png' : '/assets/logo/mcop.webp'} alt="" />
    </Link>
  )
}

// F3-style depth readout: from cloud level down to bedrock as you scroll.
// the layer name changes with depth, the way the biome line does in-game.
const LAYER = (y) =>
  y > 48 ? 'Sky' : y > 20 ? 'Surface' : y > -8 ? 'Underground' : y > -40 ? 'Caves' : 'Deepslate'

function DepthMeter() {
  const [y, setY] = useState(64)
  useEffect(() => subscribeScroll((p) => {
    const ny = Math.round(64 - p * 128)
    setY((prev) => (prev === ny ? prev : ny)) // only re-render when the number changes
    if (p >= 0.995) unlock('rock-bottom')      // dug all the way to bedrock
  }), [])
  return (
    <div className="depth-meter" aria-hidden="true">
      <span className="depth-y">Y: {y}</span>
      <span className="depth-layer">{LAYER(y)}</span>
    </div>
  )
}

// konami code → a creeper spawns. that's it. that's the feature.
const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']

function CreeperEgg({ show }) {
  if (!show) return null
  return (
    <div className="creeper" aria-hidden="true">
      <svg viewBox="0 0 8 8" shapeRendering="crispEdges">
        <rect width="8" height="8" fill="#6abe30" />
        <rect x="0" y="0" width="2" height="1" fill="#4c8f2f" />
        <rect x="5" y="7" width="3" height="1" fill="#4c8f2f" />
        <rect x="7" y="1" width="1" height="2" fill="#8fd15c" />
        <rect x="0" y="5" width="1" height="2" fill="#8fd15c" />
        <rect x="1" y="2" width="2" height="2" fill="#0d0d0d" />
        <rect x="5" y="2" width="2" height="2" fill="#0d0d0d" />
        <rect x="3" y="4" width="2" height="2" fill="#0d0d0d" />
        <rect x="2" y="5" width="1" height="3" fill="#0d0d0d" />
        <rect x="5" y="5" width="1" height="3" fill="#0d0d0d" />
      </svg>
    </div>
  )
}

export default function App() {
  const location = useLocation()
  const [creeper, setCreeper] = useState(false)
  const bedrockTaps = useRef(0)

  // minecraft click sound + block-break particles on any button/link,
  // soft tick on hover (pointer devices only)
  useEffect(() => {
    const onClick = (e) => {
      const el = e.target.closest('button, .btn, .option, a[href], .lever, summary')
      if (!el || el.disabled) return
      playClick()
      burst(e.clientX, e.clientY)
    }
    const canHover = window.matchMedia && window.matchMedia('(hover: hover)').matches
    const onOver = (e) => {
      const el = e.target.closest('button, .btn, .option, a[href], .lever')
      if (el && !el.disabled) playTick()
    }
    document.addEventListener('click', onClick)
    if (canHover) document.addEventListener('mouseover', onOver)
    return () => {
      document.removeEventListener('click', onClick)
      document.removeEventListener('mouseover', onOver)
    }
  }, [])

  // konami: hiss… BOOM
  useEffect(() => {
    let i = 0
    const onKey = (e) => {
      i = e.key === KONAMI[i] ? i + 1 : (e.key === KONAMI[0] ? 1 : 0)
      if (i < KONAMI.length) return
      i = 0
      setCreeper(true)
      playHissBoom()
      unlock('konami')
      setTimeout(() => {
        explosion(window.innerWidth / 2, window.innerHeight / 2)
        setCreeper(false)
      }, 1250)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // a message for anyone who opens the dev console. crafted, not spammy.
  useEffect(() => {
    console.log(
      '%c⛏ MCOP %cRandom buddy. One hour. One world.',
      'font-size:20px;font-weight:bold;color:#6abe30;text-shadow:1px 1px 0 #000',
      'font-size:12px;color:#8a8',
    )
    console.log('%cPoking around? It\'s all open: github.com/n3ev/mcop — or say hi at /contact.', 'color:#7bb;font-size:12px')
    console.log('%cP.S. try the Konami code. ↑↑↓↓←→←→ B A', 'color:#c9a227;font-size:11px')
  }, [])

  // route-based achievements: starting the match flow, and Cartographer — quietly
  // track which sections a visitor has seen, then reward wandering through all four.
  useEffect(() => {
    if (['/questionnaire', '/matching', '/waiting'].includes(location.pathname)) unlock('first-steps')
    const MAIN = ['/', '/about', '/help', '/contact']
    if (!MAIN.includes(location.pathname) || isUnlocked('cartographer')) return
    let seen
    try { seen = new Set(JSON.parse(sessionStorage.getItem('mcop_seen') || '[]')) } catch { seen = new Set() }
    seen.add(location.pathname)
    sessionStorage.setItem('mcop_seen', JSON.stringify([...seen]))
    if (MAIN.every(p => seen.has(p))) setTimeout(() => unlock('cartographer'), 700)
  }, [location.pathname])

  // per-page titles
  useEffect(() => {
    const TITLES = {
      '/': 'MCOP: Find a Minecraft buddy',
      '/about': 'About · MCOP',
      '/help': 'Help & FAQ · MCOP',
      '/contact': 'Contact · MCOP',
      '/questionnaire': 'Find a buddy · MCOP',
      '/matching': 'Finding your buddy… · MCOP',
      '/waiting': 'In the queue · MCOP',
      '/session': 'Your session · MCOP',
      '/post-session': 'How was it? · MCOP',
      '/login': 'Log in · MCOP',
      '/signup': 'Sign up · MCOP',
      '/account': 'Your account · MCOP',
      '/preferences': 'Your playstyle · MCOP',
      '/settings': 'Settings · MCOP',
      '/worlds': 'My worlds · MCOP',
      '/verify-email': 'Verify email · MCOP',
      '/terms': 'Terms · MCOP',
      '/privacy': 'Privacy · MCOP',
    }
    document.title = TITLES[location.pathname] || 'MCOP'
  }, [location.pathname])

  // land at the top of every new page (SPA nav doesn't reset scroll on its own)
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  // the page's scroll progress pans the world render from sky to bedrock.
  // the shared scroll source (lib/scroll.js) owns the listener; here we just
  // tell it to re-measure the document height when a new page settles.
  useEffect(() => { remeasureSoon() }, [location.pathname])

  // scroll reveals: the world assembles as it enters the viewport.
  // reduced-motion users never get the classes at all.
  useEffect(() => {
    if (reduced() || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return
        en.target.classList.add('rv-in')
        io.unobserve(en.target)
      })
    }, { threshold: 0.12 })
    const scan = () => {
      document
        .querySelectorAll('.how-card, .hour-card, .stat, .review-card, .post-card, .hero-bullets li, .panel-history, .faq, .section-eyebrow')
        .forEach((el, i) => {
          if (el.classList.contains('rv-in')) return
          el.classList.add('rv')
          el.style.setProperty('--rv-d', (i % 6) * 55 + 'ms')
          io.observe(el)
        })
    }
    scan()
    const t1 = setTimeout(scan, 400)
    const t2 = setTimeout(scan, 1200)
    return () => { clearTimeout(t1); clearTimeout(t2); io.disconnect() }
  }, [location.pathname])

  // you can't break bedrock. you can try.
  const tapBedrock = (e) => {
    if (e.target.closest('button, a, .lever, input')) return
    bedrockTaps.current += 1
    if (bedrockTaps.current === 5) {
      bedrockTaps.current = 0
      playError()
      explosion(e.clientX, e.clientY)
      unlock('cant-break-bedrock')
    }
  }

  return (
    <div className="app">
      <WorldBackdrop />
      <div className="scroll-xp" aria-hidden="true"><div className="scroll-xp-fill" /></div>
      <DepthMeter />

      <header className="topbar">
        <TopbarLogo />
        <PrimaryNav />
        <div className="topbar-lever"><ThemeToggle /></div>
        <HeaderAuth />
      </header>

      <main className="content">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/about" element={<About />} />
          <Route path="/help" element={<Help />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/questionnaire" element={<div className="page"><Questionnaire /></div>} />
          <Route path="/matching" element={<div className="page"><Matching /></div>} />
          <Route path="/waiting" element={<div className="page"><Waiting /></div>} />
          <Route path="/session" element={<div className="page"><Session /></div>} />
          <Route path="/post-session" element={<div className="page"><PostSession /></div>} />
          <Route path="/login" element={<div className="page"><Auth mode="login" /></div>} />
          <Route path="/signup" element={<div className="page"><Auth mode="signup" /></div>} />
          <Route path="/account" element={<div className="page"><Account /></div>} />
          <Route path="/preferences" element={<div className="page"><Preferences /></div>} />
          <Route path="/settings" element={<div className="page"><Settings /></div>} />
          <Route path="/forgot" element={<div className="page"><ForgotPassword /></div>} />
          <Route path="/reset-password" element={<div className="page"><ResetPassword /></div>} />
          <Route path="/verify-email" element={<div className="page"><VerifyEmail /></div>} />
          <Route path="/worlds" element={<div className="page"><Worlds /></div>} />
          <Route path="/terms" element={<div className="page"><Terms /></div>} />
          <Route path="/privacy" element={<div className="page"><Privacy /></div>} />
          <Route path="*" element={<div className="page"><NotFound /></div>} />
        </Routes>
      </main>

      <footer className="footer" onClick={tapBedrock}>
        <span>© {new Date().getFullYear()} MCOP · Not affiliated with Mojang or Microsoft</span>
        <nav className="footer-links" aria-label="Footer">
          <Link to="/questionnaire">Find a buddy</Link>
          <Link to="/about">About</Link>
          <Link to="/help">Help</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/login">Log in</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/privacy">Privacy</Link>
          <a href="https://github.com/n3ev/mcop" target="_blank" rel="noreferrer">GitHub</a>
          <a href="https://github.com/n3ev/mcop/blob/main/CREDITS.md" target="_blank" rel="noreferrer">Credits</a>
        </nav>
        <div className="footer-controls">
          <SoundToggle />
          <JukeboxToggle />
          <BugReport />
        </div>
      </footer>

      <Toasts />
      <AchievementsOverlay />
      <EasterEggs />
      <Ambience />
      <BuildLayer />
      <OreLayer />
      <Hotbar />
      <CreeperEgg show={creeper} />
    </div>
  )
}
