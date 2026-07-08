import { useEffect, useState } from 'react'
import { burst } from '../lib/particles.js'

// creative build mode: while /gamemode creative is on, clicking the open world
// PLACES a real block, snapped to the block grid — click a placed block to
// break it. builds persist in localStorage, so your marks on the world survive
// reloads. blocks render behind the content panels, so they can never cover
// the actual site.
const KEY = 'mcop_blocks_v1'
const SIZE = 36
const TEXES = ['grass-side.png', 'stone.png', 'planks.png', 'log.png', 'gravel.png']

const load = () => {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

export default function BuildLayer() {
  const [blocks, setBlocks] = useState(load)

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(blocks)) } catch { /* full */ }
  }, [blocks])

  useEffect(() => {
    const onClick = (e) => {
      if (!document.documentElement.classList.contains('is-creative')) return
      // only the open world is buildable — never UI, text or panels
      if (e.target.closest('a, button, input, textarea, select, summary, label, .frame, .card, .egg-cmd, .ach-overlay, .egg-death, .topbar, .footer, img, svg, h1, h2, h3, p, li, .lever')) return
      const x = Math.floor(e.pageX / SIZE) * SIZE
      const y = Math.floor(e.pageY / SIZE) * SIZE
      setBlocks(bs => {
        const hit = bs.findIndex(b => b.x === x && b.y === y)
        if (hit >= 0) { // break it
          burst(e.clientX, e.clientY)
          const next = [...bs]
          next.splice(hit, 1)
          return next
        }
        if (bs.length >= 400) return bs // the world is full
        return [...bs, { x, y, t: Math.floor(Math.random() * TEXES.length) }]
      })
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  if (blocks.length === 0) return null
  return (
    <div className="build-layer" aria-hidden="true">
      {blocks.map(b => (
        <div
          key={b.x + '_' + b.y}
          className="build-block"
          style={{ left: b.x, top: b.y, backgroundImage: `url(/assets/textures/blocks/${TEXES[b.t] || TEXES[0]})` }}
        />
      ))}
    </div>
  )
}
