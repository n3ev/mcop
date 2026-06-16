// tiny block-break particle burst at a screen point. respects reduced-motion.
export function burst(x, y) {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
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
