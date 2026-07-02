import { playFirework } from './sound.js'

const reduced = () =>
  window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// tiny block-break particle burst at a screen point. respects reduced-motion.
export function burst(x, y) {
  if (reduced()) return
  for (let i = 0; i < 6; i++) {
    const p = document.createElement('span')
    p.className = 'click-particle'
    p.style.left = x + 'px'
    p.style.top = y + 'px'
    p.style.setProperty('--dx', (Math.random() * 2 - 1) * 34 + 'px')
    p.style.setProperty('--dy', (-10 - Math.random() * 30) + 'px')
    document.body.appendChild(p)
    setTimeout(() => p.remove(), 480)
  }
}

const FIREWORK_COLORS = ['#FFCE42', '#86e05a', '#FF9D3D', '#3F76E4', '#f472b6', '#2ECC71']

function fireworkBurst(x, y) {
  const color = FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)]
  playFirework()
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('span')
    p.className = 'firework-bit'
    const ang = (i / 18) * Math.PI * 2 + Math.random() * 0.3
    const dist = 50 + Math.random() * 70
    p.style.left = x + 'px'
    p.style.top = y + 'px'
    p.style.background = Math.random() < 0.25 ? '#fff' : color
    p.style.setProperty('--dx', Math.cos(ang) * dist + 'px')
    p.style.setProperty('--dy', Math.sin(ang) * dist + 40 + 'px') // +40: bits fall
    document.body.appendChild(p)
    setTimeout(() => p.remove(), 950)
  }
}

// match-found celebration: a short volley of firework bursts across the top
// half of the viewport. sound comes from the bursts themselves.
export function fireworks() {
  if (reduced()) { playFirework(); return }
  const w = window.innerWidth
  const h = window.innerHeight
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      fireworkBurst(w * (0.15 + Math.random() * 0.7), h * (0.12 + Math.random() * 0.35))
    }, i * 320 + Math.random() * 120)
  }
}

// creeper explosion for the easter egg — one big gray-green burst + shake
export function explosion(x, y) {
  document.body.classList.add('mcop-shake')
  setTimeout(() => document.body.classList.remove('mcop-shake'), 500)
  if (reduced()) return
  for (let i = 0; i < 34; i++) {
    const p = document.createElement('span')
    p.className = 'firework-bit'
    const ang = Math.random() * Math.PI * 2
    const dist = 40 + Math.random() * 160
    p.style.left = x + 'px'
    p.style.top = y + 'px'
    p.style.width = p.style.height = (5 + Math.random() * 6) + 'px'
    p.style.background = ['#5FAE3B', '#7F7F7F', '#9D9D9D', '#3E7A2A', '#5A5A5A'][i % 5]
    p.style.setProperty('--dx', Math.cos(ang) * dist + 'px')
    p.style.setProperty('--dy', Math.sin(ang) * dist + 60 + 'px')
    document.body.appendChild(p)
    setTimeout(() => p.remove(), 950)
  }
}
