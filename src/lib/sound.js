// synthesized minecraft-style click (Web Audio) — no ripped game audio.
// user-initiated only (fires on click), so it doesn't violate autoplay rules.
let ctx
let muted = localStorage.getItem('mcop_muted') === '1'

export const isMuted = () => muted
export function setMuted(m) {
  muted = m
  localStorage.setItem('mcop_muted', m ? '1' : '0')
}

export function playClick() {
  if (muted) return
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(190, t)
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.05)
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.16, t + 0.004)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09)
    osc.connect(gain).connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.1)
  } catch { /* audio not available */ }
}
