import { useRef, useState } from 'react'
import { burst } from '../lib/particles.js'
import { unlock } from '../lib/achievements.js'

const TEX = '/assets/textures/blocks/'

// hand-placed veins along the section edges so the reading panels stay clear.
const VEINS = {
  stone: [
    { tex: 'ore-gold.png', ox: '4%', oy: '16%' },
    { tex: 'ore-redstone.png', ox: '92%', oy: '28%' },
    { tex: 'ore-gold.png', ox: '7%', oy: '62%' },
    { tex: 'ore-redstone.png', ox: '90%', oy: '78%' },
  ],
  mineshaft: [
    { tex: 'ore-gold.png', ox: '5%', oy: '20%' },
    { tex: 'ore-diamond.png', ox: '91%', oy: '52%', diamond: true },
    { tex: 'ore-redstone.png', ox: '3%', oy: '74%' },
  ],
}

function Ore({ tex, ox, oy, diamond }) {
  const [state, setState] = useState('idle') // idle | mining | mined
  const timer = useRef(0)
  const el = useRef(null)

  const start = (e) => {
    if (state !== 'idle') return
    e.preventDefault()
    setState('mining')
    timer.current = setTimeout(() => {
      const r = el.current?.getBoundingClientRect()
      if (r) burst(r.left + r.width / 2, r.top + r.height / 2)
      setState('mined')
      window.dispatchEvent(new CustomEvent('mcop:chat', {
        detail: diamond
          ? { text: 'You mined DIAMONDS!', cls: 'good' }
          : { text: 'Block mined', cls: 'muted' },
      }))
      if (diamond) unlock('diamonds')
      setTimeout(() => setState('idle'), 45000) // the vein regenerates
    }, 950)
  }
  const cancel = () => {
    if (state === 'mining') { clearTimeout(timer.current); setState('idle') }
  }

  return (
    <div
      ref={el}
      className={'ore ore-mine' + (state === 'mining' ? ' mining' : '') + (state === 'mined' ? ' mined' : '')}
      style={{ '--ox': ox, '--oy': oy, '--tex': `url(${TEX}${tex})` }}
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onContextMenu={e => e.preventDefault()}
      title="Hold to mine"
    />
  )
}

// minable ores in the cave walls — hold the mouse down like you mean it
export default function Ores({ variant }) {
  return VEINS[variant].map((v, i) => <Ore key={i} {...v} />)
}
