// One rAF-throttled scroll source for the whole app, so the parallax world and
// the depth meter don't each attach a listener and read layout every frame.
// `max` (the expensive scrollHeight read) is cached and only remeasured on
// resize or when a new page settles — the per-frame path only touches scrollY.
//
// subscribers get WORLD progress (0 = sky, 1 = bedrock), which moves at one
// rate on every page: the sky-to-bedrock trip takes at least MIN_TRAVEL
// screens of scrolling, so a long page spreads the whole world over its length
// and a short one only gets as deep as its length takes it, instead of
// rushing the whole world past in a screen or two.
const MIN_TRAVEL = 4.5
let max = 0
let progress = 0
let started = false
const subs = new Set()

// when the browser can drive the scroll bar on the compositor (scroll-driven CSS
// animations), we don't touch --scrollp at all. --scrollp is PAGE progress, for
// the XP-style scroll bar; the world gets `progress` through subscribers.
const CSS_SCROLL_DRIVEN =
  typeof CSS !== 'undefined' && CSS.supports && CSS.supports('animation-timeline', 'scroll()')

const clamp = (v) => Math.min(1, Math.max(0, v))
const travel = () => Math.max(max, MIN_TRAVEL * window.innerHeight)

function compute() {
  const y = window.scrollY
  progress = max > 0 ? clamp(y / travel()) : 0
  if (!CSS_SCROLL_DRIVEN) document.documentElement.style.setProperty('--scrollp', String(max > 0 ? clamp(y / max) : 0))
  subs.forEach(fn => fn(progress))
}

function measure() {
  max = document.documentElement.scrollHeight - window.innerHeight
  compute()
}

function onScroll() {
  // compute directly in the scroll event: subscribers repaint the instant the
  // user scrolls, even when rAF is throttled (background/occluded pages). the
  // work is a couple of reads and two subscribers — cheaper than a missed frame.
  compute()
}

function ensureStarted() {
  if (started) return
  started = true
  measure()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', measure)
}

// subscribe to world progress (0..1). fires immediately with the current value.
export function subscribeScroll(fn) {
  ensureStarted()
  subs.add(fn)
  fn(progress)
  return () => subs.delete(fn)
}

// the world progress showing while page position `pageY` is mid-screen —
// how deep that bit of the page sits in the world
export function worldProgressAt(pageY) {
  ensureStarted()
  return max > 0 ? clamp((pageY - window.innerHeight / 2) / travel()) : 0
}

// call after navigation/async content — the document height likely changed.
export function remeasureSoon() {
  ensureStarted()
  measure()
  setTimeout(measure, 400)
  setTimeout(measure, 1200)
}
