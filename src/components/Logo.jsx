import { useRef, useState } from 'react'
import { explosion } from '../lib/particles.js'
import { playFirework, playPop } from '../lib/sound.js'

// real MCOP art: 2x2 grid — M, C, campfire-O, planks-P (animated webp with
// alpha, keyed + rebuilt from the master gif). reduced-motion gets a still.
// to swap art later just replace the files in public/assets/logo/.
const USE_IMAGE = true

export default function Logo({ size = 84 }) {
  const clicks = useRef(0)
  const [rolling, setRolling] = useState(false)

  // easter egg: 10 clicks = boom + barrel roll
  const poke = (e) => {
    clicks.current += 1
    if (clicks.current % 10 === 0) {
      playFirework()
      explosion(e.clientX, e.clientY)
      setRolling(true)
      setTimeout(() => setRolling(false), 1000)
    } else {
      playPop()
    }
  }

  if (USE_IMAGE) {
    const still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    return (
      <img
        className={'mcop-logo-img' + (rolling ? ' logo-roll' : '')}
        src={still ? '/assets/logo/mcop-static.png' : '/assets/logo/mcop.webp'}
        alt="MCOP"
        draggable="false"
        style={{ height: size * 2 }}
        onClick={poke}
      />
    )
  }
  return (
    <div className="mcop-logo" role="img" aria-label="MCOP" style={{ '--tile': size + 'px' }}>
      <span className="logo-tile logo-letter">M</span>
      <span className="logo-tile logo-letter">C</span>
      <span className="logo-tile logo-fire" aria-hidden="true"><span className="logo-flame" /></span>
      <span className="logo-tile logo-plank">P</span>
    </div>
  )
}
