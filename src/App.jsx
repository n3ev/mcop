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

// the world itself: Neev's shader renders of a real cross-section,
// night for dusk (default), day when the lever is flipped
// the MCOP logo, top right on the planks (animated; still if reduced motion)
function TopbarLogo() {
  const still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  return (
    <Link to="/" className="topbar-logo" aria-label="MCOP home">
      <img src={still ? '/assets/logo/mcop-static.png' : '/assets/logo/mcop.webp'} alt="" />
    </Link>
  )
}

// the world at dusk/night is Neev's 4K fly-through, kept as 187 NATIVE 4K
// stills (3840x2160 — zero rescaling from the recording; the high-quality
// canvas draw supersamples down to the viewport, which is what keeps it crisp)
// scrubbed on a canvas: scrolling down travels down into the world. swapping a
// pre-decoded image is instant (no video seek/decode ceiling), so this stays
// smooth on mouse wheels AND trackpads. a quick ease glides between scroll
// positions; frames load surface-first since the page opens at the top.
const FRAME_COUNT = 142
// measured vertical camera travel (source px at 1440p) between each adjacent
// frame pair, from cross-correlating the frames themselves: WORLD_DY[i] = how
// far frame i's scene content moves DOWN to become frame i+1. the camera in
// best_night.mp4 rises smoothly (ramp → 20px/frame plateau → taper), dx = 0.
// used by the scrub to TRANSLATE frames between swaps so scene motion is
// pixel-continuous — crossfading vertically-offset frames painted a literal
// double image (the "vertical stretch").
// prettier-ignore
const WORLD_DY = [2,2,2,2,4,4,4,4,6,6,6,6,8,8,8,8,10,10,10,10,10,12,12,12,12,12,14,14,14,14,14,14,16,16,16,16,16,16,16,16,18,18,18,18,18,18,18,18,18,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,18,18,18,18,18,18,10,10,10,10,10,10,10,10,10,10,10,10,10,6,6,10,6,6,6,6,6,6,6,6,6,6,6,6,6,4,4,4,4,4,4,2,2,2,2,2,2,2,2,0,0,0]
const frameSrc = (i) => `/assets/world/frames/n-${String(i + 1).padStart(3, '0')}.webp`

