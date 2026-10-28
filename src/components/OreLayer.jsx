import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { worldProgressAt } from '../lib/scroll.js'
import { ORES, ITEM, oreTexture, pickOre, breakTime, canMine, collect, pickNeeded, getMine } from '../lib/mining.js'

// the cave walls: ore veins along the edges of every page, each kind at the
// depth it belongs (coal near the surface, diamonds down in the deepslate,
// debris in the Nether). hold one down to mine it — cracks spread, it breaks
// into its own pixels, and the drop flies into the hotbar. a page's veins sit
// in the same spots every visit and grow back a while after you mine them.
const RESPAWN_MS = 90 * 1000
const MINED_KEY = 'mcop_mined'
const HINT_KEY = 'mcop_mine_hint'
const reduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// seeded random, so a page's veins don't move around between visits
const hash = (s) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7)
function rng(seed) {
  let s = seed || 1
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296)
}

// anything a vein mustn't cover: the reading panels, cards, buttons, the hero
const SOLID = '.frame, .card, .title-screen, .hero-eyebrow, .hero-sub, .hero-bullets li, .activity-ticker, .btn, .dig-cue, .descend-link, .end-links, .wrap, .page > *, .footer'

function layoutVeins(path, nether) {
  const doc = document.documentElement
  const vw = doc.clientWidth
  const phone = vw < 720
  const size = phone ? 34 : 48
  const sy = window.scrollY
  const pageY = (el, edge) => (el ? el.getBoundingClientRect()[edge] + sy : null)
  const top = (pageY(document.querySelector('.topbar'), 'bottom') || 0) + 160
  const bottom = (pageY(document.querySelector('.footer'), 'top') || doc.scrollHeight) - size - 30
  // where the content sits, in page coordinates, to find the free margin at each height
  const solid = [...document.querySelectorAll(SOLID)]
    .map(el => el.getBoundingClientRect())
    .filter(r => r.width > 0 && r.height > 0)
    .map(r => ({ top: r.top + sy, bottom: r.bottom + sy, left: r.left, right: r.right }))
  const freeAt = (y, side) => {
    let free = vw / 2
    for (const r of solid) {
      if (r.bottom < y - 12 || r.top > y + size + 12) continue
      free = Math.min(free, side === 'left' ? r.left : vw - r.right)
    }
    return free
  }
  const rnd = rng(hash(path + (phone ? ':p' : ':d') + (nether ? ':n' : '')))
  const veins = []
  let side = rnd() < 0.5 ? 'left' : 'right'
  for (let y = top + rnd() * 220; y < bottom; y += (phone ? 430 : 480) + rnd() * 240) {
    const Y = 64 - 128 * worldProgressAt(y + size / 2)
    if (!nether && Y > 40) continue                         // sky and topsoil: nothing to dig
    const key = pickOre(Y, rnd, nether)
    // room in the margin: sit in it, clear of the panels; none: poke out of the edge
    const free = freeAt(y, side)
    const x = free >= size + 20 ? 8 + rnd() * Math.min(free - size - 16, 150) : -Math.round(size * 0.3)
    veins.push({ id: `${path}#${veins.length}`, key, deep: !nether && Y < 0, y: Math.round(y), x: Math.round(x), side, size })
    side = rnd() < 0.7 ? (side === 'left' ? 'right' : 'left') : side
  }
  return veins
}

const loadMined = () => {
  try { return JSON.parse(sessionStorage.getItem(MINED_KEY) || '{}') } catch { return {} }
}

