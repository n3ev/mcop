// "your hour" as a picture: a 1080×1920 story card drawn on a canvas, in the
// site's pixel style. every card that gets posted is an ad shown to exactly
// the right people (friends who play Minecraft), and the link on it carries
// ?ref=card so the scoreboard can count who it brings.
//
// data: { you, buddy, friends, recap, date }
//   you / buddy: { name, mc }   recap: the plugin's end-of-hour recap, or null
const W = 1080
const H = 1920
const FONT = 'Monocraft, ui-monospace, monospace' // the fallback covers any glyph the pixel font lacks
const GOLD = '#ffd876'
const TEXT = '#f4efe6'
const MUTED = '#cfc6b8'
const GREEN = '#8fd15c'

function loadImage(src, cors = false) {
  return new Promise((resolve) => {
    const img = new Image()
    if (cors) img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null) // a missing picture never stops the card
    img.src = src
  })
}

function text(ctx, s, x, y, { size = 40, color = TEXT, align = 'center', shadow = true } = {}) {
  ctx.font = `${size}px ${FONT}`
  ctx.textAlign = align
  ctx.textBaseline = 'alphabetic'
  if (shadow) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fillText(s, x + size / 12, y + size / 12)
  }
  ctx.fillStyle = color
  ctx.fillText(s, x, y)
}

// the longest prefix of s that fits, with an ellipsis if it was cut
function fit(ctx, s, maxWidth, size) {
  ctx.font = `${size}px ${FONT}`
  if (ctx.measureText(s).width <= maxWidth) return s
  let out = s
  while (out.length > 1 && ctx.measureText(out + '…').width > maxWidth) out = out.slice(0, -1)
  return out + '…'
}

function tile(ctx, img, x, y, w, h, scale) {
  if (!img) return
  const step = img.width * scale
  for (let ty = y; ty < y + h; ty += step) {
    for (let tx = x; tx < x + w; tx += step) ctx.drawImage(img, tx, ty, step, step)
  }
}

function head(ctx, img, name, cx, y, size) {
  ctx.fillStyle = 'rgba(0,0,0,0.45)'
  ctx.fillRect(cx - size / 2 - 8, y - 8, size + 16, size + 16)
  if (img) ctx.drawImage(img, cx - size / 2, y, size, size)
  else {
    ctx.fillStyle = '#4f9a31'
    ctx.fillRect(cx - size / 2, y, size, size)
    text(ctx, (name || '?')[0].toUpperCase(), cx, y + size * 0.68, { size: size * 0.5 })
  }
  text(ctx, fit(ctx, name || 'Player', 380, 44), cx, y + size + 72, { size: 44 })
}

// a Minecraft hotbar: nine slots, the middle one selected
function hotbar(ctx, icons, cx, y) {
  const slot = 96, n = 9, x0 = cx - (slot * n) / 2
  ctx.fillStyle = 'rgba(0,0,0,0.55)'
  ctx.fillRect(x0 - 6, y - 6, slot * n + 12, slot + 12)
  for (let i = 0; i < n; i++) {
    const x = x0 + i * slot
    ctx.fillStyle = '#8b8b8b'
    ctx.fillRect(x + 3, y + 3, slot - 6, slot - 6)
    ctx.fillStyle = '#373737'
    ctx.fillRect(x + 6, y + 6, slot - 12, slot - 12)
    if (icons[i]) ctx.drawImage(icons[i], x + 16, y + 16, slot - 32, slot - 32)
  }
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 6
  ctx.strokeRect(x0 + 4 * slot - 1, y - 1, slot + 2, slot + 2)
}

// what to brag about, best first (at most five lines)
export function cardLines(recap) {
  if (!recap) return []
  const lines = []
  if (recap.quest?.done?.length) {
    const n = recap.quest.done.length
    lines.push({ icon: 'writable_book', text: `${n} quest${n === 1 ? '' : 's'} done`, sub: recap.quest.done.map(q => q.title).join(', ') })
  }
  for (const r of (recap.build?.rounds || []).slice(0, 2)) {
    const best = Math.max(0, ...Object.values(r.stars || {}))
    lines.push({ icon: 'block:planks', text: `Build Battle, round ${r.round}`, sub: `"${r.theme}"${best ? ` · best build ${best} of 5` : ''}` })
  }
  if (recap.lab) lines.push({ icon: 'redstone', text: `Redstone Lab: ${recap.lab.solved} of ${recap.lab.total} rooms`, sub: '' })
  for (const r of (recap.copycat?.rounds || []).slice(0, 1)) {
    const best = Math.max(-1, ...Object.values(r.accuracy || {}))
    if (best >= 0) lines.push({ icon: 'spyglass', text: `Copycat: ${best}% copied`, sub: '' })
  }
  if (recap.oneblock) lines.push({ icon: 'block:grass-side', text: `One Block: ${recap.oneblock.mined} blocks`, sub: `reached ${recap.oneblock.phaseName || 'Plains'}` })
  return lines.slice(0, 5)
}