function WorldBackdrop() {
  const canvasRef = useRef(null)
  const dayRef = useRef(null)
  const netherRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    const dayEl = dayRef.current
    const netherEl = netherRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const frames = new Array(FRAME_COUNT)
    const ready = new Array(FRAME_COUNT).fill(false)
    let raf = 0, cur = 1, target = 1, primed = false, drawnIdx = -1, disposed = false

    // a decoded 4K frame is ~33MB, so the browser can't cache many — drawing the
    // raw <img> re-decodes the webp (10-40ms) and that hitch is scroll jitter.
    // fix: keep a sliding window of frames around the scroll position pre-decoded
    // AND pre-scaled to the canvas as GPU-backed ImageBitmaps; drawing one is an
    // instant 1:1 blit. the window follows the scroll; bitmaps outside it are
    // closed to cap memory.
    const bitmaps = new Map()      // idx -> full-res ImageBitmap (sliding window)
    const building = new Set()     // idx with a build in flight
    let gen = 0                    // bumps on resize: stale bitmaps are discarded
    const WINDOW = 24             // pre-scaled frames each side of the cursor (~1/3 of the set)
    const EVICT = WINDOW + 6
    let drawnKind = ''             // 'full' | 'raw'
    let drawnA = -1, drawnAlpha = 0 // last painted frame + pan shift (canvas px)

    const still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const wantIdx = () => Math.round(cur * (FRAME_COUNT - 1))
    const targetIdx = () => Math.round(target * (FRAME_COUNT - 1))

    // PAD: extra source rows kept above/below the cover crop so a frame can be
    // TRANSLATED by up to ±half the largest inter-frame camera shift without
    // exposing an empty strip. max measured shift is 20 src px → ±10 applied.
    const PAD = 12
    let coverS = 1, padC = 0 // cover scale + pad in canvas px (set in resize)

    const buildBitmap = (i) => {
      if (disposed || bitmaps.has(i) || building.has(i) || !ready[i] || building.size >= 2) return
      const img = frames[i]
      const myGen = gen
      const cw = canvas.width, ch = canvas.height
      if (!cw || !ch) return
      // cover-crop plus PAD bleed rows; bitmap is canvas-sized + 2*padC tall
      const s = coverS
      const sw = cw / s, sh = ch / s + 2 * PAD
      const sx = (img.naturalWidth - sw) / 2
      const sy = Math.max(0, (img.naturalHeight - sh) / 2)
      building.add(i)
      createImageBitmap(img, sx, sy, sw, sh, { resizeWidth: cw, resizeHeight: ch + 2 * padC, resizeQuality: 'high' })
        .then(bm => {
          building.delete(i)
          if (disposed || myGen !== gen) { bm.close(); return }
          bitmaps.set(i, bm)
          // repaint crisp when the frame under (or next to) the cursor lands
          if (Math.abs(i - wantIdx()) <= 1 && !(drawnIdx === i && drawnKind === 'full')) { drawnIdx = -1; draw() }
          fillWindow()
        })
        .catch(() => building.delete(i))
    }

    // keep the ±WINDOW ring around the target built, nearest-first; evict beyond
    const fillWindow = () => {
      const c = targetIdx()
      for (let d = 0; d <= WINDOW; d++) {
        buildBitmap(c + d)
        buildBitmap(c - d)
      }
      for (const [i, bm] of bitmaps) {
        if (Math.abs(i - c) > EVICT) { bm.close(); bitmaps.delete(i) }
      }
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(window.innerWidth * dpr)
      canvas.height = Math.round(window.innerHeight * dpr)
      // pin the CSS size to the exact same pixels as the bitmap — any mismatch
      // between attribute size and CSS size shows up as a stretched canvas
      canvas.style.width = window.innerWidth + 'px'
      canvas.style.height = window.innerHeight + 'px'
      // resizing resets context state — re-request high-quality resampling, or the
      // 4K→viewport downscale uses the blurry low-quality default
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      // cover scale that also reserves the PAD bleed rows (2560x1440 source)
      coverS = Math.max(canvas.width / 2560, canvas.height / (1440 - 2 * PAD))
      padC = Math.round(PAD * coverS)
      // canvas-sized bitmaps are now stale — rebuild the window at the new size
      gen++
      for (const bm of bitmaps.values()) bm.close()
      bitmaps.clear()
      drawnIdx = -1; drawnKind = ''; drawnA = -1; drawnAlpha = 0
      fillWindow()
      draw()
      panDay()
    }

    // cover-fit draw of a raw frame (fallback while its bitmap builds)
    const paint = (img) => {
      const cw = canvas.width, ch = canvas.height
      const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight)
      const w = img.naturalWidth * s, h = img.naturalHeight * s
      ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h)
    }

    // single-frame paint, full resolution always:
    // (1) the pre-scaled bitmap (1ms blit),
    // (2) the exact frame drawn raw (pre-decoded at load = cached draw),
    // (3) the nearest loaded frame while the first seconds of loading finish.
    // single-frame paint at a vertical pan offset (canvas px). full resolution:
    // (1) the pre-scaled padded bitmap (1ms blit), (2) the exact frame raw
    // (pre-decoded = cached), (3) nearest loaded while boot finishes.
    const drawAt = (want, shift) => {
      shift = Math.round(shift) // integer-px translate = as crisp as unshifted
      const bm = bitmaps.get(want)
      if (bm) {
        if (want === drawnA && drawnKind === 'full' && shift === drawnAlpha) return
        drawnIdx = want; drawnKind = 'full'; drawnA = want; drawnAlpha = shift
        ctx.drawImage(bm, 0, -padC + shift)
        return
      }
      if (ready[want]) {
        if (want === drawnA && drawnKind === 'raw') return
        drawnIdx = want; drawnKind = 'raw'; drawnA = want; drawnAlpha = 0
        paint(frames[want]) // cover draw, unshifted — load/miss fallback only
        return
      }
      let idx = -1
      for (let d = 1; d < FRAME_COUNT; d++) {
        if (want - d >= 0 && ready[want - d]) { idx = want - d; break }
        if (want + d < FRAME_COUNT && ready[want + d]) { idx = want + d; break }
      }
      if (idx === -1 || (idx === drawnA && drawnKind === 'raw')) return
      drawnIdx = idx; drawnKind = 'raw'; drawnA = idx; drawnAlpha = 0
      paint(frames[idx])
    }

    // MOTION-COMPENSATED scrub. between two frames the camera has simply moved
    // WORLD_DY[iA] px vertically, so instead of crossfading (which paints two
    // vertically-offset copies of the terrain — a literal double image that
    // reads as "vertical stretching"), TRANSLATE the nearest sharp frame by the
    // fractional camera offset and swap frames at the midpoint, where the two
    // estimates coincide. scene motion is pixel-continuous, always one frame,
    // zero ghosting. at rest the settle-snap parks on shift 0 = pixel-crisp.
    const draw = () => {
      const pos = cur * (FRAME_COUNT - 1)
      let iA = Math.floor(pos)
      if (iA < 0) iA = 0
      if (iA > FRAME_COUNT - 2) iA = FRAME_COUNT - 2
      const frac = Math.min(1, Math.max(0, pos - iA))
      if (frac < 0.02) return drawAt(iA, 0)
      if (frac > 0.98) return drawAt(iA + 1, 0)
      const dyC = (WORLD_DY[iA] || 0) * coverS
      if (frac <= 0.5) return drawAt(iA, frac * dyC)
      return drawAt(iA + 1, -(1 - frac) * dyC)
    }

    // glide straight to the raw scroll position — NO rest snapping. the pan
    // renderer shows a fractional position as a single frame translated by an
    // integer number of pixels, which is exactly as crisp as an untranslated
    // frame — so snapping to whole frames would only quantize slow scrolling
    // into whole-frame lurches (measured: 19px jumps on a 6px creep).
    // floor 1.0 frames/tick: a notch catches up in ~3 ticks (~45ms) — Neev
    // wanted the trail shorter. safe to run hot because the pan renderer is
    // continuous (a faster glide is just a faster smooth pan, no frame-step
    // artifacts). the ratio term (0.3) only engages past ~1.3 notches of gap,
    // so single notches still play at one constant rate — no lurch-then-crawl.
    const advance = () => {
      const span = FRAME_COUNT - 1
      const dF = (target - cur) * span
      if (Math.abs(dF) < 0.01) { cur = target; return true }
      const cap = Math.max(1.0, Math.abs(dF) * 0.3)
      cur += (Math.sign(dF) * Math.min(Math.abs(dF), cap)) / span
      return false
    }
    // the day and nether layers are ONE continuous image each, so they get the
    // smoothest physics available: the same eased cur as the night scrub,
    // applied as a float translateY — sub-pixel continuous, no frames to
    // quantize to. they ride the glide loop instead of the raw scroll, so wheel
    // notches ease instead of jumping 1:1 (their CSS scroll-driven pan is off).
    // each image pans by its own aspect: h/w = 1.1024 (day) / 0.9457 (nether);
    // the width factor is 1/aspect so the image always covers the viewport.
    const panImg = (el, aspect, wFactor) => {
      if (!el) return
      const vw = window.innerWidth, vh = window.innerHeight
      const travel = Math.min(0, vh - aspect * Math.max(vw, wFactor * vh))
      el.style.transform = `translateX(-50%) translateY(${(1 - cur) * travel}px)`
    }
    const panDay = () => {
      panImg(dayEl, 1.1024, 0.91)
      panImg(netherEl, 0.9457, 1.06)
    }

    let lastTick = 0
    const tick = (ts) => {
      raf = 0
      lastTick = ts || performance.now()
      const settled = advance()
      draw()
      panDay()
      maybeFillWindow(lastTick)
      if (!settled) raf = requestAnimationFrame(tick)
    }
    const ensure = () => { if (!raf) raf = requestAnimationFrame(tick) }

    // window refills run on the rAF tick, NOT on the scroll event, and are
    // throttled by distance AND time — so a fast scroll drives one steady build
    // cadence instead of a build storm (one evict+build pass per wheel event was
    // the other half of the jank, and it starved the raster that the compositor
    // then papered over with a stretched snapshot). centered on the TARGET frame,
    // i.e. where the scroll is landing, so the crisp window is ready on settle.
    // refills once per notch-ish, never several times within one
    let lastFillCenter = -999, lastFillTs = -999
    const maybeFillWindow = (ts) => {
      const c = targetIdx()
      if (bitmaps.size && Math.abs(c - lastFillCenter) < 3) return
      if (bitmaps.size && ts - lastFillTs < 120) return
      lastFillCenter = c; lastFillTs = ts
      fillWindow()
    }

    // scroll 0 (top) = surface = the LAST frame; bottom = deepest = frame 0.
    // scroll events only update the target — advancing, drawing and window builds
    // all happen once per display frame in the rAF tick. doing that work per
    // scroll event saturated the main thread on fast scrolls (the lag, and Chrome
    // masking the missed frame with a stretched layer snapshot). if rAF is stalled
    // (hidden/occluded tab) fall back to a direct paint so the page still tracks.
    const unsub = subscribeScroll(p => {
      target = 1 - p
      if (!primed) { primed = true; cur = target }
      if (still) { cur = target; draw(); return } // reduced motion: no glide
      if (performance.now() - lastTick > 120 && !raf) { advance(); draw(); panDay() }
      ensure()
    })

    // load order: a sparse skeleton first (every 8th frame, so every scroll
    // depth shows roughly-correct terrain within the first few MB — no more
    // "bottom of the page looks like the surface" while loading), then the rest
    // surface-first (the page opens at the top).
    const order = []
    for (let i = FRAME_COUNT - 1; i >= 0; i -= 6) order.push(i)
    if (!order.includes(0)) order.push(0)
    for (let i = FRAME_COUNT - 1; i >= 0; i--) if (!order.includes(i)) order.push(i)
    for (const i of order) {
      const img = new Image()
      img.decoding = 'async'
      const arrived = () => {
        if (disposed) return
        ready[i] = true
        frames[i] = img
        const want = wantIdx()
        if (Math.abs(i - want) <= WINDOW) buildBitmap(i)
        if (Math.abs(i - want) <= 4 || drawnIdx === -1) { drawnIdx = -1; draw() }
      }
      // decode() before marking ready: the decoded bitmap lands in the browser's
      // image cache, so even the raw-draw fallback is a free blit, never a
      // synchronous decode stall mid-scroll
      img.onload = () => { img.decode().then(arrived).catch(arrived) }
      img.src = frameSrc(i)
      frames[i] = img
    }

    resize()
    window.addEventListener('resize', resize)
    // read-only state probe (dev tooling + automated verification)
    window.__world = () => ({ drawnIdx, drawnKind, drawnA, shift: drawnAlpha, cur, target, full: bitmaps.size, loaded: ready.filter(Boolean).length })
    return () => {
      disposed = true; unsub(); cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      delete window.__world
      for (const bm of bitmaps.values()) bm.close()
      bitmaps.clear()
    }
  }, [])
  return (
    <div className="world-bg" aria-hidden="true">
      <img className="world-poster" src="/assets/world/night-poster.webp" alt="" decoding="async" />
      <canvas ref={canvasRef} className="world-canvas world-night" />
      <img
        ref={dayRef}
        className="world-img world-day"
        src="/assets/world/day-1600.webp"
        srcSet="/assets/world/day-1080.webp 1080w, /assets/world/day-1600.webp 1600w, /assets/world/day-2560.webp 2560w"
        sizes="100vw"
        decoding="async"
        alt=""
      />
      <img
        ref={netherRef}
        className="world-img world-nether"
        src="/assets/world/nether-1600.webp"
        srcSet="/assets/world/nether-1080.webp 1080w, /assets/world/nether-1600.webp 1600w, /assets/world/nether-2560.webp 2560w"
        sizes="100vw"
        decoding="async"
        alt=""
      />
      <div className="world-tint" />
    </div>
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
    <div className={'toast' + (t.rare ? ' toast-rare' : '')} role="status">
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

      <Toast />
      <AchievementsOverlay />
      <EasterEggs />
      <CreeperEgg show={creeper} />
    </div>
  )
}
