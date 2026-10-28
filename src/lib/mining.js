import { unlock } from './achievements.js'
import { toast } from './toast.js'

// the mining game: ores sit in the cave walls of every page
// (components/OreLayer.jsx), each kind where it would be in a real world, and
// each needing the right pickaxe. what you dig up goes in the hotbar
// (components/Hotbar.jsx) and stays in localStorage, so a pickaxe crafted
// today is still yours tomorrow.
const KEY = 'mcop_mine_v1'
export const ITEM = '/assets/textures/items/'
const BLOCK = '/assets/textures/blocks/'

// pickaxes, weakest first; each digs faster than the last
export const PICKS = ['stone', 'iron', 'diamond', 'netherite']
export const PICK = {
  stone:     { name: 'Stone Pickaxe',     icon: ITEM + 'stone_pickaxe.png',     speed: 1.25 },
  iron:      { name: 'Iron Pickaxe',      icon: ITEM + 'iron_pickaxe.png',      speed: 1 },
  diamond:   { name: 'Diamond Pickaxe',   icon: ITEM + 'diamond_pickaxe.png',   speed: 0.75 },
  netherite: { name: 'Netherite Pickaxe', icon: ITEM + 'netherite_pickaxe.png', speed: 0.6 },
}
// what the next one costs (the smelting happens off-screen)
export const RECIPES = {
  iron:      { raw_iron: 3 },
  diamond:   { diamond: 3 },
  netherite: { netherite_scrap: 4, raw_gold: 4 },
}

// tier = weakest pickaxe that gets a drop (index into PICKS), ms = time to
// break with an iron pickaxe, n/xp = [min, max] dropped
export const ORES = {
  coal:        { name: 'Coal Ore',          tier: 0, ms: 850,  drop: 'coal',            n: [1, 1], xp: [0, 2] },
  copper:      { name: 'Copper Ore',        tier: 0, ms: 950,  drop: 'raw_copper',      n: [2, 5], xp: [0, 0] },
  iron:        { name: 'Iron Ore',          tier: 0, ms: 1050, drop: 'raw_iron',        n: [1, 1], xp: [0, 0] },
  lapis:       { name: 'Lapis Lazuli Ore',  tier: 0, ms: 1050, drop: 'lapis_lazuli',    n: [4, 9], xp: [2, 5] },
  gold:        { name: 'Gold Ore',          tier: 1, ms: 1150, drop: 'raw_gold',        n: [1, 1], xp: [0, 0] },
  redstone:    { name: 'Redstone Ore',      tier: 1, ms: 1150, drop: 'redstone',        n: [4, 5], xp: [1, 5] },
  diamond:     { name: 'Diamond Ore',       tier: 1, ms: 1400, drop: 'diamond',         n: [1, 1], xp: [3, 7] },
  emerald:     { name: 'Emerald Ore',       tier: 1, ms: 1400, drop: 'emerald',         n: [1, 1], xp: [3, 7] },
  nether_quartz: { name: 'Nether Quartz Ore', tier: 0, ms: 800, drop: 'quartz',         n: [1, 1], xp: [2, 5], nether: true },
  nether_gold: { name: 'Nether Gold Ore',   tier: 0, ms: 800,  drop: 'gold_nugget',     n: [2, 6], xp: [0, 1], nether: true },
  debris:      { name: 'Ancient Debris',    tier: 2, ms: 2400, drop: 'netherite_scrap', n: [1, 1], xp: [2, 4], nether: true },
}
const OVERWORLD = ['coal', 'copper', 'iron', 'lapis', 'gold', 'redstone', 'diamond', 'emerald']

export const ITEM_NAME = {
  coal: 'Coal', raw_copper: 'Raw Copper', raw_iron: 'Raw Iron', lapis_lazuli: 'Lapis Lazuli', raw_gold: 'Raw Gold',
  redstone: 'Redstone Dust', diamond: 'Diamond', emerald: 'Emerald', quartz: 'Nether Quartz',
  gold_nugget: 'Gold Nugget', netherite_scrap: 'Netherite Scrap',
}
// hotbar order: the good stuff first
export const ITEM_ORDER = ['netherite_scrap', 'diamond', 'emerald', 'raw_gold', 'gold_nugget', 'quartz', 'redstone', 'lapis_lazuli', 'raw_iron', 'raw_copper', 'coal']

// the block texture for an ore at a given depth: below Y 0 the stone is deepslate
export function oreTexture(key, deep) {
  if (key === 'nether_quartz') return BLOCK + 'nether_quartz_ore.png'
  if (key === 'nether_gold') return BLOCK + 'nether_gold_ore.png'
  if (key === 'debris') return BLOCK + 'ancient_debris_side.png'
  return BLOCK + (deep ? 'deepslate_' : '') + key + '_ore.png'
}

