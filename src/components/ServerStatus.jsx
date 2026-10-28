import { useEffect, useState } from 'react'
import { API_URL } from '../lib/api.js'

// the matchmaking server as it would look in the game's Multiplayer list:
// icon, name, a two-line message of the day, the player count and the ping
// bars — a real ping, timed on the /stats request. offline, it says what the
// game says: "Can't connect to server".
const GUI = '/assets/textures/gui/'

async function pingServer() {
  const t0 = performance.now()
  try {
    const res = await fetch(`${API_URL}/stats`, { cache: 'no-store' })
    if (!res.ok) throw new Error(res.status)
    const s = await res.json()
    return { state: 'online', ms: performance.now() - t0, ...s }
  } catch {
    return { state: 'offline' }
  }
}

export function useServerStatus(every = 15000) {
  const [s, setS] = useState({ state: 'pinging' })
  useEffect(() => {
    let on = true
    const run = () => pingServer().then(r => { if (on) setS(r) })
    run()
    const t = setInterval(run, every)
    return () => { on = false; clearInterval(t) }
  }, [every])
  return s
}

const bars = (ms) => (ms < 150 ? 5 : ms < 300 ? 4 : ms < 600 ? 3 : ms < 1000 ? 2 : 1)

export default function ServerStatus() {
  const s = useServerStatus()
  const online = s.state === 'online'
  let motd, count
  if (online) {
    count = `${s.online}/∞`
    motd = s.queue > 0
      ? `${s.queue} ${s.queue === 1 ? 'player is' : 'players are'} waiting for a buddy right now`
      : s.matchesToday > 0
        ? `${s.matchesToday} ${s.matchesToday === 1 ? 'pair' : 'pairs'} matched today. You're next.`
        : 'The queue is open. Be the first one in today.'
  } else if (s.state === 'offline') {
    count = ''
    motd = "Can't connect to server"
  } else {
    count = ''
    motd = 'Pinging...'
  }
  const ping = online ? `${GUI}srv-ping_${bars(s.ms)}.png` : s.state === 'offline' ? `${GUI}srv-unreachable.png` : null
  return (
    <div className={'srv-entry srv-' + s.state} role="status" aria-label={'Matchmaking server: ' + (online ? 'online' : s.state)}>
      <img className="srv-icon" src="/assets/logo/mcop-static.png" alt="" />
      <div className="srv-main">
        <div className="srv-top">
          <span className="srv-name">MCOP Matchmaking</span>
          <span className="srv-right">
            {count && <span className="srv-count">{count}</span>}
            {ping
              ? <img className="srv-ping" src={ping} alt="" title={online ? `${Math.round(s.ms)} ms` : 'unreachable'} />
              : <span className="srv-ping srv-pinging" />}
          </span>
        </div>
        <div className="srv-motd">{motd}</div>
        <div className="srv-motd srv-motd-2">
          {s.state === 'offline'
            ? 'Matchmaking is down for a bit. The site is still yours to explore.'
            : 'Paper 1.21.4 · Java Edition · hosted in Sydney, playable anywhere'}
        </div>
      </div>
    </div>
  )
}
