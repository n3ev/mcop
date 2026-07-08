import { useEffect, useState } from 'react'
import { ACHIEVEMENTS, DEF, RARE_ID, isUnlocked, unlockedCount, baseTotal, resetAchievements } from '../lib/achievements.js'

const TEX = '/assets/textures/blocks/'
const COL = 158   // horizontal spacing between tree columns
const ROW = 104   // vertical spacing between rows
const NODE = 66   // node box size
const PADX = 34
const PADY = 34

const cx = (a) => PADX + a.col * COL + NODE / 2
const cy = (a) => PADY + a.row * ROW + NODE / 2
const treeW = () => PADX * 2 + Math.max(...ACHIEVEMENTS.map(a => a.col)) * COL + NODE
const treeH = () => PADY * 2 + Math.max(...ACHIEVEMENTS.map(a => a.row)) * ROW + NODE

// an L-shaped connector from a parent node to a child, MC-advancement style
function connectorPoints(parent, child) {
  const px = cx(parent) + NODE / 2, py = cy(parent)
  const cxx = cx(child) - NODE / 2, cyy = cy(child)
  const midX = cxx - 34
  return `${px},${py} ${midX},${py} ${midX},${cyy} ${cxx},${cyy}`
}

export default function AchievementsOverlay() {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(null)
  const [, force] = useState(0)

  useEffect(() => {
    const openIt = () => { setOpen(true); setActive(null) }
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
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  if (!open) return null

  const done = unlockedCount()
  const total = baseTotal()
  const activeDef = active && DEF[active]
  const activeEarned = active && isUnlocked(active)

  return (
    <div className="ach-overlay" onClick={() => setOpen(false)}>
      <div className="ach-panel" role="dialog" aria-label="Advancements" onClick={e => e.stopPropagation()}>
        <div className="ach-head">
          <h2 className="ach-title">Advancements</h2>
          <span className="ach-progress">{done} / {total} earned</span>
          <button className="ach-close" onClick={() => setOpen(false)} aria-label="Close">✕</button>
        </div>

        <div className="ach-scroll">
          <div className="ach-tree" style={{ width: treeW(), height: treeH() }}>
            <svg className="ach-lines" width={treeW()} height={treeH()} aria-hidden="true">
              {ACHIEVEMENTS.filter(a => a.parent).map(a => {
                const lit = isUnlocked(a.id) && isUnlocked(a.parent)
                return (
                  <polyline
                    key={'l' + a.id}
                    points={connectorPoints(DEF[a.parent], a)}
                    className={'ach-line' + (lit ? ' lit' : '') + (a.rare ? ' rare' : '')}
                  />
                )
              })}
            </svg>

            {ACHIEVEMENTS.map(a => {
              const earned = isUnlocked(a.id)
              const rareLocked = (a.rare || a.secret) && !earned
              return (
                <button
                  key={a.id}
                  type="button"
                  className={
                    'ach-node tier-' + a.tier +
                    (earned ? ' earned' : ' locked') +
                    (a.rare ? ' rare' : '') +
                    (active === a.id ? ' active' : '')
                  }
                  style={{ left: PADX + a.col * COL, top: PADY + a.row * ROW }}
                  onMouseEnter={() => setActive(a.id)}
                  onFocus={() => setActive(a.id)}
                  onClick={() => setActive(active === a.id ? null : a.id)}
                >
                  <span className="ach-frame">
                    {rareLocked
                      ? <span className="ach-q">?</span>
                      : <img className="ach-icon" src={TEX + a.icon} alt="" />}
                  </span>
                  <span className="ach-name">{rareLocked ? '???' : a.title}</span>
                </button>
              )
            })}
          </div>
        </div>

        {activeDef && (
          <div className={'ach-tip' + (activeDef.rare ? ' rare' : '')}>
            <div className="ach-tip-title">
              {(activeDef.rare || activeDef.secret) && !activeEarned ? '???' : activeDef.title}
              <span className={'ach-tip-tag' + (activeEarned ? ' got' : '')}>{activeEarned ? '✓ earned' : 'locked'}</span>
            </div>
            <div className="ach-tip-hint">{activeDef.hint}</div>
          </div>
        )}

        <div className="ach-foot">
          <span className="muted small">Hover an advancement for a hint. No spoilers on how to earn them.</span>
          <button className="ach-reset" onClick={() => { resetAchievements(); setActive(null) }}>Reset progress</button>
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
