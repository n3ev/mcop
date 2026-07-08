import { toast } from './toast.js'
import { playRare } from './sound.js'

// every unlockable, plus its place in the advancement tree and a cryptic HINT
// (never the literal trigger). the rare one auto-unlocks when all the rest are
// earned; it stays "???" and purple until then.
const KEY = 'mcop_achievements'
const TEX = '/assets/textures/blocks/'

export const RARE_ID = 'ender-of-the-line'

// col/row = position in the tree; parent = who it branches from; tier styles the
// frame (normal / goal / challenge, like Minecraft advancements).
export const ACHIEVEMENTS = [
  { id: 'first-steps',        title: 'First Steps',      hint: 'Every world starts with a single step in.',              icon: 'grass-side.png',  tier: 'normal',    col: 0, row: 2, parent: null },
  { id: 'cartographer',       title: 'Cartographer',     hint: 'See every corner of the world, top to bottom.',          icon: 'grass-top.png',   tier: 'normal',    col: 1, row: 0, parent: 'first-steps' },
  { id: 'broad-daylight',     title: 'Broad Daylight',   hint: 'Chase the dusk away.',                                   icon: 'sun.png',         tier: 'normal',    col: 1, row: 1, parent: 'first-steps' },
  { id: 'night-owl',          title: 'Night Owl',        hint: '…then welcome the dark back home.',                      icon: 'moon.png',        tier: 'normal',    col: 2, row: 1, parent: 'broad-daylight' },
  { id: 'rock-bottom',        title: 'Rock Bottom',      hint: 'There is nothing below the bottom of the world.',        icon: 'bedrock.png',     tier: 'normal',    col: 1, row: 2, parent: 'first-steps' },
  { id: 'cant-break-bedrock', title: 'Nice Try',         hint: 'Some blocks simply will not break, however you hit them.', icon: 'bedrock.png',   tier: 'normal',    col: 2, row: 2, parent: 'rock-bottom' },
  { id: 'going-gold',         title: 'Going Gold',       hint: 'Let a record spin.',                                     icon: 'ore-gold.png',    tier: 'goal',      col: 1, row: 3, parent: 'first-steps' },
  { id: 'diamonds',           title: 'DIAMONDS!',        hint: 'Say the magic word out loud, one letter at a time.',     icon: 'ore-diamond.png', tier: 'goal',      col: 2, row: 3, parent: 'going-gold' },
  { id: 'torchbearer',        title: 'Torchbearer',      hint: 'Bring your own light. The other button places it.',      icon: 'torch.png',       tier: 'normal',    col: 2, row: 0, parent: 'cartographer' },
  { id: 'konami',             title: "It's Gonna Blow",  hint: 'Up, up, and a very old secret.',                         icon: 'ore-redstone.png', tier: 'goal',     col: 1, row: 4, parent: 'first-steps' },
  { id: 'herobrine',          title: 'Removed the Wrong One', hint: 'Spell out the name that was never really gone.',    icon: 'herobrine.png',   tier: 'challenge', col: 2, row: 4, parent: 'konami', secret: true },
  { id: 'operator',           title: 'Operator',         hint: 'One key opens a bar where the rules do not apply.',       icon: 'command.png',     tier: 'goal',      col: 3, row: 4, parent: 'herobrine' },
  { id: 'back-from-void',     title: 'Back from the Void', hint: 'You have to go before you can come back.',              icon: 'deepslate.png',   tier: 'normal',    col: 4, row: 4, parent: 'operator' },
  { id: RARE_ID,              title: 'Ender of the Line', hint: 'When there is nothing left to earn, the void opens.',    icon: 'amethyst.png',    tier: 'challenge', col: 5, row: 3, parent: 'back-from-void', rare: true },
]

export const DEF = Object.fromEntries(ACHIEVEMENTS.map(a => [a.id, a]))
const BASE_IDS = ACHIEVEMENTS.filter(a => !a.rare).map(a => a.id)

// in-memory mirror of localStorage so isUnlocked() is O(1) (safe per-frame)
let mem = null
function set() {
  if (mem) return mem
  try { mem = new Set(JSON.parse(localStorage.getItem(KEY) || '[]')) } catch { mem = new Set() }
  return mem
}

export function isUnlocked(id) { return set().has(id) }
export function unlockedCount() { return BASE_IDS.filter(b => set().has(b)).length }
export function baseTotal() { return BASE_IDS.length }

export function unlock(id) {
  const def = DEF[id]
  if (!def) return
  const s = set()
  if (s.has(id)) return
  s.add(id)
  try { localStorage.setItem(KEY, JSON.stringify([...s])) } catch { /* private mode */ }

  if (def.rare) {
    playRare()
    toast('Every advancement earned. You are the end of the line.', 'Rare Advancement: ' + def.title, TEX + def.icon, true)
  } else {
    toast('Advancement made.', 'Advancement: ' + def.title, TEX + def.icon)
    // just earned a base one? if that was the last, the rare one opens up.
    if (BASE_IDS.every(b => s.has(b))) setTimeout(() => unlock(RARE_ID), 1500)
  }
  window.dispatchEvent(new Event('mcop:achievements-changed'))
}

// dev/testing helper — wipe progress so achievements can be re-earned
export function resetAchievements() {
  mem = new Set()
  localStorage.removeItem(KEY)
  localStorage.removeItem('mcop_cartographer')
  localStorage.removeItem('mcop_seen')
  window.dispatchEvent(new Event('mcop:achievements-changed'))
}
