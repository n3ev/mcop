import { playRare } from './sound.js'

// every unlockable: which tab of the advancement screen it lives in, its place
// in that tab's tree, and a cryptic HINT (never the literal trigger). ids are
// stable — they're what's saved, so earned progress survives any reshuffle.
// the rare one auto-unlocks once everything that counts toward it is earned;
// it stays "???" and purple until then. `extra` ones need a real match or
// account, so they never block the rare one.
const KEY = 'mcop_achievements'
export const BLOCK = '/assets/textures/blocks/'
export const ITEM = '/assets/textures/items/'

export const RARE_ID = 'ender-of-the-line'

// the tabs along the top of the advancement screen, like the game's
export const TABS = [
  { id: 'site', title: 'MCOP', icon: BLOCK + 'grass-side.png', bg: 'adventure' },
  { id: 'mining', title: 'Mining', icon: ITEM + 'iron_pickaxe.png', bg: 'stone' },
  { id: 'secrets', title: 'Secrets', icon: BLOCK + 'command.png', bg: 'end' },
]

// col/row = position in its tab's tree; parent = who it branches from; tier
// picks the frame and the toast (task / goal / challenge, like Minecraft).
export const ACHIEVEMENTS = [
  // ── MCOP: finding your way around (and finding a buddy) ──
  { id: 'first-steps',        tab: 'site', title: 'First Steps',      hint: 'Every world starts with a single step in.',              icon: BLOCK + 'grass-side.png',  tier: 'task',      col: 0, row: 2, parent: null },
  { id: 'cartographer',       tab: 'site', title: 'Cartographer',     hint: 'See every corner of the world, top to bottom.',          icon: ITEM + 'filled_map.png',   tier: 'task',      col: 1, row: 0, parent: 'first-steps' },
  { id: 'torchbearer',        tab: 'site', title: 'Torchbearer',      hint: 'Bring your own light. The other button places it.',      icon: BLOCK + 'torch.png',       tier: 'task',      col: 2, row: 0, parent: 'cartographer' },
  { id: 'broad-daylight',     tab: 'site', title: 'Broad Daylight',   hint: 'Chase the dusk away.',                                   icon: BLOCK + 'sun.png',         tier: 'task',      col: 1, row: 1, parent: 'first-steps' },
  { id: 'night-owl',          tab: 'site', title: 'Night Owl',        hint: '…then welcome the dark back home.',                      icon: BLOCK + 'moon.png',        tier: 'task',      col: 2, row: 1, parent: 'broad-daylight' },
  { id: 'rock-bottom',        tab: 'site', title: 'Rock Bottom',      hint: 'There is nothing below the bottom of the world.',        icon: BLOCK + 'bedrock.png',     tier: 'task',      col: 1, row: 2, parent: 'first-steps' },
  { id: 'cant-break-bedrock', tab: 'site', title: 'Nice Try',         hint: 'Some blocks simply will not break, however you hit them.', icon: BLOCK + 'bedrock.png', tier: 'task',      col: 2, row: 2, parent: 'rock-bottom' },
  { id: 'going-gold',         tab: 'site', title: 'Going Gold',       hint: 'Let a record spin.',                                     icon: ITEM + 'music_disc_cat.png', tier: 'goal',    col: 1, row: 3, parent: 'first-steps' },
  { id: 'spread-the-word',    tab: 'site', title: 'Spread the Word',  hint: 'Every world is better with one more player in it.',      icon: ITEM + 'writable_book.png', tier: 'goal',     col: 2, row: 3, parent: 'going-gold' },
  { id: 'know-thyself',       tab: 'site', title: 'Know Thyself',     hint: 'Tell the matchmaker how you like to play. Keep it.',     icon: ITEM + 'name_tag.png',     tier: 'task',      col: 1, row: 4, parent: 'first-steps', extra: true },
  { id: 'verified',           tab: 'site', title: 'Who Goes There',   hint: 'Prove the name on your profile is really yours.',        icon: ITEM + 'compass_00.png',   tier: 'task',      col: 2, row: 4, parent: 'know-thyself', extra: true },
  { id: 'player-two',         tab: 'site', title: 'Player Two',       hint: 'It is dangerous to go alone. So don\'t.',                icon: ITEM + 'totem_of_undying.png', tier: 'challenge', col: 3, row: 4, parent: 'verified', extra: true },

  // ── Mining: the ores in the cave walls ──
  { id: 'stone-age',          tab: 'mining', title: 'Stone Age',            hint: 'The walls are full of ore. Hold on to one.',          icon: ITEM + 'stone_pickaxe.png',   tier: 'task',  col: 0, row: 2, parent: null },
  { id: 'deep-dark',          tab: 'mining', title: 'Into the Deep',        hint: 'Below zero the stone turns dark. Dig there.',         icon: BLOCK + 'deepslate_coal_ore.png', tier: 'task', col: 1, row: 1, parent: 'stone-age' },
  { id: 'lucky-strike',       tab: 'mining', title: 'Lucky Strike',         hint: 'Green, rare, and never where you look for it.',      icon: ITEM + 'emerald.png',         tier: 'goal',  col: 2, row: 0, parent: 'deep-dark' },
  { id: 'iron-pick',          tab: 'mining', title: "Isn't It Iron Pick",   hint: 'Some ores laugh at stone. Raw iron, three of it.',   icon: ITEM + 'iron_pickaxe.png',    tier: 'task',  col: 1, row: 2, parent: 'stone-age' },
  { id: 'diamonds',           tab: 'mining', title: 'DIAMONDS!',            hint: 'Dig them up — or say the magic word out loud.',      icon: ITEM + 'diamond.png',         tier: 'goal',  col: 2, row: 2, parent: 'iron-pick' },
  { id: 'diamond-pick',       tab: 'mining', title: 'Cutting Edge',         hint: 'Three of the shiny ones make a fine tool.',          icon: ITEM + 'diamond_pickaxe.png', tier: 'task',  col: 3, row: 2, parent: 'diamonds' },
  { id: 'hidden-depths',      tab: 'mining', title: 'Hidden in the Depths', hint: 'Somewhere hotter than any cave, something older.',   icon: BLOCK + 'ancient_debris_side.png', tier: 'goal', col: 4, row: 2, parent: 'diamond-pick' },
  { id: 'serious-dedication', tab: 'mining', title: 'Serious Dedication',   hint: 'The last pickaxe you will ever need.',               icon: ITEM + 'netherite_pickaxe.png', tier: 'challenge', col: 5, row: 2, parent: 'hidden-depths' },
  { id: 'geologist',          tab: 'mining', title: 'Geologist',            hint: 'One of every ore the overworld hides.',             icon: ITEM + 'lapis_lazuli.png',    tier: 'goal',  col: 1, row: 3, parent: 'stone-age' },
  { id: 'tireless',           tab: 'mining', title: 'Tireless',             hint: 'A hundred blocks. Your arm will be fine.',           icon: ITEM + 'experience_bottle.png', tier: 'challenge', col: 2, row: 3, parent: 'geologist' },

  // ── Secrets: the easter eggs ──
  { id: 'konami',             tab: 'secrets', title: "It's Gonna Blow",       hint: 'Up, up, and a very old secret.',                    icon: BLOCK + 'ore-redstone.png', tier: 'goal',      col: 0, row: 1, parent: null },
  { id: 'herobrine',          tab: 'secrets', title: 'Removed the Wrong One', hint: 'Spell out the name that was never really gone.',    icon: BLOCK + 'herobrine.png',    tier: 'challenge', col: 1, row: 0, parent: 'konami', secret: true },
  { id: 'operator',           tab: 'secrets', title: 'Operator',              hint: 'One key opens a bar where the rules do not apply.', icon: BLOCK + 'command.png',      tier: 'goal',      col: 2, row: 0, parent: 'herobrine' },
  { id: 'back-from-void',     tab: 'secrets', title: 'Back from the Void',    hint: 'You have to go before you can come back.',          icon: BLOCK + 'deepslate.png',    tier: 'task',      col: 3, row: 0, parent: 'operator' },
  { id: 'the-nether',         tab: 'secrets', title: 'We Need to Go Deeper',  hint: 'There is a hotter place than the deepest cave. Say its name.', icon: BLOCK + 'netherrack.png', tier: 'goal', col: 1, row: 2, parent: 'konami' },
  { id: 'there-and-back',     tab: 'secrets', title: 'There and Back Again',  hint: 'Every trip to the fire needs a trip home.',         icon: BLOCK + 'torch.png',        tier: 'challenge', col: 2, row: 2, parent: 'the-nether' },
  { id: RARE_ID,              tab: 'secrets', title: 'Ender of the Line',     hint: 'When there is nothing left to earn, the void opens.', icon: BLOCK + 'amethyst.png',   tier: 'challenge', col: 4, row: 1, parent: 'back-from-void', rare: true },
]

