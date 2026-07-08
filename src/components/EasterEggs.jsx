import { useEffect, useRef, useState } from 'react'
import { explosion, burst, fireworks } from '../lib/particles.js'
import { unlock, unlockedCount } from '../lib/achievements.js'
import { loadSession } from '../lib/storage.js'

const reduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// third-person death causes — prefixed with the player's name to read exactly
// like a real Minecraft death message ("<name> was slain by Herobrine").
const DEATHS = [
  'fell out of the world',
  'was slain by Herobrine',
  'tried to swim in lava',
  'forgot to place a torch',
  'was squished too much',
  'didn\'t want to live in the same world as a creeper',
  'starved, distracted by matchmaking',
  'was killed',
]
const playerName = () => {
  const s = loadSession()
  return s.mcUsername || s.displayName || 'Player'
}
const SEEDS = ['133742069', '80087355', '1337', '2147483647', '8675309', '404 Biome Not Found', 'Friendship Plains', '133742069', '133742069']

// everything the command bar understands — the tab-complete list
const CMDS = [
  '/time set day', '/time set night', '/gamemode creative', '/gamemode survival',
  '/give diamond', '/summon tnt', '/summon creeper', '/kill', '/seed', '/nether', '/help',
]

let uid = 0
const nid = () => ++uid

