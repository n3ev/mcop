import { useEffect, useState } from 'react'
import { getSessionRecap } from '../lib/session.js'
import { shareMcop } from './ShareInvite.jsx'
import { modeName, MODES } from './HourPanel.jsx'
import Ico from './Ico.jsx'

const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n)
const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

// "Your hour": what the two of you did, from the game server's recap. it lands a
// few seconds after the hour ends, so this polls for a while; servers without
// the session plugin never have one, and then this shows nothing at all.
export default function HourRecap({ matchId, partnerMc, friends = false }) {
  const [recap, setRecap] = useState(null)

  useEffect(() => {
    if (!matchId) return
    let on = true, tries = 0, t
    const poll = async () => {
      const r = await getSessionRecap(matchId)
      if (!on || !r) return                 // gone or unreachable: nothing to show
      if (r.ready) { setRecap(r.recap); return }
      if (++tries > 80) return              // ~20 minutes (they ended early and wandered off)
      t = setTimeout(poll, tries < 20 ? 3000 : 15000)
    }
    poll()
    return () => { on = false; clearTimeout(t) }
  }, [matchId])

  if (!recap) return null

  const buddy = (partnerMc || '').toLowerCase()
  const isBuddy = (p) => p.name.toLowerCase() === buddy
  const players = [...(recap.players || [])].sort((a, b) => isBuddy(a) - isBuddy(b))   // you first
  const who = (name) => (name.toLowerCase() === buddy ? name : 'You')
  const lines = []
  if (recap.quest?.done?.length) lines.push({ icon: 'writable_book', text: `${recap.quest.done.length} quest${recap.quest.done.length === 1 ? '' : 's'} done: ${recap.quest.done.map(q => q.title).join(', ')}` })
  if (recap.lab) lines.push({ icon: 'redstone', text: `Redstone Lab: ${recap.lab.solved} of ${recap.lab.total} rooms solved${recap.lab.rooms?.length ? ` (last: ${recap.lab.rooms[recap.lab.rooms.length - 1].name})` : ''}` })
  for (const r of recap.build?.rounds || []) {
    const got = Object.entries(r.stars || {}).map(([n, s]) => `${who(n)} ${stars(s)}`).join(' · ')
    lines.push({ icon: 'block:planks', text: `Build Battle round ${r.round}: ${r.theme}${got ? ` · ${got}` : ''}` })
  }
  for (const r of recap.copycat?.rounds || []) {
    const acc = Object.entries(r.accuracy || {}).map(([n, a]) => `${who(n)} ${a < 0 ? 'n/a' : a + '%'}`).join(' · ')
    lines.push({ icon: 'spyglass', text: `Copycat round ${r.round}: ${acc}` })
  }
  if (recap.oneblock) lines.push({ icon: 'block:grass-side', text: `One Block: ${recap.oneblock.mined} blocks mined, reached ${recap.oneblock.phaseName || 'Plains'}` })
  // the plugin writes moments with names ("Steve found diamonds"); yours reads "You found diamonds"
  const mine = players.find(p => !isBuddy(p))?.name
  const moments = (recap.moments || [])
    .filter(m => !/^(Started|.* joined$|Time's up)/.test(m.text))
    .map(m => ({ ...m, text: mine && m.text.startsWith(mine + ' ') ? 'You' + m.text.slice(mine.length) : m.text }))
    .slice(0, 6)

  const brag = lines.length ? lines[0].text.replace(/^(\d+ quests? done):.*/, '$1') : `${modeName(recap.modes?.[0] || 'free')} for an hour`
  const share = () => shareMcop(friends
    ? `Just spent an hour in Minecraft with a friend on MCOP. ${brag}. Bring yours:`
    : `Just spent an hour in Minecraft with someone I'd never met, matched on MCOP. ${brag}. Find your own Minecraft buddy:`)

  return (
    <div className="post-card hour-recap">
      <h3>Your hour</h3>
      <div className="chip-row">
        {(recap.modes || []).map(id => {
          const m = MODES.find(x => x.id === id)
          return <span key={id} className="chip"><Ico name={m?.icon || 'compass_00'} />{modeName(id)}</span>
        })}
      </div>
      {lines.length > 0 && (
        <ul className="recap-lines">
          {lines.map((l, i) => <li key={i}><Ico name={l.icon} className="btn-ico" />{l.text}</li>)}
        </ul>
      )}
      {players.length > 0 && (
        <table className="recap-stats">
          <thead><tr><th /><th>Mined</th><th>Placed</th><th>Mobs</th><th>Walked</th></tr></thead>
          <tbody>
            {players.map(p => (
              <tr key={p.name}>
                <th>{who(p.name)}</th><td>{p.mined}</td><td>{p.placed}</td><td>{p.mobs}</td><td>{p.distance} m</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {moments.length > 0 && (
        <ol className="recap-moments">
          {moments.map((m, i) => <li key={i}><span className="recap-t">{mmss(m.t)}</span>{m.text}</li>)}
        </ol>
      )}
      <button className="btn small" onClick={share}><Ico name="writable_book" className="btn-ico" />Share your hour</button>
    </div>
  )
}