export const DEF = Object.fromEntries(ACHIEVEMENTS.map(a => [a.id, a]))
// what the rare one waits for: everything you can earn on the site alone
const BASE_IDS = ACHIEVEMENTS.filter(a => !a.rare && !a.extra).map(a => a.id)

// in-memory mirror of localStorage so isUnlocked() is O(1) (safe per-frame)
let mem = null
function set() {
  if (mem) return mem
  try { mem = new Set(JSON.parse(localStorage.getItem(KEY) || '[]')) } catch { mem = new Set() }
  return mem
}

export function isUnlocked(id) { return set().has(id) }
export function unlockedCount() { return ACHIEVEMENTS.filter(a => !a.rare && set().has(a.id)).length }
export function baseTotal() { return ACHIEVEMENTS.filter(a => !a.rare).length }
export function tabCount(tab) {
  const all = ACHIEVEMENTS.filter(a => a.tab === tab)
  return { done: all.filter(a => set().has(a.id)).length, total: all.length }
}

// the toast line Minecraft shows for each kind of advancement
export const TOAST_TITLE = { task: 'Advancement Made!', goal: 'Goal Reached!', challenge: 'Challenge Complete!' }

export function unlock(id) {
  const def = DEF[id]
  if (!def) return
  const s = set()
  if (s.has(id)) return
  s.add(id)
  try { localStorage.setItem(KEY, JSON.stringify([...s])) } catch { /* private mode */ }

  if (def.rare) playRare()
  window.dispatchEvent(new CustomEvent('mcop:toast', {
    detail: { id, title: def.rare ? 'Rare Advancement!' : TOAST_TITLE[def.tier], text: def.title, icon: def.icon, kind: def.rare ? 'rare' : def.tier },
  }))
  // just earned the last one that counts? the rare one opens up.
  if (!def.rare && BASE_IDS.every(b => s.has(b))) setTimeout(() => unlock(RARE_ID), 1500)
  window.dispatchEvent(new Event('mcop:achievements-changed'))
}

// wipe progress so achievements can be re-earned (the button on the screen)
export function resetAchievements() {
  mem = new Set()
  localStorage.removeItem(KEY)
  localStorage.removeItem('mcop_cartographer')
  localStorage.removeItem('mcop_seen')
  window.dispatchEvent(new Event('mcop:achievements-changed'))
}