export default function EasterEggs() {
  const [cmd, setCmd] = useState(null)          // command bar string or null
  const [chat, setChat] = useState([])          // {id, text, cls, state: ''|'fading'|'stale'}
  const [hoverChat, setHoverChat] = useState(false)
  const [dead, setDead] = useState(false)
  const [deathMsg, setDeathMsg] = useState('')
  const [herobrine, setHerobrine] = useState(false)
  const [nether, setNether] = useState(false)
  const [creative, setCreative] = useState(false)
  const [phantom, setPhantom] = useState(false)
  const [cow, setCow] = useState(false)
  const [flare, setFlare] = useState(false)
  const cmdInput = useRef(null)
  const bufRef = useRef('')
  const idleRef = useRef(null)
  const histRef = useRef([])   // submitted commands, newest first
  const histPos = useRef(-1)   // ↑/↓ cursor into histRef

  // minecraft chat lifecycle: lines fade after 6s but STAY in the history
  // (capped at 20) — hovering the chat corner or opening the / bar re-reveals
  // them, like holding T in-game.
  const say = (text, cls = '') => {
    const id = nid()
    setChat(c => [...c.slice(-19), { id, text, cls, state: '' }])
    setTimeout(() => setChat(c => c.map(l => (l.id === id ? { ...l, state: 'fading' } : l))), 6000)
    setTimeout(() => setChat(c => c.map(l => (l.id === id ? { ...l, state: 'stale' } : l))), 7000)
  }

  // ── falling diamonds ────────────────────────────────────────────
  const diamondRain = () => {
    if (reduced()) return
    for (let i = 0; i < 26; i++) {
      const d = document.createElement('div')
      d.className = 'egg-diamond'
      d.textContent = '◆'
      d.style.left = Math.random() * 100 + 'vw'
      d.style.setProperty('--dx', (Math.random() * 60 - 30) + 'px')
      d.style.setProperty('--dur', (1.6 + Math.random() * 1.4) + 's')
      d.style.animationDelay = Math.random() * 0.6 + 's'
      d.style.fontSize = (14 + Math.random() * 16) + 'px'
      document.body.appendChild(d)
      setTimeout(() => d.remove(), 3600)
    }
  }

  // ── the moon-cow / sun-flare (click the sky top-right) ──────────
  const skyPoke = () => {
    const day = document.documentElement.dataset.theme === 'day'
    if (day) { setFlare(true); setTimeout(() => setFlare(false), 900) }
    else { setCow(true); setTimeout(() => setCow(false), 2600) }
  }

  // ── the /command handler ────────────────────────────────────────
  const runCommand = (raw) => {
    const c = raw.trim().replace(/^\/+/, '').toLowerCase()
    if (!c) return
    unlock('operator')
    const arg = c.split(/\s+/)
    if (c.startsWith('time set day') || c === 'day') { setTheme('day'); say('Set the time to day') }
    else if (c.startsWith('time set night') || c === 'night') { setTheme('night'); say('Set the time to night') }
    else if (c.startsWith('gamemode creative')) { setCreative(true); say('Your game mode is now Creative — fly with your mouse') }
    else if (c.startsWith('gamemode')) { setCreative(false); say('Your game mode is now Survival') }
    else if (c.startsWith('give') && /diamond/.test(c)) { diamondRain(); unlock('diamonds'); say('Gave 64 Diamond to you', 'good') }
    else if (c.startsWith('summon') && /tnt/.test(c)) { tnt() }
    else if (c.startsWith('summon') && /creeper/.test(c)) { creeperBoom() }
    else if (c === 'kill' || c.startsWith('kill')) { die() }
    else if (c === 'seed') { say('Seed: [' + SEEDS[Math.floor(Math.random() * SEEDS.length)] + ']') }
    else if (c.startsWith('nether')) { doNether() }
    else if (c === 'overworld' || c === 'home') {
      if (document.documentElement.dataset.dimension === 'nether') doNether()
      else say('You are already in the Overworld')
    }
    else if (c === 'help' || c === '?') {
      say('/time set day|night · /gamemode creative · /give diamond', 'muted')
      say('/summon tnt|creeper · /kill · /seed · /nether', 'muted')
    }
    else say('Unknown command. Try /help', 'err')
  }

  const setTheme = (t) => window.dispatchEvent(new CustomEvent('mcop:set-theme', { detail: t }))

  const tnt = () => {
    say('Summoned Primed TNT')
    document.body.classList.add('egg-shake')
    setTimeout(() => {
      explosion(window.innerWidth / 2, window.innerHeight / 2)
      document.body.classList.add('egg-flash')
      setTimeout(() => document.body.classList.remove('egg-flash'), 180)
    }, 700)
    setTimeout(() => document.body.classList.remove('egg-shake'), 900)
  }
  const creeperBoom = () => { say('Sssss…'); tnt() }

  const die = () => {
    setDeathMsg(playerName() + ' ' + DEATHS[Math.floor(Math.random() * DEATHS.length)])
    setDead(true)
  }
  // while dead, hide the page chrome so only the world + death screen show —
  // like the paused game behind Minecraft's death screen, not a red-tinted webpage
  useEffect(() => {
    document.documentElement.classList.toggle('is-dead', dead)
    return () => document.documentElement.classList.remove('is-dead')
  }, [dead])
  const respawn = () => { setDead(false); unlock('back-from-void'); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  const doHerobrine = () => {
    if (herobrine) return
    setHerobrine(true)
    say('Herobrine joined the game', 'herobrine')
    setTimeout(() => say('Herobrine left the game', 'herobrine'), 2600)
    setTimeout(() => { setHerobrine(false); unlock('herobrine') }, 4200)
  }
  // /nether is a real dimension now: the world background swaps to the nether
  // cross-section (its own render, panned by the same glide as day/night) and
  // stays until you portal home. the old red overlay plays as the portal flash.
  const doNether = () => {
    const el = document.documentElement
    const leaving = el.dataset.dimension === 'nether'
    setNether(true)
    setTimeout(() => setNether(false), 1400)
    if (leaving) {
      delete el.dataset.dimension
      say('Returning to the Overworld…', 'nether')
    } else {
      el.dataset.dimension = 'nether'
      say('Entering the Nether…', 'nether')
      say('Type /nether again to come home', 'muted')
    }
  }

  // ── keyboard: word buffer + command bar opener ──────────────────
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target
      const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)

      // open the command bar with "/"
      if (e.key === '/' && !typing && cmd === null && !dead) {
        e.preventDefault()
        setCmd('/')
        setTimeout(() => cmdInput.current?.focus(), 20)
        return
      }
      if (typing) return

      // secret words
      if (/^[a-z]$/i.test(e.key)) {
        bufRef.current = (bufRef.current + e.key.toLowerCase()).slice(-12)
        const b = bufRef.current
        if (b.endsWith('herobrine')) { doHerobrine(); bufRef.current = '' }
        else if (b.endsWith('diamond')) { diamondRain(); unlock('diamonds'); bufRef.current = '' }
        else if (b.endsWith('nether')) { doNether(); bufRef.current = '' }
        else if (b.endsWith('tnt')) { tnt(); bufRef.current = '' }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [cmd, dead, herobrine])

  // ── right-click: place a torch ──────────────────────────────────
  useEffect(() => {
    let placed = 0
    const onCtx = (e) => {
      // leave the real context menu alone on text, media and controls — only the
      // decorative world/background areas grow a torch.
      if (window.getSelection && String(window.getSelection())) return
      if (e.target.closest('input, textarea, a, button, img, code, p, h1, h2, h3, li, summary, .ach-overlay, .egg-cmd, [contenteditable]')) return
      e.preventDefault()
      const t = document.createElement('div')
      t.className = 'egg-torch'
      t.textContent = '🔥'
      t.style.left = e.clientX + 'px'
      t.style.top = e.clientY + 'px'
      document.body.appendChild(t)
      setTimeout(() => t.remove(), 4200)
      burst(e.clientX, e.clientY)
      if (++placed >= 2) unlock('torchbearer')
    }
    document.addEventListener('contextmenu', onCtx)
    return () => document.removeEventListener('contextmenu', onCtx)
  }, [])

  // ── idle → a phantom drifts past (Minecraft insomnia) ───────────
  useEffect(() => {
    if (reduced()) return
    const reset = () => {
      clearTimeout(idleRef.current)
      setPhantom(false)
      idleRef.current = setTimeout(() => {
        setPhantom(true)
        setTimeout(() => setPhantom(false), 7000)
      }, 75000)
    }
    const evs = ['pointerdown', 'keydown', 'scroll', 'mousemove']
    evs.forEach(ev => window.addEventListener(ev, reset, { passive: true }))
    reset()
    return () => { clearTimeout(idleRef.current); evs.forEach(ev => window.removeEventListener(ev, reset)) }
  }, [])

  // ── click the sky (top-right) → moon-cow / sun-flare ────────────
  useEffect(() => {
    const onClick = (e) => {
      if (e.target.closest('button, a, input, .lever, .ach-overlay')) return
      // top-right sky region where the sun/moon live
      if (e.clientX > window.innerWidth * 0.72 && e.clientY < window.innerHeight * 0.42 && e.clientY > 70) {
        skyPoke()
      }
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  // ── creative flight: the world tilts toward the cursor ──────────
  useEffect(() => {
    const bg = document.querySelector('.world-bg')
    if (!creative) { if (bg) bg.style.transform = ''; return }
    const onMove = (e) => {
      if (!bg) return
      const dx = (e.clientX / window.innerWidth - 0.5)
      const dy = (e.clientY / window.innerHeight - 0.5)
      bg.style.transform = `translate(${dx * -26}px, ${dy * -20}px) scale(1.04)`
    }
    window.addEventListener('mousemove', onMove)
    return () => { window.removeEventListener('mousemove', onMove); if (bg) bg.style.transform = '' }
  }, [creative])

  const submitCmd = (e) => {
    e.preventDefault()
    const v = cmd
    setCmd(null)
    histPos.current = -1
    if (v && v.trim() && v.trim() !== '/') histRef.current = [v, ...histRef.current.slice(0, 19)]
    runCommand(v)
  }

  // tab-complete suggestions for the current prefix ('/' alone lists everything)
  const suggestions = cmd === null ? [] : CMDS.filter(s => s.startsWith(cmd.toLowerCase()) && s !== cmd.toLowerCase()).slice(0, 8)

  const cmdKeys = (e) => {
    if (e.key === 'Escape') { setCmd(null); histPos.current = -1 }
    else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const h = histRef.current
      if (!h.length) return
      histPos.current = Math.min(histPos.current + 1, h.length - 1)
      setCmd(h[histPos.current])
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (histPos.current <= 0) { histPos.current = -1; setCmd('/') }
      else { histPos.current -= 1; setCmd(histRef.current[histPos.current]) }
    } else if (e.key === 'Tab') {
      e.preventDefault()
      if (suggestions.length) setCmd(suggestions[0])
    }
  }

  const chatOpen = hoverChat || cmd !== null

  return (
    <>
      {/* minecraft chat log, bottom-left — hover it (or open /) for history */}
      {chat.length > 0 && (
        <div
          className={'egg-chat' + (chatOpen ? ' open' : '')}
          aria-live="polite"
          onMouseEnter={() => setHoverChat(true)}
          onMouseLeave={() => setHoverChat(false)}
        >
          {chat.map(l => (
            <div key={l.id} className={'egg-chat-line ' + l.cls + (l.state ? ' ' + l.state : '')}>{l.text}</div>
          ))}
        </div>
      )}

      {/* the command bar + tab-complete column */}
      {cmd !== null && (
        <form className="egg-cmd" onSubmit={submitCmd}>
          {suggestions.length > 0 && (
            <div className="egg-cmd-suggest" aria-hidden="true">
              {suggestions.map(s => (
                <button
                  type="button"
                  key={s}
                  className="egg-cmd-suggest-item"
                  onMouseDown={ev => { ev.preventDefault(); setCmd(s); cmdInput.current?.focus() }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          {suggestions.length > 0 && <div className="egg-cmd-hint">Tab to complete · ↑ history</div>}
          <input
            ref={cmdInput}
            className="egg-cmd-input"
            value={cmd}
            onChange={e => { setCmd(e.target.value); histPos.current = -1 }}
            onKeyDown={cmdKeys}
            onBlur={() => setCmd(null)}
            spellCheck={false}
            autoComplete="off"
          />
        </form>
      )}

      {/* creative-mode HUD */}
      {creative && <div className="egg-creative">✈ Creative Mode · move your mouse</div>}

      {/* nether tint */}
      {nether && <div className="egg-nether" aria-hidden="true" />}

      {/* herobrine flicker */}
      {herobrine && <div className="egg-herobrine" aria-hidden="true" />}

      {/* sun flare */}
      {flare && <div className="egg-flare-overlay" aria-hidden="true" />}

      {/* the cow jumps over the moon */}
      {cow && <div className="egg-cow" aria-hidden="true">🐄</div>}

      {/* idle phantom */}
      {phantom && <div className="egg-phantom" aria-hidden="true">🦇</div>}

      {/* death screen — the real Minecraft layout */}
      {dead && (
        <div className="egg-death" role="dialog" aria-label="You died">
          <h2 className="egg-death-title">You Died!</h2>
          <p className="egg-death-msg">{deathMsg}</p>
          <p className="egg-death-score">Score: <b>{unlockedCount()}</b></p>
          <div className="egg-death-btns">
            <button className="egg-death-btn" onClick={respawn}>Respawn</button>
            <button className="egg-death-btn" onClick={() => { setDead(false); window.location.href = '/' }}>Title Screen</button>
          </div>
        </div>
      )}
    </>
  )
}