// ── the break: the block's own pixels scatter, the drop flies to the hotbar ──
function shatter(x, y, tex) {
  if (reduced()) return
  for (let i = 0; i < 16; i++) {
    const p = document.createElement('span')
    const s = 5 + Math.random() * 6
    p.className = 'mine-bit'
    p.style.cssText = `left:${x}px;top:${y}px;width:${s}px;height:${s}px;background-image:url(${tex});` +
      `background-position:${-Math.random() * 56}px ${-Math.random() * 56}px`
    document.body.appendChild(p)
    const dx = (Math.random() * 2 - 1) * 70
    const up = -18 - Math.random() * 46
    p.animate([
      { transform: 'translate(-50%, -50%)', opacity: 1 },
      { transform: `translate(calc(-50% + ${dx * 0.55}px), calc(-50% + ${up}px))`, opacity: 1, offset: 0.35 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${up + 120}px))`, opacity: 0 },
    ], { duration: 650 + Math.random() * 350, easing: 'cubic-bezier(.25,.6,.55,1)' }).onfinish = () => p.remove()
  }
}

function hudTarget(sel) {
  const t = document.querySelector(sel)
  const r = t && t.getBoundingClientRect()
  return r && r.width ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: window.innerWidth / 2, y: window.innerHeight - 34 }
}

function flyDrop(x, y, icon, n) {
  if (reduced()) return
  const to = hudTarget('.hotbar-slots')
  for (let i = 0; i < Math.min(n, 3); i++) {
    const it = document.createElement('img')
    it.src = icon
    it.alt = ''
    it.className = 'mine-drop'
    it.style.left = x + 'px'
    it.style.top = y + 'px'
    document.body.appendChild(it)
    const jx = (Math.random() * 2 - 1) * 16
    it.animate([
      { transform: 'translate(-50%, -50%) scale(0.6)', opacity: 0 },
      { transform: `translate(calc(-50% + ${jx}px), calc(-50% - 28px)) scale(1.1)`, opacity: 1, offset: 0.3 },
      { transform: `translate(calc(-50% + ${jx}px), calc(-50% - 20px)) scale(1.1)`, opacity: 1, offset: 0.48 },
      { transform: `translate(calc(-50% + ${to.x - x}px), calc(-50% + ${to.y - y}px)) scale(0.7)`, opacity: 0.9 },
    ], { duration: 950 + i * 90, delay: i * 70, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'both' }).onfinish = () => it.remove()
  }
}

function xpOrbs(x, y, xp) {
  if (reduced() || xp <= 0) return
  const to = hudTarget('.hotbar-xp')
  for (let i = 0; i < Math.min(xp, 6); i++) {
    const o = document.createElement('span')
    o.className = 'mine-orb'
    o.style.left = x + 'px'
    o.style.top = y + 'px'
    document.body.appendChild(o)
    const sx = (Math.random() * 2 - 1) * 40
    const sy = -10 - Math.random() * 40
    o.animate([
      { transform: 'translate(-50%, -50%) scale(0.4)', opacity: 0 },
      { transform: `translate(calc(-50% + ${sx}px), calc(-50% + ${sy}px)) scale(1)`, opacity: 1, offset: 0.3 },
      { transform: `translate(calc(-50% + ${to.x - x}px), calc(-50% + ${to.y - y}px)) scale(0.5)`, opacity: 0.8 },
    ], { duration: 900 + Math.random() * 300, delay: 120 + i * 60, easing: 'cubic-bezier(.6,0,.4,1)', fill: 'both' }).onfinish = () => o.remove()
  }
}

const chat = (text, cls = '') => window.dispatchEvent(new CustomEvent('mcop:chat', { detail: { text, cls } }))

function Vein({ v, onMined, hint }) {
  const [phase, setPhase] = useState('idle')   // idle | mining | stuck
  const [ms, setMs] = useState(1000)
  const timer = useRef(0)
  const el = useRef(null)
  const tex = oreTexture(v.key, v.deep)

  useEffect(() => () => clearTimeout(timer.current), [])

  const breakIt = () => {
    const r = el.current.getBoundingClientRect()
    const x = r.left + r.width / 2, y = r.top + r.height / 2
    const got = collect(v.key, v.deep)
    shatter(x, y, tex)
    flyDrop(x, y, ITEM + got.drop + '.png', got.n)
    xpOrbs(x, y, got.xp)
    if (navigator.vibrate) navigator.vibrate(12)
    setPhase('idle')
    onMined(v.id)
  }
  const start = (e) => {
    if (phase !== 'idle' || (e.button !== undefined && e.button > 0)) return
    e.preventDefault()
    if (!canMine(v.key)) {
      // the pickaxe bounces off: a few cracks, then nothing — no drop, no break
      setPhase('stuck')
      timer.current = setTimeout(() => {
        setPhase('idle')
        chat(`${ORES[v.key].name} needs a ${pickNeeded(v.key)}`, 'err')
      }, 650)
      return
    }
    const d = breakTime(v.key, v.deep)
    setMs(d)
    setPhase('mining')
    timer.current = setTimeout(breakIt, reduced() ? Math.min(d, 400) : d)
  }
  const stop = () => {
    if (phase === 'mining') { clearTimeout(timer.current); setPhase('idle') }
  }

  return (
    <div
      ref={el}
      className={'mine-ore ' + phase}
      data-id={v.id}
      title={ORES[v.key].name}
      style={{ top: v.y, [v.side]: v.x, width: v.size, height: v.size, backgroundImage: `url(${tex})`, '--ms': ms + 'ms', '--size': v.size + 'px' }}
      onPointerDown={start}
      onPointerEnter={() => window.dispatchEvent(new Event('mcop:show-hotbar'))}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onContextMenu={(e) => e.preventDefault()}
    >
      <span className="mine-crack" />
      {hint && <span className={'mine-hint mine-hint-' + v.side}>hold to mine</span>}
    </div>
  )
}

export default function OreLayer() {
  const { pathname } = useLocation()
  const [veins, setVeins] = useState([])
  const [mined, setMined] = useState(loadMined)
  const [pick, setPick] = useState(getMine().pick)
  const [hintId, setHintId] = useState(null)
  const [, tick] = useState(0)
  const layer = useRef(null)

  // lay the veins out once the page has settled, and again whenever its
  // shape changes: resize, the Nether, content arriving late
  useEffect(() => {
    let t = 0
    const run = () => {
      const nether = document.documentElement.dataset.dimension === 'nether'
      setVeins(layoutVeins(pathname, nether))
    }
    const soon = (ms) => { clearTimeout(t); t = setTimeout(run, ms) }
    setVeins([])
    const t1 = setTimeout(run, 500)
    const t2 = setTimeout(run, 1400)
    const onResize = () => soon(250)
    window.addEventListener('resize', onResize)
    const mo = new MutationObserver(() => soon(60))
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-dimension'] })
    let lastH = document.documentElement.scrollHeight
    const ro = new ResizeObserver(() => {
      const h = document.documentElement.scrollHeight
      if (Math.abs(h - lastH) > 80) { lastH = h; soon(300) }
    })
    ro.observe(document.body)
    return () => { clearTimeout(t); clearTimeout(t1); clearTimeout(t2); window.removeEventListener('resize', onResize); mo.disconnect(); ro.disconnect() }
  }, [pathname])

  useEffect(() => {
    const on = () => setPick(getMine().pick)
    window.addEventListener('mcop:mine-changed', on)
    return () => window.removeEventListener('mcop:mine-changed', on)
  }, [])

  // mined veins grow back: re-render when the next one is due
  useEffect(() => {
    const now = Date.now()
    const due = Object.values(mined).map(t => t + RESPAWN_MS - now).filter(d => d > 0)
    if (!due.length) return
    const t = setTimeout(() => tick(n => n + 1), Math.min(...due) + 50)
    return () => clearTimeout(t)
  }, [mined, veins])

  // first visit: point out the first vein that scrolls into view
  useEffect(() => {
    let seen = false
    try { seen = localStorage.getItem(HINT_KEY) === '1' } catch { /* */ }
    if (seen || getMine().mined > 0 || !veins.length || !layer.current) return
    const io = new IntersectionObserver((entries) => {
      const hit = entries.find(en => en.isIntersecting && en.intersectionRatio > 0.9)
      if (!hit) return
      io.disconnect()
      try { localStorage.setItem(HINT_KEY, '1') } catch { /* */ }
      setHintId(hit.target.dataset.id)
      setTimeout(() => setHintId(null), 6500)
    }, { threshold: [0.9] })
    layer.current.querySelectorAll('.mine-ore').forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [veins])

  const onMined = (id) => {
    setMined(m => {
      const next = { ...m, [id]: Date.now() }
      // forget anything long grown back
      for (const k in next) if (Date.now() - next[k] > RESPAWN_MS) delete next[k]
      try { sessionStorage.setItem(MINED_KEY, JSON.stringify(next)) } catch { /* */ }
      return next
    })
  }

  const now = Date.now()
  return (
    <div className="mine-layer" ref={layer} data-pick={pick} aria-hidden="true">
      {veins.map(v => (mined[v.id] && now - mined[v.id] < RESPAWN_MS
        ? null
        : <Vein key={v.id} v={v} onMined={onMined} hint={hintId === v.id} />))}
    </div>
  )
}
