// living-world effects: weather, potion effects, xp bursts, ender pops and the
// minecart tour. imperative DOM like particles.js — spawn, animate, remove.
const reduced = () =>
  window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* ── weather ──────────────────────────────────────────────────────── */
let rainEl = null
let boltTimer = 0

function strike() {
  const b = document.createElement('div')
  b.className = 'fx-bolt'
  b.style.left = (8 + Math.random() * 84) + 'vw'
  b.innerHTML =
    '<svg viewBox="0 0 40 240" aria-hidden="true">' +
    '<polyline points="22,0 14,60 26,64 10,130 24,134 6,210" fill="none" stroke="#eaf2ff" stroke-width="3"/>' +
    '</svg>'
  const f = document.createElement('div')
  f.className = 'fx-flash'
  document.body.appendChild(b)
  document.body.appendChild(f)
  setTimeout(() => { b.remove(); f.remove() }, 700)
}

// 'rain' | 'thunder' | 'clear' → false when reduced-motion vetoes it
export function setWeather(kind) {
  clearInterval(boltTimer)
  boltTimer = 0
  if (kind === 'clear') {
    if (rainEl) {
      const el = rainEl
      rainEl = null
      el.classList.add('gone')
      setTimeout(() => el.remove(), 900)
    }
    return true
  }
  if (reduced()) return false
  if (!rainEl) {
    rainEl = document.createElement('div')
    rainEl.className = 'fx-rain'
    document.body.appendChild(rainEl)
  }
  rainEl.classList.remove('gone')
  rainEl.classList.toggle('storm', kind === 'thunder')
  if (kind === 'thunder') {
    setTimeout(strike, 1100)
    boltTimer = setInterval(() => { if (Math.random() < 0.75) strike() }, 7000)
  }
  return true
}

export const weatherActive = () => !!rainEl

/* ── potion effects ───────────────────────────────────────────────── */
let fxTimer = 0

// 'nausea' | 'levitation' | 'clear' → duration ms, 0 for clear, -1 if vetoed
export function applyEffect(kind) {
  const root = document.documentElement
  clearTimeout(fxTimer)
  root.classList.remove('fx-nausea', 'fx-levitate')
  if (kind === 'clear') return 0
  if (reduced()) return -1
  const cls = kind === 'nausea' ? 'fx-nausea' : kind === 'levitation' ? 'fx-levitate' : null
  if (!cls) return -2
  root.classList.add(cls)
  fxTimer = setTimeout(() => root.classList.remove(cls), 8000)
  return 8000
}

/* ── xp burst: orbs fly into the xp bar, +1 level pops ────────────── */
export function xpBurst() {
  const bar = document.querySelector('.scroll-xp')
  const r = bar
    ? bar.getBoundingClientRect()
    : { left: window.innerWidth / 2, top: window.innerHeight - 14, width: 0, height: 0 }
  const tx = r.left + r.width / 2
  const ty = r.top + r.height / 2
  if (!reduced()) {
    for (let i = 0; i < 12; i++) {
      const o = document.createElement('span')
      o.className = 'fx-xp-orb'
      const sx = window.innerWidth * (0.15 + Math.random() * 0.7)
      const sy = window.innerHeight * (0.25 + Math.random() * 0.5)
      o.style.left = sx + 'px'
      o.style.top = sy + 'px'
      document.body.appendChild(o)
      o.animate(
        [
          { transform: 'translate(0,0) scale(1)', opacity: 1 },
          { transform: `translate(${tx - sx}px, ${ty - sy}px) scale(0.45)`, opacity: 0.9 },
        ],
        { duration: 620 + Math.random() * 480, delay: Math.random() * 240, easing: 'cubic-bezier(.5,-0.2,.85,.6)', fill: 'forwards' },
      ).onfinish = () => o.remove()
    }
  }
  if (bar) {
    bar.classList.add('fx-xp-flash')
    setTimeout(() => bar.classList.remove('fx-xp-flash'), 1100)
  }
  const lvl = document.createElement('div')
  lvl.className = 'fx-level'
  lvl.textContent = '+1'
  document.body.appendChild(lvl)
  setTimeout(() => lvl.remove(), 1600)
}

