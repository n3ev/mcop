import { Routes, Route, Link, useLocation } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
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
import { useEffect, useRef, useState } from 'react'
import BugReport from './components/BugReport.jsx'
import SoundToggle from './components/SoundToggle.jsx'
import Lever from './components/Lever.jsx'
import { useAuth } from './context/AuthContext.jsx'
import { playClick, playTick, playHissBoom, playError, isMusicOn, startMusic, stopMusic } from './lib/sound.js'
import { burst, explosion } from './lib/particles.js'
import { toast } from './lib/toast.js'

const reduced = () =>
  window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

function HeaderAuth() {
  const { user, logout, loading } = useAuth()
  if (loading) return null
  if (user) {
    return (
      <nav className="header-auth" aria-label="Site">
        <Link to="/" className="header-link">Home</Link>
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
    <nav className="header-auth" aria-label="Site">
      <Link to="/" className="header-link">Home</Link>
      <Link to="/login" className="header-link">Log in</Link>
      <Link to="/signup" className="header-link">Sign up</Link>
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
  return <Lever on={day} label={day ? 'Day' : 'Dusk'} onChange={setDay} />
}

// ambient note-block tune; a lever on the jukebox, never autoplays
function JukeboxToggle() {
  const [on, setOn] = useState(false)
  useEffect(() => () => stopMusic(), [])
  return (
    <Lever
      on={on}
      label="Jukebox"
      onChange={(v) => { setOn(v); if (v) startMusic(); else stopMusic() }}
    />
  )
}

// the world itself: Neev's shader renders of a real cross-section,
// night for dusk (default), day when the lever is flipped
function WorldBackdrop() {
  return (
    <div className="world-bg" aria-hidden="true">
      <img
        className="world-img world-night"
        src="/assets/world/night-1920.webp"
        srcSet="/assets/world/night-1080.webp 1080w, /assets/world/night-1920.webp 1920w"
        sizes="100vw"
        alt=""
      />
      <img
        className="world-img world-day"
        src="/assets/world/day-1920.webp"
        srcSet="/assets/world/day-1080.webp 1080w, /assets/world/day-1920.webp 1920w"
        sizes="100vw"
        alt=""
      />
      <div className="world-tint" />
    </div>
  )
}

// F3-style depth readout: from cloud level down to bedrock as you scroll
function DepthMeter() {
  const [y, setY] = useState(64)
  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight
        const p = max > 0 ? window.scrollY / max : 0
        setY(Math.round(64 - p * 128))
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf) }
  }, [])
  return <div className="depth-meter" aria-hidden="true">Y: {y}</div>
}

// achievement toasts (fired via lib/toast.js from anywhere)
function Toast() {
  const [t, setT] = useState(null)
  const timer = useRef(null)
  useEffect(() => {
    const on = (e) => {
      setT(null) // restart the animation even for back-to-back toasts
      requestAnimationFrame(() => setT(e.detail))
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setT(null), 3900)
    }
    window.addEventListener('mcop:toast', on)
    return () => { window.removeEventListener('mcop:toast', on); clearTimeout(timer.current) }
  }, [])
  if (!t) return null
  return (
    <div className="toast" role="status">
      <img className="toast-icon" src={t.icon} alt="" />
      <div>
        <div className="toast-title">{t.title}</div>
        <div className="toast-text">{t.text}</div>
      </div>
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
      const el = e.target.closest('button, .btn, .option, a[href], .lever')
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
      setTimeout(() => {
        explosion(window.innerWidth / 2, window.innerHeight / 2)
        setCreeper(false)
      }, 1250)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

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
        .querySelectorAll('.how-card, .stat, .review-card, .post-card, .hero-bullets li, .panel-history')
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
      toast("You can't break bedrock.", 'Achievement Get!', '/assets/textures/blocks/bedrock.png')
    }
  }

  return (
    <div className="app">
      <WorldBackdrop />
      <DepthMeter />

      <header className="topbar">
        <span className="tagline">Random buddy. One hour. One world.</span>
        <div className="topbar-lever"><ThemeToggle /></div>
        <HeaderAuth />
      </header>

      <main className="content">
        <Routes>
          <Route path="/" element={<Landing />} />
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
          <Route path="*" element={<div className="page"><NotFound /></div>} />
        </Routes>
      </main>

      <footer className="footer" onClick={tapBedrock}>
        <div className="footer-rails" aria-hidden="true"><div className="minecart" /></div>
        <span>© {new Date().getFullYear()} MCOP · Not affiliated with Mojang or Microsoft</span>
        <a href="https://github.com/n3ev/mcop/blob/main/CREDITS.md" target="_blank" rel="noreferrer">Credits</a>
        <div className="footer-controls">
          <SoundToggle />
          <JukeboxToggle />
          <BugReport />
        </div>
      </footer>

      <Toast />
      <CreeperEgg show={creeper} />
    </div>
  )
}
