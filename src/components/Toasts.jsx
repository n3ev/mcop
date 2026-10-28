import { useEffect, useRef, useState } from 'react'

// Minecraft's toasts: slabs that slide in at the top right, up to three at a
// time (the rest wait their turn), each sliding away after five seconds.
// advancements get the game's title line — yellow, purple for a challenge —
// over their name; info toasts are a single line. fired via the mcop:toast
// event (lib/toast.js, lib/achievements.js).
const LIFE = 5000
const MAX = 3
let uid = 0

export default function Toasts() {
  const [list, setList] = useState([])      // { id, title, text, icon, kind, leaving }
  const [top, setTop] = useState(8)
  const queue = useRef([])
  const active = useRef(0)                  // on screen and not yet sliding away

  useEffect(() => {
    const timers = new Set()
    const later = (fn, ms) => {
      const t = setTimeout(() => { timers.delete(t); fn() }, ms)
      timers.add(t)
    }
    const show = (detail) => {
      const id = ++uid
      active.current++
      // sit just under the header while it's on screen, at the very top once scrolled past
      const bar = document.querySelector('.topbar')
      setTop(Math.max(8, Math.round((bar ? bar.getBoundingClientRect().bottom : 0) + 8)))
      setList(l => [...l, { id, ...detail }])
      later(() => {
        active.current--
        setList(l => l.map(t => (t.id === id ? { ...t, leaving: true } : t)))
        if (queue.current.length) show(queue.current.shift())
      }, LIFE)
      later(() => setList(l => l.filter(t => t.id !== id)), LIFE + 420)
    }
    const on = (e) => {
      if (active.current >= MAX) queue.current.push(e.detail)
      else show(e.detail)
    }
    window.addEventListener('mcop:toast', on)
    return () => { window.removeEventListener('mcop:toast', on); timers.forEach(clearTimeout); active.current = 0 }
  }, [])

  return (
    <div className="mc-toasts" role="status" aria-live="polite" style={{ top }}>
      {list.map(t => (
        <div key={t.id} className={`mc-toast kind-${t.kind}${t.leaving ? ' leaving' : ''}${t.text ? '' : ' single'}`}>
          <img className="mc-toast-icon" src={t.icon} alt="" />
          <div className="mc-toast-body">
            <div className="mc-toast-title">{t.title}</div>
            {t.text && <div className="mc-toast-text">{t.text}</div>}
          </div>
        </div>
      ))}
    </div>
  )
}
