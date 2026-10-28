import { useEffect, useRef, useState } from 'react'

// a typical MCOP hour, replayed in the game's own chat box: the match, two
// strangers joining, the quest landing, an advancement, the half-hour warning,
// the save. it plays while it's on screen and loops; with reduced motion the
// whole log just sits there.
const SCRIPT = [
  { k: 'sys', text: 'Matched! Steve ⇄ Alex · 87% compatible' },
  { k: 'join', who: 'Steve' },
  { k: 'join', who: 'Alex' },
  { k: 'quest', text: 'Light a nether portal together before the hour is up' },
  { k: 'sys', text: 'Starting loadouts delivered: Iron Kit for both' },
  { k: 'chat', who: 'Alex', text: 'hiii. builder or explorer?' },
  { k: 'chat', who: 'Steve', text: 'explorer. you build, i find the obsidian?' },
  { k: 'chat', who: 'Alex', text: 'deal. meet at the river' },
  { k: 'adv', who: 'Steve', text: 'Diamonds!', tier: 'goal' },
  { k: 'chat', who: 'Alex', text: 'WAIT where' },
  { k: 'chat', who: 'Steve', text: 'y -58, follow the torches' },
  { k: 'sys', text: '30 minutes left. Need longer? Add +30 on your session page' },
  { k: 'adv', who: 'Alex', text: 'We Need to Go Deeper', tier: 'goal' },
  { k: 'chat', who: 'Alex', text: 'portal is LIT' },
  { k: 'sys', text: 'Session over. World saved for 30 days. Swap Discords?' },
  { k: 'chat', who: 'Steve', text: 'gg. same time tomorrow?' },
]
const SHOWN = 10        // the game shows the last ten lines
const PACE = 1700       // ms between lines
const reduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

function Line({ l }) {
  if (l.k === 'chat') return <><span className="cr-name">&lt;{l.who}&gt;</span> {l.text}</>
  if (l.k === 'join') return <span className="cr-yellow">{l.who} joined the game</span>
  if (l.k === 'quest') return <><span className="cr-aqua">[Quest]</span> {l.text}</>
  if (l.k === 'adv') return <>{l.who} has made the advancement <span className={l.tier === 'challenge' ? 'cr-purple' : 'cr-green'}>[{l.text}]</span></>
  return <><span className="cr-gold">[MCOP]</span> {l.text}</>
}

export default function ChatReplay() {
  const [n, setN] = useState(() => (reduced() ? SCRIPT.length : 0))
  const box = useRef(null)
  useEffect(() => {
    if (reduced()) return
    let visible = false
    let timer = 0
    const step = () => {
      timer = setTimeout(() => {
        if (!visible) { timer = 0; return }
        // after the last line, a beat of quiet, then the next hour starts
        setN(k => (k >= SCRIPT.length + 2 ? 0 : k + 1))
        step()
      }, PACE)
    }
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible && !timer) step()
    }, { threshold: 0.35 })
    io.observe(box.current)
    return () => { io.disconnect(); clearTimeout(timer) }
  }, [])
  const lines = SCRIPT.slice(0, Math.min(n, SCRIPT.length))
  return (
    <div className="chat-replay" ref={box} aria-label="What an MCOP session looks like in game chat">
      <div className="cr-log">
        {lines.slice(-SHOWN).map((l, i) => (
          <div key={lines.length - SHOWN + i} className="cr-line"><Line l={l} /></div>
        ))}
      </div>
      <div className="cr-input"><span className="cr-caret">_</span></div>
    </div>
  )
}
