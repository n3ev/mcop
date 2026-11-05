import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { API_URL } from '../lib/api.js'
import { getToken } from '../lib/auth.js'
import { money } from '../lib/billing.js'
import { GAMES } from '../data/games.js'

// the scoreboard: is MCOP working as a business? counts only, from the
// backend's /admin/stats (ADMIN_EMAILS). every goal has a number here.
const RANGES = [7, 30, 90]
const SERIES = [
  { key: 'sessionsRandom', label: 'Random matches', color: 'var(--viz-1)' },
  { key: 'sessionsFriends', label: 'Friend invites', color: 'var(--viz-2)' },
]
const fmt = (n) => new Intl.NumberFormat(undefined, { notation: n >= 10000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(n)
const pct = (a, b) => (b > 0 ? `${Math.round((a / b) * 100)}%` : '–')
const dayLabel = (key) => new Date(key + 'T12:00:00Z').toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
const GAME_NAME = Object.fromEntries(GAMES.map(g => [g.id, g.name]))

function Tile({ label, value, note, hero }) {
  return (
    <div className={'stat-tile' + (hero ? ' hero' : '')}>
      <span className="stat-tile-label">{label}</span>
      <span className="stat-tile-value">{value}</span>
      {note && <span className="stat-tile-note">{note}</span>}
    </div>
  )
}

// one funnel: a bar per step, sized against the biggest step (so a bar can
// never run past its track), value at the tip, and the share that made it
// from the step before
function Funnel({ title, steps }) {
  const top = Math.max(1, ...steps.map(s => s.n || 0))
  return (
    <div className="funnel">
      <h3>{title}</h3>
      <ol className="funnel-steps">
        {steps.map((s, i) => (
          <li key={s.label} className="funnel-step">
            <span className="funnel-label">{s.label}</span>
            <span className="funnel-track">
              {/* scaled inside the track minus room for the label, so the value always sits at the tip */}
              <span className="funnel-bar" style={{ width: `calc((100% - 7.5em) * ${s.n > 0 ? Math.max(0.015, s.n / top) : 0})` }} />
              <span className="funnel-value">
                {fmt(s.n)}
                {i > 0 && <span className="funnel-conv"> · {pct(s.n, steps[i - 1].n)}</span>}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}

// sessions a day, random and friends stacked: columns from one baseline, a
// 2px gap between the two parts, a rounded top, a tooltip per day
function DailySessions({ days, daily }) {
  const [hover, setHover] = useState(null)
  const totals = days.map((_, i) => SERIES.reduce((a, s) => a + (daily[s.key][i] || 0), 0))
  const max = Math.max(1, ...totals)
  const tickStep = max <= 4 ? 1 : max <= 10 ? 2 : Math.ceil(max / 4 / 5) * 5
  const ticks = []
  for (let t = 0; t <= max; t += tickStep) ticks.push(t)
  if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + tickStep)
  const yMax = ticks[ticks.length - 1]
  const W = 720, H = 220, left = 34, bottom = 26, top = 8
  const step = (W - left) / days.length
  const colW = Math.min(24, step * 0.62)
  const y = (v) => top + (H - top - bottom) * (1 - v / yMax)
  const labelEvery = Math.ceil(days.length / 6)

  return (
    <div className="viz">
      <div className="viz-legend" aria-hidden="true">
        {SERIES.map(s => <span key={s.key}><i style={{ background: s.color }} />{s.label}</span>)}
      </div>
      <div className="viz-plot">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Sessions started each day, random matches and friend invites">
          {ticks.map(t => (
            <g key={t}>
              <line x1={left} x2={W} y1={y(t)} y2={y(t)} className="viz-grid" />
              <text x={left - 8} y={y(t) + 4} className="viz-tick" textAnchor="end">{fmt(t)}</text>
            </g>
          ))}
          {days.map((d, i) => {
            const cx = left + step * i + step / 2
            const parts = SERIES.map(s => ({ ...s, v: daily[s.key][i] || 0 })).filter(p => p.v > 0)
            let base = 0
            return (
              <g key={d} tabIndex={0} className={'viz-col' + (hover === i ? ' on' : '')}
                onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)}
                onFocus={() => setHover(i)} onBlur={() => setHover(null)}
                aria-label={`${dayLabel(d)}: ${SERIES.map(s => `${daily[s.key][i] || 0} ${s.label.toLowerCase()}`).join(', ')}`}>
                <rect x={left + step * i} y={top} width={step} height={H - top - bottom} className="viz-hit" />
                {parts.map((p, j) => {
                  const y0 = y(base), y1 = y(base + p.v)
                  base += p.v
                  const h = Math.max(0, y0 - y1 - (j > 0 ? 2 : 0)) // the 2px surface gap
                  const yTop = y1
                  const last = j === parts.length - 1
                  const r = last ? Math.min(4, h) : 0
                  const x0 = cx - colW / 2
                  const path = `M${x0},${yTop + h} V${yTop + r} Q${x0},${yTop} ${x0 + r},${yTop} H${x0 + colW - r} Q${x0 + colW},${yTop} ${x0 + colW},${yTop + r} V${yTop + h} Z`
                  return <path key={p.key} d={path} fill={p.color} />
                })}
                {i % labelEvery === 0 && <text x={cx} y={H - 6} className="viz-tick" textAnchor="middle">{dayLabel(d)}</text>}
              </g>
            )
          })}
          <line x1={left} x2={W} y1={y(0)} y2={y(0)} className="viz-axis" />
        </svg>
        {hover !== null && (
          <div className="viz-tip" style={{ left: `${((left + step * hover + step / 2) / W) * 100}%` }}>
            <span className="viz-tip-day">{dayLabel(days[hover])}</span>
            {SERIES.map(s => (
              <span key={s.key} className="viz-tip-row"><i style={{ background: s.color }} /><strong>{daily[s.key][hover] || 0}</strong> {s.label.toLowerCase()}</span>
            ))}
          </div>
        )}
      </div>
      <details className="viz-table">
        <summary>Show as a table</summary>
        <div className="table-scroll"><table>
          <thead><tr><th>Day</th>{SERIES.map(s => <th key={s.key}>{s.label}</th>)}<th>Queue joins</th><th>Invites made</th><th>Sign-ups</th></tr></thead>
          <tbody>
            {days.map((d, i) => (
              <tr key={d}><th>{dayLabel(d)}</th>{SERIES.map(s => <td key={s.key}>{daily[s.key][i] || 0}</td>)}<td>{daily.queueJoins[i]}</td><td>{daily.invitesMade[i]}</td><td>{daily.signups[i]}</td></tr>
            ))}
          </tbody>
        </table></div>
      </details>
    </div>
  )
}

export default function Admin() {
  const nav = useNavigate()
  const { user, loading } = useAuth()
  const [days, setDays] = useState(30)
  const [data, setData] = useState(null)
  const [state, setState] = useState('loading') // loading | ok | denied | error

  useEffect(() => { if (!loading && !user) nav('/login?next=/admin') }, [loading, user])
  useEffect(() => {
    if (!user) return
    let on = true
    setState(s => (s === 'ok' ? 'ok' : 'loading'))
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    fetch(`${API_URL}/admin/stats?days=${days}&tz=${encodeURIComponent(tz)}`, { headers: { Authorization: 'Bearer ' + getToken() } })
      .then(async r => {
        if (!on) return
        if (r.status === 403) return setState('denied')
        if (!r.ok) return setState('error')
        setData(await r.json())
        setState('ok')
      })
      .catch(() => on && setState('error'))
    return () => { on = false }
  }, [user, days])

  const sources = useMemo(() => {
    if (!data) return []
    const cols = [['queue_join', 'Queue joins'], ['invite_made', 'Invites made'], ['night_rsvp', 'Match night RSVPs']]
    const keys = new Set([...Object.keys(data.accounts.bySource), ...Object.keys(data.money.membersBySource)])
    for (const [t] of cols) for (const k of Object.keys(data.sources[t] || {})) keys.add(k)
    return [...keys].map(k => ({
      source: k,
      cells: [...cols.map(([t]) => data.sources[t]?.[k] || 0), data.accounts.bySource[k] || 0, data.money.membersBySource[k] || 0],
    })).sort((a, b) => b.cells.reduce((x, y) => x + y, 0) - a.cells.reduce((x, y) => x + y, 0))
  }, [data])

  if (loading || !user) return null
  if (state === 'denied') return <section className="card center"><h2>Admins only</h2><p className="muted">This page is for MCOP's admins.</p></section>
  if (state === 'error' && !data) return <section className="card center"><h2>Couldn't load the numbers</h2><p className="muted">The backend didn't answer. Try again in a minute.</p></section>
  if (!data) return <section className="card center"><div className="xpbar" role="progressbar" aria-label="Loading the scoreboard"><div className="xpbar-fill" /></div></section>

  const m = data.money
  const sessions = data.daily.sessionsRandom.reduce((a, b) => a + b, 0) + data.daily.sessionsFriends.reduce((a, b) => a + b, 0)
  const n = data.nights
  const perHour = (v) => (v == null ? '–' : v >= 1 ? v.toFixed(1) : v.toFixed(2))
  const live = data.live

  return (
    <section className={'card admin-page' + (state === 'loading' ? ' refreshing' : '')}>
      <h2>Scoreboard</h2>
      <p className="muted small">Counts only, no one's identity. Times in your time zone ({data.tz}). Updated {new Date(data.generatedAt).toLocaleTimeString()}.</p>
      <p className="admin-live"><span className="match-night-dot" aria-hidden="true" />Right now: {live.sessions} playing · {live.queue} in the queue · {live.invitesOpen} invites open · {live.serversFree} of {live.serversTotal} servers free</p>

      <div className="admin-filters" role="radiogroup" aria-label="Period">
        {RANGES.map(r => (
          <button key={r} role="radio" aria-checked={days === r} className={'chip' + (days === r ? ' chip-active' : '')} onClick={() => setDays(r)}>Last {r} days</button>
        ))}
      </div>

      <div className="stat-row">
        <Tile hero label="Monthly revenue" value={m.mrr ? money(m.mrr) : '–'} note={m.mrr ? 'from members paying today, at Stripe prices' : 'payments are off'} />
        <Tile label="Paying members" value={fmt(m.payingMonthly + m.payingYearly)} note={`${m.payingMonthly} monthly · ${m.payingYearly} yearly`} />
        <Tile label="On a free week" value={fmt(m.freeWeekOnly)} note={`${m.freeWeeksEarned} free weeks earned in ${days} days`} />
        <Tile label="Sessions" value={fmt(sessions)} note={`in the last ${days} days`} />
        <Tile label="Accounts" value={fmt(data.accounts.total)} note={`${data.accounts.new} new in ${days} days`} />
      </div>

      <h3 className="admin-h">Sessions each day</h3>
      <DailySessions days={data.days} daily={data.daily} />

      <div className="admin-grid">
        <Funnel title="Random matching" steps={data.funnels.random} />
        <Funnel title="Friend invites" steps={data.funnels.friends} />
        <Funnel title="The Campfire" steps={[...data.funnels.money, { label: 'Stopped paying', n: m.ended }]} />
      </div>

      <div className="admin-grid">
        <div>
          <h3>Match nights</h3>
          <div className="stat-row compact">
            <Tile label="Sessions an hour, on nights" value={perHour(n.perHourOnNights)} note={`${n.sessionsOnNights} sessions over ${n.count} nights`} />
            <Tile label="Sessions an hour, other times" value={perHour(n.perHourOtherTimes)} note={`${n.sessionsOtherTimes} sessions`} />
            <Tile label={n.live ? 'Coming tonight' : 'Coming next time'} value={fmt((n.live || n.next)?.going || 0)} note={n.next ? `next: ${new Date(n.next.start).toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' })}` : 'no nights set'} />
          </div>
        </div>
        <div>
          <h3>Shared cards</h3>
          <div className="stat-row compact">
            <Tile label="Cards posted" value={fmt(data.cards.shared + data.cards.saved)} note={`${data.cards.shared} shared · ${data.cards.saved} saved`} />
            <Tile label="Queue joins from cards" value={fmt(data.cards.queueJoinsFromCards)} />
            <Tile label="Invites from cards" value={fmt(data.cards.invitesFromCards)} note={`${data.cards.signupsFromCards} sign-ups`} />
          </div>
        </div>
      </div>

      <div className="admin-grid">
        <div>
          <h3>Where people came from</h3>
          <div className="table-scroll"><table className="admin-table">
            <thead><tr><th>Source</th><th>Queue joins</th><th>Invites</th><th>RSVPs</th><th>Sign-ups</th><th>Members</th></tr></thead>
            <tbody>
              {sources.length === 0 && <tr><td colSpan={6} className="muted">Nothing yet.</td></tr>}
              {sources.map(r => <tr key={r.source}><th>{r.source}</th>{r.cells.map((c, i) => <td key={i}>{c}</td>)}</tr>)}
            </tbody>
          </table></div>
        </div>
        <div>
          <h3>Waitlists and game votes</h3>
          <table className="admin-table">
            <thead><tr><th>List</th><th>Emails</th></tr></thead>
            <tbody>
              {data.waitlists.length === 0 && <tr><td colSpan={2} className="muted">Nothing yet.</td></tr>}
              {data.waitlists.map(w => <tr key={w.kind}><th>{GAME_NAME[w.kind] || (w.kind === 'campfire' ? 'The Campfire (before launch)' : w.kind === 'bedrock' ? 'Bedrock' : w.kind)}</th><td>{w.n}</td></tr>)}
            </tbody>
          </table>
          <h3 className="admin-h">Who's queueing</h3>
          <table className="admin-table">
            <thead><tr><th>Age group</th><th>Queue joins</th></tr></thead>
            <tbody>
              {['13-17', '18+', 'unknown'].filter(k => data.age[k]).map(k => <tr key={k}><th>{k === 'unknown' ? 'not asked (old page)' : k}</th><td>{data.age[k]}</td></tr>)}
              {!Object.keys(data.age).length && <tr><td colSpan={2} className="muted">Nothing yet.</td></tr>}
            </tbody>
          </table>
          <p className="muted small">Worlds saved: {data.keep.saved} · downloaded: {data.keep.downloaded}</p>
        </div>
      </div>
    </section>
  )
}
