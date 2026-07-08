// audio: Neev's real Minecraft lever click + the jukebox record. the old
// synthesized effects are intentionally retired — kept as silent no-ops so the
// many callers around the app don't need to change.
let ctx
let muted = localStorage.getItem('mcop_muted') === '1'

export const isMuted = () => muted
export function setMuted(m) {
  muted = m
  localStorage.setItem('mcop_muted', m ? '1' : '0')
  if (musicEl) musicEl.muted = m
}

function ac() {
  ctx = ctx || new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

// ── lever flip: Neev's real Minecraft click sample ──────────────────
// the raw bytes are fetched up front; we decode into the audio context on the
// first user gesture, then fire the click as throwaway buffer sources so rapid
// flips never stack. if the first flip lands before the decode finishes, it's
// queued and plays the moment the buffer is ready.
let leverBytes = null
let leverBuf = null
let leverDecoding = false
let leverPending = false
if (typeof fetch !== 'undefined') {
  fetch('/assets/audio/lever.mp3').then(r => r.arrayBuffer()).then(b => { leverBytes = b }).catch(() => {})
}
function decodeLever() {
  if (leverBuf || leverDecoding || !leverBytes) return
  leverDecoding = true
  try {
    ac().decodeAudioData(leverBytes.slice(0)).then(b => {
      leverBuf = b
      if (leverPending) { leverPending = false; playLever() }
    }).catch(() => { leverDecoding = false })
  } catch { leverDecoding = false }
}
// prime the context + decode on the first pointer press anywhere
if (typeof window !== 'undefined') {
  const prime = () => { decodeLever(); window.removeEventListener('pointerdown', prime) }
  window.addEventListener('pointerdown', prime)
}

export function playLever() {
  if (muted) return
  try {
    const c = ac()
    if (!leverBuf) { leverPending = true; decodeLever(); return }
    const src = c.createBufferSource()
    const g = c.createGain()
    g.gain.value = 0.6
    src.buffer = leverBuf
    src.connect(g).connect(c.destination)
    src.start()
  } catch { /* audio not available */ }
}

// ── rare achievement sting: plays /assets/audio/rare.mp3 if present ──
// (Neev will drop the file in; until then the fetch 404s and this stays silent)
let rareBytes = null, rareBuf = null, rareDecoding = false, rarePending = false
if (typeof fetch !== 'undefined') {
  fetch('/assets/audio/rare.mp3').then(r => r.ok ? r.arrayBuffer() : null).then(b => { if (b) rareBytes = b }).catch(() => {})
}
function decodeRare() {
  if (rareBuf || rareDecoding || !rareBytes) return
  rareDecoding = true
  try {
    ac().decodeAudioData(rareBytes.slice(0)).then(b => {
      rareBuf = b
      if (rarePending) { rarePending = false; playRare() }
    }).catch(() => { rareDecoding = false })
  } catch { rareDecoding = false }
}
export function playRare() {
  if (muted) return
  try {
    const c = ac()
    if (!rareBuf) { rarePending = true; decodeRare(); return }
    const src = c.createBufferSource()
    const g = c.createGain()
    g.gain.value = 0.8
    src.buffer = rareBuf
    src.connect(g).connect(c.destination)
    src.start()
  } catch { /* */ }
}

// ── retired synth effects (silent no-ops) ───────────────────────────
export function playClick() {}
export function playTick() {}
export function playXp() {}
export function playPop() {}
export function playError() {}
export function playFirework() {}
export function playHissBoom() {}

/* ── jukebox: Neev's note block record (90210 cover), looped quietly.
   buffered ahead of time (after the page settles, so it never competes with
   the world renders) so the first play starts instantly. */
let musicEl = null

function ensureMusic() {
  if (!musicEl) {
    musicEl = new Audio('/assets/audio/jukebox.mp3')
    musicEl.preload = 'auto'
    musicEl.loop = true
    musicEl.volume = 0.38
  }
  return musicEl
}

// warm the buffer once the page is idle
if (typeof window !== 'undefined') {
  const warm = () => setTimeout(ensureMusic, 1500)
  if (document.readyState === 'complete') warm()
  else window.addEventListener('load', warm, { once: true })
}

export const isMusicOn = () => !!musicEl && !musicEl.paused

export function startMusic() {
  const el = ensureMusic()
  el.muted = muted
  el.play().catch(() => { /* browser said no; the lever stays honest */ })
}

export function stopMusic() {
  if (musicEl) musicEl.pause()
}
