// One rAF-throttled scroll source for the whole app, so the parallax world and
// the depth meter don't each attach a listener and read layout every frame.
// `max` (the expensive scrollHeight read) is cached and only remeasured on
// resize or when a new page settles — the per-frame path only touches scrollY.
let max = 0
let progress = 0
let started = false
const subs = new Set()

// when the browser can pan the world on the compositor (scroll-driven CSS
// animations), we don't touch --scrollp at all — the visuals never hit the main
// thread. we only compute progress for the depth meter, which updates rarely.
const CSS_SCROLL_DRIVEN =
  typeof CSS !== 'undefined' && CSS.supports && CSS.supports('animation-timeline', 'scroll()')

function compute() {
  progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
  if (!CSS_SCROLL_DRIVEN) document.documentElement.style.setProperty('--scrollp', String(progress))
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

// subscribe to scroll progress (0..1). fires immediately with the current value.
export function subscribeScroll(fn) {
  ensureStarted()
  subs.add(fn)
  fn(progress)
  return () => subs.delete(fn)
}

// call after navigation/async content — the document height likely changed.
export function remeasureSoon() {
  ensureStarted()
  measure()
  setTimeout(measure, 400)
  setTimeout(measure, 1200)
}
