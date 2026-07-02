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
import { useEffect, useState } from 'react'
import BugReport from './components/BugReport.jsx'
import SoundToggle from './components/SoundToggle.jsx'
import Lever from './components/Lever.jsx'
import { useAuth } from './context/AuthContext.jsx'
import { playClick, playTick, playHissBoom } from './lib/sound.js'
import { burst, explosion } from './lib/particles.js'

const reduced = () =>
  window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

function HeaderAuth() {
  const { user, logout, loading } = useAuth()
  if (loading) return null
  if (user) {
    return (
      <div className="header-auth">
        <Link to="/account" className="header-user">
          {user.displayName || user.email}
          {user.mcVerified && <span className="mc-dot" title="Minecraft linked" />}
        </Link>
        <Link to="/settings" className="header-link">Settings</Link>
        <button className="btn small ghost" onClick={logout}>Log out</button>
      </div>
    )
  }
  return (
    <div className="header-auth">
      <Link to="/login" className="header-link">Log in</Link>
      <Link to="/signup" className="btn small primary">Sign up</Link>
    </div>
  )
}

// day/night — a real redstone lever. lit lever = daylight on. night is default.
function ThemeToggle() {
  const [day, setDay] = useState(localStorage.getItem('mcop_theme') === 'day')
  useEffect(() => {
    document.documentElement.dataset.theme = day ? 'day' : 'night'
    localStorage.setItem('mcop_theme', day ? 'day' : 'night')
  }, [day])
  return <Lever on={day} label={day ? 'Day' : 'Night'} onChange={setDay} />
}

// konami code → a creeper spawns. that's it. that's the feature.
const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']

function CreeperEgg({ show }) {
  if (!show) return null
  return (
    <div className="creeper" aria-hidden="true">
      <svg viewBox="0 0 8 8" shapeRendering="crispEdges">
        <rect width="8" height="8" fill="#5FAE3B" />
        <rect x="0" y="0" width="2" height="1" fill="#4c8f2f" />
        <rect x="5" y="7" width="3" height="1" fill="#4c8f2f" />
        <rect x="7" y="1" width="1" height="2" fill="#6fc247" />
        <rect x="0" y="5" width="1" height="2" fill="#6fc247" />
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

  // minecraft click sound + block-break particles on any button/link,
  // soft tick on hover (pointer devices only)
  useEffect(() => {
    const onClick = (e) => {
      const el = e.target.closest('button, .btn, .option, a[href]')
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

  // scroll reveals: blocks assemble as they enter the viewport.
  // pure enhancement — reduced-motion users never get the classes at all.
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
        .querySelectorAll('.how-card, .stat, .review-card, .post-card, .dash-card, .hero-bullets li')
        .forEach((el, i) => {
          if (el.classList.contains('rv-in')) return // already revealed
          el.classList.add('rv')
          el.style.setProperty('--rv-d', (i % 6) * 55 + 'ms')
          io.observe(el) // safe to re-observe after effect re-runs
        })
    }
    scan()
    const t1 = setTimeout(scan, 400)   // async content (dashboard, stats)
    const t2 = setTimeout(scan, 1200)
    return () => { clearTimeout(t1); clearTimeout(t2); io.disconnect() }
  }, [location.pathname])

  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand">⛏ MC<span className="brand-accent">OP</span></Link>
        <span className="tagline">Random buddy. One hour. One world.</span>
        <div className="topbar-lever"><ThemeToggle /></div>
        <HeaderAuth />
      </header>

      <main className="content">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/questionnaire" element={<Questionnaire />} />
          <Route path="/matching" element={<Matching />} />
          <Route path="/waiting" element={<Waiting />} />
          <Route path="/session" element={<Session />} />
          <Route path="/post-session" element={<PostSession />} />
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/signup" element={<Auth mode="signup" />} />
          <Route path="/account" element={<Account />} />
          <Route path="/preferences" element={<Preferences />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/forgot" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </main>

      <footer className="footer">
        <span>© {new Date().getFullYear()} MCOP · Not affiliated with Mojang or Microsoft</span>
        <div className="footer-controls">
          <SoundToggle />
          <BugReport />
        </div>
      </footer>

      <CreeperEgg show={creeper} />
    </div>
  )
}
