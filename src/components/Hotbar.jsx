import { useEffect, useRef, useState } from 'react'
import { getMine, PICK, ITEM, ITEM_ORDER, ITEM_NAME, levelOf, nextPick, craft } from '../lib/mining.js'

// the hotbar, the game's own: your pickaxe in the selected slot, what you've
// dug up after it, the experience bar and level above. it rises when you go
// near an ore or mine one and tucks itself away when you're just reading —
// and it stays up while a new pickaxe is ready to craft.
const AWAKE_MS = 9000

export default function Hotbar() {
  const [mine, setMine] = useState(getMine)
  const [awake, setAwake] = useState(false)
  const [landed, setLanded] = useState(null)   // the item that just arrived (its slot pops)
  const sleep = useRef(0)

  useEffect(() => {
    const wake = () => {
      setAwake(true)
      clearTimeout(sleep.current)
      sleep.current = setTimeout(() => setAwake(false), AWAKE_MS)
    }
    const changed = () => setMine({ ...getMine() })
    let landT = 0
    const mined = (e) => {
      wake()
      clearTimeout(landT)
      landT = setTimeout(() => setLanded(e.detail.drop), 820)  // when the flying drop gets there
    }
    window.addEventListener('mcop:mine-changed', changed)
    window.addEventListener('mcop:mine', mined)
    window.addEventListener('mcop:show-hotbar', wake)
    return () => {
      window.removeEventListener('mcop:mine-changed', changed)
      window.removeEventListener('mcop:mine', mined)
      window.removeEventListener('mcop:show-hotbar', wake)
      clearTimeout(sleep.current); clearTimeout(landT)
    }
  }, [])

  const up = nextPick()
  const shown = awake || !!(up && up.ready && mine.mined > 0)
  useEffect(() => {
    document.documentElement.classList.toggle('hud-on', shown)
    return () => document.documentElement.classList.remove('hud-on')
  }, [shown])
  useEffect(() => {
    if (!landed) return
    const t = setTimeout(() => setLanded(null), 300)
    return () => clearTimeout(t)
  }, [landed])

  const items = ITEM_ORDER.filter(i => mine.items[i] > 0).slice(0, 8)
  const { level, progress } = levelOf(mine.xp)
  const slots = Array.from({ length: 8 }, (_, i) => items[i] || null)

  return (
    <div className={'hotbar' + (shown ? ' shown' : '')} aria-hidden={!shown}>
      {up && up.ready && (
        <button className="hotbar-craft" type="button" onClick={craft} tabIndex={shown ? 0 : -1}>
          <img src={PICK[up.pick].icon} alt="" /> Craft {PICK[up.pick].name}
        </button>
      )}
      <div className="hotbar-xp" title={`Level ${level}`}>
        <div className="hotbar-xp-fill" style={{ width: (progress * 100).toFixed(1) + '%' }} />
        {level > 0 && <span className="hotbar-level">{level}</span>}
      </div>
      <div className="hotbar-slots">
        <span className="hotbar-sel" />
        <span className="hotbar-slot" style={{ '--i': 0 }} title={PICK[mine.pick].name}>
          <img src={PICK[mine.pick].icon} alt={PICK[mine.pick].name} />
        </span>
        {slots.map((it, i) => (
          <span key={i} className={'hotbar-slot' + (it && it === landed ? ' pop' : '')} style={{ '--i': i + 1 }} title={it ? `${ITEM_NAME[it]} ×${mine.items[it]}` : undefined}>
            {it && <img src={ITEM + it + '.png'} alt={ITEM_NAME[it]} />}
            {it && mine.items[it] > 1 && <span className="hotbar-count">{mine.items[it]}</span>}
          </span>
        ))}
      </div>
    </div>
  )
}