/* ── ender pop: purple teleport particles ─────────────────────────── */
export function enderPop(x, y) {
  if (reduced()) return
  for (let i = 0; i < 12; i++) {
    const p = document.createElement('span')
    p.className = 'fx-ender-bit'
    p.style.left = x + 'px'
    p.style.top = y + 'px'
    p.style.setProperty('--dx', (Math.random() * 2 - 1) * 60 + 'px')
    p.style.setProperty('--dy', (Math.random() * 2 - 1) * 60 + 'px')
    document.body.appendChild(p)
    setTimeout(() => p.remove(), 720)
  }
}

/* ── the ender dragon flyby + boss bar ────────────────────────────── */
let dragonUp = false

export function dragonFlyby() {
  if (reduced() || dragonUp) return false
  dragonUp = true
  const d = document.createElement('div')
  d.className = 'fx-dragon'
  // hand-pixelled silhouette: long body, angular wings, purple eye
  d.innerHTML =
    '<svg viewBox="0 0 96 48" aria-hidden="true">' +
    '<g class="fx-dragon-wing up"><polygon points="40,22 18,2 50,14" fill="#0c0c14"/></g>' +
    '<g class="fx-dragon-wing down"><polygon points="46,24 30,44 56,30" fill="#0a0a11"/></g>' +
    '<polygon points="8,26 20,22 34,20 52,20 66,22 74,20 80,16 88,14 92,17 86,20 78,24 66,27 50,26 34,26 20,28" fill="#15151d"/>' +
    '<rect x="85" y="15" width="3" height="2" fill="#d76bf0"/>' +
    '<polygon points="8,26 2,22 6,27 0,28 7,29" fill="#15151d"/>' +
    '</svg>'
  const bar = document.createElement('div')
  bar.className = 'fx-bossbar'
  bar.innerHTML = '<span class="fx-bossbar-label">Ender Dragon</span><div class="fx-bossbar-track"><div class="fx-bossbar-fill"></div></div>'
  document.body.appendChild(d)
  document.body.appendChild(bar)
  setTimeout(() => bar.classList.add('gone'), 8200)
  setTimeout(() => { d.remove(); bar.remove(); dragonUp = false }, 9400)
  return true
}

/* ── the minecart tour: cinematic auto-descent, hop off any time ──── */
let rideRaf = 0
let rideStop = null

export const rideActive = () => !!rideRaf

export function stopRide(reason = 'hop') {
  if (rideStop) rideStop(reason)
}

// returns false if reduced-motion (or already riding); onEnd('arrived'|'hop')
export function startRide(onEnd) {
  if (reduced() || rideRaf) return false
  const cart = document.createElement('div')
  cart.className = 'fx-minecart'
  cart.innerHTML = '<img src="/assets/textures/blocks/minecart.png" alt="">'
  document.body.appendChild(cart)
  const maxY = () => document.documentElement.scrollHeight - window.innerHeight
  let pos = window.scrollY
  let last = performance.now()
  let speed = 0
  const CRUISE = 300 // px/s — reading pace through the world
  const hop = () => cleanup('hop')
  const onKey = (e) => {
    if (['Escape', 'ArrowUp', 'ArrowDown', ' ', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.key)) hop()
  }
  const events = [['wheel', hop], ['touchmove', hop], ['pointerdown', hop], ['keydown', onKey]]
  const cleanup = (reason) => {
    cancelAnimationFrame(rideRaf)
    rideRaf = 0
    rideStop = null
    events.forEach(([t, f]) => window.removeEventListener(t, f))
    cart.classList.add('gone')
    setTimeout(() => cart.remove(), 450)
    onEnd && onEnd(reason)
  }
  rideStop = cleanup
  events.forEach(([t, f]) => window.addEventListener(t, f, { passive: true }))
  const step = (ts) => {
    const dt = Math.min((ts - last) / 1000, 0.05)
    last = ts
    speed = Math.min(CRUISE, speed + CRUISE * dt * 0.8) // gentle departure
    const remaining = maxY() - pos
    pos += Math.min(speed, Math.max(70, remaining * 0.9)) * dt // brake into bedrock
    if (pos >= maxY() - 1) {
      window.scrollTo(0, maxY())
      cleanup('arrived')
      return
    }
    window.scrollTo(0, pos)
    rideRaf = requestAnimationFrame(step)
  }
  rideRaf = requestAnimationFrame(step)
  return true
}