export async function renderCard({ you, buddy, friends, recap, date = Date.now() }) {
  if (document.fonts?.load) await document.fonts.load('48px Monocraft').catch(() => {})
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = false

  const icon = (name) => name.startsWith('block:') ? `/assets/textures/blocks/${name.slice(6)}.png` : `/assets/textures/items/${name}.png`
  const lines = cardLines(recap)
  const HOTBAR = ['diamond_pickaxe', 'iron_sword', 'bread', 'filled_map', 'compass_00', 'ender_pearl', 'writable_book', 'golden_apple', 'totem_of_undying']
  const hotbarIcons = lines.length ? [] : await Promise.all(HOTBAR.map(n => loadImage(`/assets/textures/items/${n}.png`)))
  const [logo, grassTop, dirt, stone, fire, youHead, buddyHead, ...icons] = await Promise.all([
    loadImage('/assets/logo/mcop-static.png'),
    loadImage('/assets/textures/blocks/grass-top.png'),
    loadImage('/assets/textures/blocks/dirt.png'),
    loadImage('/assets/textures/blocks/stone.png'),
    loadImage('/assets/textures/items/campfire.png'),
    loadImage(`https://minotar.net/helm/${encodeURIComponent(you.mc || you.name || 'Steve')}/64.png`, true),
    loadImage(`https://minotar.net/helm/${encodeURIComponent(buddy.mc || buddy.name || 'Alex')}/64.png`, true),
    ...lines.map(l => loadImage(icon(l.icon))),
  ])

  // night sky, a few stars, then grass, dirt and stone along the bottom
  const sky = ctx.createLinearGradient(0, 0, 0, H)
  sky.addColorStop(0, '#0b1020')
  sky.addColorStop(0.55, '#1d1838')
  sky.addColorStop(1, '#2a1f33')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, W, H)
  for (let i = 0; i < 70; i++) {
    const x = (i * 397) % W, y = (i * 211) % 1200, s = i % 5 === 0 ? 6 : 3
    ctx.fillStyle = `rgba(255,255,255,${0.35 + (i % 4) * 0.15})`
    ctx.fillRect(x, y, s, s)
  }
  const ground = 1600
  tile(ctx, grassTop, 0, ground, W, 48, 3)
  tile(ctx, dirt, 0, ground + 48, W, 144, 3)
  tile(ctx, stone, 0, ground + 192, W, H - ground - 192, 3)
  ctx.fillStyle = 'rgba(0,0,0,0.35)'
  ctx.fillRect(0, ground, W, H - ground)

  // the logo and the headline
  if (logo) ctx.drawImage(logo, W / 2 - 130, 70, 260, 260)
  text(ctx, friends ? 'AN HOUR OF MINECRAFT' : 'MATCHED WITH A STRANGER.', W / 2, 420, { size: 54, color: GOLD })
  text(ctx, friends ? 'with a friend' : 'Played for an hour.', W / 2, 490, { size: 48 })

  // the two of them by the fire
  head(ctx, youHead, you.name, 270, 570, 240)
  head(ctx, buddyHead, buddy.name, W - 270, 570, 240)
  if (fire) {
    ctx.save()
    ctx.shadowColor = 'rgba(255,150,40,0.9)'
    ctx.shadowBlur = 50
    ctx.drawImage(fire, W / 2 - 80, 640, 160, 160)
    ctx.restore()
  }

  // what they did: as many lines as fit above the totals, never overlapping them
  const players = recap?.players || []
  let y = 990
  if (lines.length) {
    const bottom = players.length ? 1385 : 1545
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i]
      const h = l.sub ? 104 : 74
      if (y + h - 44 > bottom) break
      if (icons[i]) ctx.drawImage(icons[i], 100, y - 50, 60, 60)
      text(ctx, fit(ctx, l.text, 850, 42), 186, y, { size: 42, align: 'left' })
      if (l.sub) text(ctx, fit(ctx, l.sub, 850, 30), 186, y + 44, { size: 30, color: MUTED, align: 'left', shadow: false })
      y += h
    }
  } else {
    // no recap from the game server: say what the hour was, under a hotbar
    text(ctx, fit(ctx, 'A private world for two.', 960, 42), W / 2, y + 40, { size: 42 })
    text(ctx, fit(ctx, friends ? 'One hour, one invite link.' : 'Matched on how we both play.', 960, 42), W / 2, y + 104, { size: 42, color: MUTED })
    hotbar(ctx, hotbarIcons, W / 2, y + 230)
  }

  // the totals, if the game server kept them, in a band of their own
  if (players.length) {
    const sum = (k) => players.reduce((a, p) => a + (Number(p[k]) || 0), 0)
    const stats = [['blocks mined', sum('mined')], ['blocks placed', sum('placed')], ['mobs', sum('mobs')]]
    const sy = 1470
    stats.forEach(([label, n], i) => {
      const cx = 200 + i * 340
      text(ctx, String(n), cx, sy, { size: 64, color: GREEN })
      text(ctx, label, cx, sy + 44, { size: 28, color: MUTED, shadow: false })
    })
  }

  // where to find it
  text(ctx, 'Find a Minecraft buddy, or bring one', W / 2, 1720, { size: 40 })
  text(ctx, 'mcop.world', W / 2, 1800, { size: 72, color: GOLD })
  text(ctx, `${new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })} · Not an official Minecraft service`, W / 2, 1870, { size: 24, color: MUTED, shadow: false })

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}
