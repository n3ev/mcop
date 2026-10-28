import { useEffect, useState } from 'react'
import { ACHIEVEMENTS, DEF, TABS, isUnlocked, unlockedCount, baseTotal, tabCount, resetAchievements } from '../lib/achievements.js'

const GUI = '/assets/textures/gui/'
const COL = 150   // horizontal spacing between tree columns
const ROW = 100   // vertical spacing between rows
const NODE = 64   // node box size (a 26px advancement frame at 2.5x)
const PADX = 34
const PADY = 30

const cx = (a) => PADX + a.col * COL + NODE / 2
const cy = (a) => PADY + a.row * ROW + NODE / 2

// an L-shaped connector from a parent node to a child, advancement style
function connectorPoints(parent, child) {
  const px = cx(parent) + NODE / 2, py = cy(parent)
  const cxx = cx(child) - NODE / 2, cyy = cy(child)
  const midX = cxx - 30
  return `${px},${py} ${midX},${py} ${midX},${cyy} ${cxx},${cyy}`
}

const frameOf = (a, earned) => `url(${GUI}advancements-${a.tier}_frame_${earned ? 'obtained' : 'unobtained'}.png)`

export default function AchievementsOverlay() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('site')
  const [active, setActive] = useState(null)
  const [, force] = useState(0)

  useEffect(() => {
    const openIt = (e) => { setOpen(true); setActive(null); if (e.detail && DEF[e.detail]) setTab(DEF[e.detail].tab) }
    const changed = () => force(n => n + 1)
    window.addEventListener('mcop:open-achievements', openIt)
    window.addEventListener('mcop:achievements-changed', changed)
    return () => {
      window.removeEventListener('mcop:open-achievements', openIt)
      window.removeEventListener('mcop:achievements-changed', changed)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
      // ← / → flip through the tabs, like Q/E would
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const i = TABS.findIndex(t => t.id === tab) + (e.key === 'ArrowRight' ? 1 : -1)
        setTab(TABS[(i + TABS.length) % TABS.length].id); setActive(null)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, tab])

  if (!open) return null

  const list = ACHIEVEMENTS.filter(a => a.tab === tab)
  const w = PADX * 2 + Math.max(...list.map(a => a.col)) * COL + NODE
  const h = PADY * 2 + Math.max(...list.map(a => a.row)) * ROW + NODE + 26
  const activeDef = active && DEF[active]
  const activeEarned = active && isUnlocked(active)
  const hidden = (a) => (a.rare || a.secret) && !isUnlocked(a.id)
  const bg = TABS.find(t => t.id === tab).bg

  return (
    <div className="ach-overlay" onClick={() => setOpen(false)}>
      <div className="ach-panel" role="dialog" aria-label="Advancements" onClick={e => e.stopPropagation()}>
        <div className="ach-head">
          <h2 className="ach-title">Advancements</h2>
          <span className="ach-progress">{unlockedCount()} / {baseTotal()} earned</span>
          <button className="ach-close" onClick={() => setOpen(false)} aria-label="Close">✕</button>
        </div>

        <div className="ach-tabs" role="tablist">
          {TABS.map(t => {
            const c = tabCount(t.id)
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                className={'ach-tab' + (tab === t.id ? ' on' : '') + (c.done === c.total ? ' done' : '')}
                onClick={() => { setTab(t.id); setActive(null) }}
              >
                <img src={t.icon} alt="" />
                <span>{t.title}</span>
                <span className="ach-tab-count">{c.done}/{c.total}</span>
              </button>
            )
          })}
        </div>

        <div className="ach-scroll" style={{ '--adv-bg': `url(${GUI}adv-bg-${bg}.png)` }}>
          <div className="ach-tree" style={{ width: w, height: h }}>
            <svg className="ach-lines" width={w} height={h} aria-hidden="true">
              {list.filter(a => a.parent).map(a => {
                const lit = isUnlocked(a.id) && isUnlocked(a.parent)
                return (
                  <g key={'l' + a.id} className={'ach-line' + (lit ? ' lit' : '') + (a.rare ? ' rare' : '')}>
                    <polyline className="ach-line-edge" points={connectorPoints(DEF[a.parent], a)} />
                    <polyline className="ach-line-core" points={connectorPoints(DEF[a.parent], a)} />
                  </g>
                )
              })}
            </svg>

            {list.map(a => {
              const earned = isUnlocked(a.id)
              return (
                <button
                  key={a.id}
                  type="button"
                  className={'ach-node tier-' + a.tier + (earned ? ' earned' : ' locked') + (a.rare ? ' rare' : '') + (active === a.id ? ' active' : '')}
                  style={{ left: PADX + a.col * COL, top: PADY + a.row * ROW }}
                  onMouseEnter={() => setActive(a.id)}
                  onFocus={() => setActive(a.id)}
                  onClick={() => setActive(active === a.id ? null : a.id)}
                >
                  <span className="ach-frame" style={{ backgroundImage: frameOf(a, earned) }}>
                    {hidden(a)
                      ? <span className="ach-q">?</span>
                      : <img className="ach-icon" src={a.icon} alt="" />}
                  </span>
                  <span className="ach-name">{hidden(a) ? '???' : a.title}</span>
                </button>
              )
            })}
          </div>
        </div>

        {activeDef ? (
          <div className={'ach-tip' + (activeDef.rare ? ' rare' : '') + ' tier-' + activeDef.tier}>
            <div className="ach-tip-title">
              {hidden(activeDef) ? '???' : activeDef.title}
              <span className={'ach-tip-tag' + (activeEarned ? ' got' : '')}>{activeEarned ? '✓ earned' : 'locked'}</span>
              {activeDef.extra && <span className="ach-tip-tag">with a buddy</span>}
            </div>
            <div className="ach-tip-hint">{activeDef.hint}</div>
          </div>
        ) : (
          <div className="ach-tip ach-tip-empty">
            <div className="ach-tip-hint">Hover or tap an advancement for a hint. No spoilers on how to earn them.</div>
          </div>
        )}

        <div className="ach-foot">
          <span className="muted small">← → switch tabs · Esc closes</span>
          <button className="ach-reset" onClick={() => { if (window.confirm('Reset every advancement?')) { resetAchievements(); setActive(null) } }}>Reset progress</button>
        </div>
      </div>
    </div>
  )
}

// the trigger — a hanging-sign style button that opens the overlay
export function AchievementsButton({ className = 'header-link' }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new Event('mcop:open-achievements'))}
    >
      Awards
    </button>
  )
}
