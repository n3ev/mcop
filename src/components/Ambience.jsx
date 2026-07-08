import { useEffect } from 'react'

// ambient life: rare shooting stars in the night sky, enderman eyes blinking
// in the dark of the stone/mineshaft strata. subtle by design — you should
// wonder whether you really saw it.
const reduced = () =>
  window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function Ambience() {
  useEffect(() => {
    if (reduced()) return

    const night = () => document.documentElement.dataset.theme !== 'day'
    const overworld = () => document.documentElement.dataset.dimension !== 'nether'

    const spawnStar = () => {
      if (!night() || !overworld()) return
      const sky = document.querySelector('.stratum-sky')
      if (!sky) return
      const r = sky.getBoundingClientRect()
      if (r.bottom < 120 || r.top > window.innerHeight * 0.6) return // sky off-screen
      const s = document.createElement('div')
      s.className = 'fx-star'
      s.style.left = (5 + Math.random() * 65) + '%'
      s.style.top = (4 + Math.random() * 28) + '%'
      sky.appendChild(s)
      setTimeout(() => s.remove(), 1400)
    }

    const spawnEyes = () => {
      if (!night()) return
      const secs = [...document.querySelectorAll('.stratum-stone, .stratum-mineshaft')]
      const vis = secs.find(sec => {
        const r = sec.getBoundingClientRect()
        return r.top < window.innerHeight && r.bottom > 220
      })
      if (!vis) return
      const e = document.createElement('div')
      e.className = 'fx-eyes'
      // edges only — never under the reading panels
      e.style.left = Math.random() < 0.5
        ? (2 + Math.random() * 8) + '%'
        : (87 + Math.random() * 9) + '%'
      e.style.top = (15 + Math.random() * 65) + '%'
      vis.appendChild(e)
      setTimeout(() => e.remove(), 5200)
    }

    const tick = () => {
      const roll = Math.random()
      if (roll < 0.3) spawnStar()
      else if (roll < 0.55) spawnEyes()
      // the dragon is command-only (/summon dragon) — never ambient
    }
    const iv = setInterval(tick, 9000)
    // debug/verification hook
    window.__ambience = (k) => (k === 'star' ? spawnStar() : spawnEyes())
    return () => { clearInterval(iv); delete window.__ambience }
  }, [])
  return null
}