// which ore turns up at world height Y (64 at the surface, -64 at bedrock),
// roughly the way the real game spreads them. rnd() is a seeded [0, 1).
export function pickOre(Y, rnd, nether) {
  if (nether) return Y < -12 && rnd() < 0.22 ? 'debris' : rnd() < 0.55 ? 'nether_quartz' : 'nether_gold'
  const w = {
    coal: Y > -8 ? 30 : 6,
    copper: Y > -16 && Y < 56 ? 16 : 0,
    iron: Y < 56 ? 20 : 0,
    lapis: Y < 24 ? 10 : 0,
    gold: Y < 24 ? 9 : 0,
    redstone: Y < -12 ? 14 : 0,
    diamond: Y < -48 ? 22 : Y < -20 ? 11 : 0,   // likeliest right above bedrock
    emerald: Y < 32 ? 2 : 0,
  }
  let total = 0
  for (const k in w) total += w[k]
  let r = rnd() * total
  for (const k in w) { if ((r -= w[k]) < 0) return k }
  return 'coal'
}

const fresh = () => ({ pick: 'stone', items: {}, xp: 0, mined: 0, kinds: [] })
let state = (() => {
  try { return { ...fresh(), ...JSON.parse(localStorage.getItem(KEY) || '{}') } } catch { return fresh() }
})()

export const getMine = () => state
const tierOf = (pick) => PICKS.indexOf(pick)
const save = () => {
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* private mode */ }
  window.dispatchEvent(new Event('mcop:mine-changed'))
}
const roll = ([a, b]) => a + Math.floor(Math.random() * (b - a + 1))

// how long this ore takes with the pickaxe in hand (deepslate is tougher)
export function breakTime(key, deep) {
  const ms = ORES[key].ms * PICK[state.pick].speed * (deep ? 1.35 : 1)
  return Math.round(ms)
}
export const canMine = (key) => tierOf(state.pick) >= ORES[key].tier
export const pickNeeded = (key) => PICK[PICKS[ORES[key].tier]].name

// the block broke: put its drop in the inventory and hand out advancements.
// returns { drop, n, xp } for the effects.
export function collect(key, deep) {
  const ore = ORES[key]
  const n = roll(ore.n)
  const xp = roll(ore.xp)
  state = {
    ...state,
    items: { ...state.items, [ore.drop]: (state.items[ore.drop] || 0) + n },
    xp: state.xp + xp,
    mined: state.mined + 1,
    kinds: state.kinds.includes(key) ? state.kinds : [...state.kinds, key],
  }
  save()
  unlock('stone-age')
  if (deep) unlock('deep-dark')
  if (key === 'emerald') unlock('lucky-strike')
  if (key === 'diamond') unlock('diamonds')
  if (key === 'debris') unlock('hidden-depths')
  if (OVERWORLD.every(k => state.kinds.includes(k))) unlock('geologist')
  if (state.mined >= 100) unlock('tireless')
  window.dispatchEvent(new CustomEvent('mcop:mine', { detail: { key, drop: ore.drop, n, xp } }))
  return { drop: ore.drop, n, xp }
}

// the next pickaxe up, if there is one, and whether you have what it takes
export function nextPick() {
  const next = PICKS[tierOf(state.pick) + 1]
  if (!next) return null
  const needs = RECIPES[next]
  const ready = Object.entries(needs).every(([item, n]) => (state.items[item] || 0) >= n)
  return { pick: next, needs, ready }
}

export function craft() {
  const up = nextPick()
  if (!up || !up.ready) return false
  const items = { ...state.items }
  for (const [item, n] of Object.entries(up.needs)) items[item] -= n
  state = { ...state, pick: up.pick, items }
  save()
  toast('Crafted a ' + PICK[up.pick].name, PICK[up.pick].icon)
  if (up.pick === 'iron') unlock('iron-pick')
  if (up.pick === 'diamond') unlock('diamond-pick')
  if (up.pick === 'netherite') unlock('serious-dedication')
  return true
}

// experience levels, with the game's own curve
export function levelOf(xp) {
  let level = 0
  let left = xp
  const need = (l) => (l < 16 ? 2 * l + 7 : l < 31 ? 5 * l - 38 : 9 * l - 158)
  while (left >= need(level)) { left -= need(level); level++ }
  return { level, progress: left / need(level) }
}

export function resetMine() {
  state = fresh()
  save()
}
