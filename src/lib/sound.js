// synthesized minecraft-style sounds (Web Audio) — no ripped game audio.
// one shared AudioContext; oscillators are throwaway nodes so rapid
// clicking never stacks or lags. everything is user-initiated (no autoplay).
let ctx
let muted = localStorage.getItem('mcop_muted') === '1'

export const isMuted = () => muted
export function setMuted(m) {
  muted = m
  localStorage.setItem('mcop_muted', m ? '1' : '0')
}

function ac() {
  ctx = ctx || new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

// small reusable noise buffer (fireworks, anvil, hiss)
let noiseBuf
function noise(c) {
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate * 1.5, c.sampleRate)
    const d = noiseBuf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  }
  const src = c.createBufferSource()
  src.buffer = noiseBuf
  return src
}

function tone(c, { type = 'square', from, to, t0, dur, vol }) {
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(from, t0)
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur)
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.004)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(gain).connect(c.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

// the classic wood click — every button fires this
export function playClick() {
  if (muted) return
  try {
    const c = ac()
    tone(c, { from: 190, to: 120, t0: c.currentTime, dur: 0.09, vol: 0.16 })
  } catch { /* audio not available */ }
}

// barely-there hover tick (self-throttled)
let lastTick = 0
export function playTick() {
  if (muted) return
  const now = performance.now()
  if (now - lastTick < 90) return
  lastTick = now
  try {
    const c = ac()
    tone(c, { from: 900, to: 700, t0: c.currentTime, dur: 0.03, vol: 0.025 })
  } catch { /* */ }
}

// redstone lever: clack down, clack up
export function playLever() {
  if (muted) return
  try {
    const c = ac()
    const t = c.currentTime
    tone(c, { from: 150, to: 95, t0: t, dur: 0.06, vol: 0.15 })
    tone(c, { from: 260, to: 170, t0: t + 0.07, dur: 0.05, vol: 0.11 })
  } catch { /* */ }
}

// xp / level-up chime — the match-found payoff
export function playXp() {
  if (muted) return
  try {
    const c = ac()
    const t = c.currentTime
    ;[659, 880, 1109, 1319].forEach((f, i) => {
      tone(c, { type: 'triangle', from: f, t0: t + i * 0.09, dur: 0.34, vol: 0.12 })
      tone(c, { type: 'sine', from: f * 2, t0: t + i * 0.09, dur: 0.2, vol: 0.04 })
    })
  } catch { /* */ }
}

// totem-ish pop (small success moments)
export function playPop() {
  if (muted) return
  try {
    const c = ac()
    tone(c, { type: 'sine', from: 480, to: 960, t0: c.currentTime, dur: 0.09, vol: 0.14 })
  } catch { /* */ }
}

// anvil clank (errors)
export function playError() {
  if (muted) return
  try {
    const c = ac()
    const t = c.currentTime
    tone(c, { type: 'square', from: 210, to: 140, t0: t, dur: 0.14, vol: 0.1 })
    tone(c, { type: 'sawtooth', from: 285, to: 240, t0: t, dur: 0.12, vol: 0.06 })
    tone(c, { type: 'sine', from: 80, to: 55, t0: t, dur: 0.18, vol: 0.14 })
  } catch { /* */ }
}

// single firework crack (called per burst by the particles layer)
export function playFirework() {
  if (muted) return
  try {
    const c = ac()
    const t = c.currentTime
    const src = noise(c)
    const gain = c.createGain()
    const filt = c.createBiquadFilter()
    filt.type = 'bandpass'
    filt.frequency.setValueAtTime(1800, t)
    filt.frequency.exponentialRampToValueAtTime(300, t + 0.35)
    gain.gain.setValueAtTime(0.22, t)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.38)
    src.connect(filt).connect(gain).connect(c.destination)
    src.start(t, Math.random(), 0.45)
  } catch { /* */ }
}

// creeper fuse + boom (easter egg)
export function playHissBoom() {
  if (muted) return
  try {
    const c = ac()
    const t = c.currentTime
    const src = noise(c)
    const gain = c.createGain()
    const filt = c.createBiquadFilter()
    filt.type = 'highpass'
    filt.frequency.value = 2400
    gain.gain.setValueAtTime(0.02, t)
    gain.gain.exponentialRampToValueAtTime(0.14, t + 1.1)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.25)
    src.connect(filt).connect(gain).connect(c.destination)
    src.start(t, Math.random(), 1.3)
    // boom
    tone(c, { type: 'sine', from: 120, to: 34, t0: t + 1.2, dur: 0.5, vol: 0.3 })
    const bsrc = noise(c)
    const bg = c.createGain()
    const bf = c.createBiquadFilter()
    bf.type = 'lowpass'
    bf.frequency.value = 500
    bg.gain.setValueAtTime(0.25, t + 1.2)
    bg.gain.exponentialRampToValueAtTime(0.0001, t + 1.75)
    bsrc.connect(bf).connect(bg).connect(c.destination)
    bsrc.start(t + 1.2, Math.random(), 0.6)
  } catch { /* */ }
}

/* ── jukebox: an ambient note-block tune, synthesized, off by default ──
   a gentle random walk over C-major pentatonic, note-block "harp"
   plucks (sine with a fast decay). starts only from a user gesture. */
const SCALE = [261.6, 293.7, 329.6, 392.0, 440.0, 523.3, 587.3, 659.3, 784.0]
let musicTimer = null
let walk = 4

function pluck(freq, vol = 0.05) {
  if (muted) return
  try {
    const c = ac()
    const t = c.currentTime
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(vol, t)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.9)
    osc.connect(gain).connect(c.destination)
    osc.start(t)
    osc.stop(t + 1)
    // a quiet octave shimmer
    const o2 = c.createOscillator()
    const g2 = c.createGain()
    o2.type = 'sine'
    o2.frequency.value = freq * 2
    g2.gain.setValueAtTime(vol * 0.3, t)
    g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.5)
    o2.connect(g2).connect(c.destination)
    o2.start(t)
    o2.stop(t + 0.6)
  } catch { /* */ }
}

export const isMusicOn = () => !!musicTimer

export function startMusic() {
  if (musicTimer) return
  musicTimer = setInterval(() => {
    if (Math.random() < 0.22) return // rests keep it airy
    walk = Math.max(0, Math.min(SCALE.length - 1, walk + [-2, -1, -1, 1, 1, 2][Math.floor(Math.random() * 6)]))
    pluck(SCALE[walk])
    if (Math.random() < 0.3) setTimeout(() => pluck(SCALE[Math.max(0, walk - 2)], 0.035), 300)
  }, 640)
  pluck(SCALE[4])
}

export function stopMusic() {
  clearInterval(musicTimer)
  musicTimer = null
}
