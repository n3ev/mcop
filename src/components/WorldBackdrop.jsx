import { Fragment, useEffect, useRef } from 'react'
import { subscribeScroll } from '../lib/scroll.js'
import NIGHT from '../data/night-layers.json'

// the world itself: Neev's shader renders of a real cross-section, night for
// dusk (default), day when the lever is flipped. scrolling down travels down
// into the world.
//
// the night is Neev's 4K fly-through (best_night.mp4), rebuilt by
// tools/world/build_night_layers.py as the layers it's made of instead of
// shipped as 142 video stills: the cut-away cross-section stitched into one
// tall image in front, the landscape behind it as bands and objects at their
// own measured parallax speeds (re-made every 150px of camera travel, since
// the view of the landscape changes on the way down), and the stars, which
// turn with the clip's time (the day/night cycle was running). scrolling only
// moves those layers: the GPU composites them and nothing is decoded or drawn
// per frame, so it stays smooth on slow machines. ~1.8MB at 1080p, not 23MB.
const DIR = '/assets/world/night'
const FRAME_W = NIGHT.frame.width        // every layer is placed in the recording's own frame (master px)
const FRAME_H = NIGHT.frame.height
const KEYS = NIGHT.keyframes
const LAST = KEYS.length - 1
const STEP = NIGHT.keyStep
const FADE = 0.3                         // share of the way between keyframes spent crossfading

// camera travel (master px) at u, the clip's time: 0 = deepest, 1 = surface
const travelAt = (u) => {
  const T = NIGHT.travel
  const x = Math.min(1, Math.max(0, u)) * (T.length - 1)
  const i = Math.min(T.length - 2, Math.floor(x))
  return T[i] + (T[i + 1] - T[i]) * (x - i)
}

// where each star is at u: the sky has turned by expm((1 - u) * turn), a
// homography in frame px. the whole clip is a few degrees of turn, so five
// terms of the series are exact to a hundredth of a pixel.
const TURN = NIGHT.stars.turn.flat()
const SPRITES = NIGHT.stars.sprites      // [x, y, w, h, sheet x, sheet y], frame px at the surface
const starTransforms = (u) => {
  const s = 1 - u
  let term = [1, 0, 0, 0, 1, 0, 0, 0, 1]
  const H = term.slice()
  for (let n = 1; n <= 5; n++) {
    const next = new Array(9)
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        next[r * 3 + c] = ((term[r * 3] * TURN[c] + term[r * 3 + 1] * TURN[3 + c] + term[r * 3 + 2] * TURN[6 + c]) * s) / n
      }
    }
    term = next
    for (let i = 0; i < 9; i++) H[i] += term[i]
  }
  return SPRITES.map(([x, y, w, h]) => {
    const cx = x + w / 2, cy = y + h / 2
    const z = H[6] * cx + H[7] * cy + H[8]
    const px = (H[0] * cx + H[1] * cy + H[2]) / z, py = (H[3] * cx + H[4] * cy + H[5]) / z
    return `translate3d(${px - w / 2}px,${py - h / 2}px,0)`
  })
}

// image width for a frame shown `cssW` px wide: enough pixels for the screen,
// up to 1.5x density (soft landscape gains little from 2x and it costs 1.8x
// the memory), and at most 1920 on phones
const pickWidth = (cssW) => {
  const need = cssW * Math.min(window.devicePixelRatio || 1, 1.5)
  const fits = NIGHT.widths.filter((w) => w <= (window.innerWidth < 768 ? 1920 : Infinity))
  return fits.find((w) => w >= need) || fits[fits.length - 1]
}

export default function WorldBackdrop() {
  const frameRef = useRef(null)
  const dayRef = useRef(null)
  const netherRef = useRef(null)
  useEffect(() => {
    const frame = frameRef.current
    const dayEl = dayRef.current
    const netherEl = netherRef.current
    if (!frame) return
    const groups = [...frame.querySelectorAll('.wl-kf')]
    const groupLayers = groups.map((g) => [...g.querySelectorAll('.wl-layer')].map((el) => ({ el, speed: +el.dataset.speed })))
    const groupStars = groups.map((g) => [...g.querySelectorAll('.wl-star')])
    const nearTop = frame.querySelector('.wl-near-top')
    const nearBody = frame.querySelector('.wl-near-body')
    const still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0, cur = 1, target = 1, primed = false, disposed = false

    const loaded = new Array(KEYS.length).fill(false)
    let topIn = false, bodyIn = false, starsIn = false
    const shown = new Array(KEYS.length).fill('')   // '' unmounted | 'warm' | 'on'
    let shownT = NaN, shownJ = -2, shownA = -1

    const nearestLoaded = (j) => {
      for (let d = 0; d <= LAST; d++) {
        if (loaded[j - d]) return j - d
        if (loaded[j + d]) return j + d
      }
      return -1
    }

    // the keyframe nearest the camera shows on its own; in the middle stretch
    // between two keyframes the next one fades in over it. the neighbours of
    // the nearest stay mounted at zero opacity (still rastered, thanks to
    // will-change: opacity), so switching to them never waits on a decode or
    // raster; the rest are unmounted. until a keyframe has arrived, the
    // nearest one that has stands in for it.
    const place = () => {
      const t = travelAt(cur)
      let j = Math.min(LAST, Math.max(0, Math.floor(t / STEP)))
      let a = Math.min(1, Math.max(0, ((t - KEYS[j].w) / STEP - (1 - FADE) / 2) / FADE))
      if (t >= KEYS[LAST].w) { j = -1; a = 0 }   // past here the cut face covers the whole screen
      else if (!loaded[j] || (a > 0 && j < LAST && !loaded[j + 1])) { j = nearestLoaded(j); a = 0 }
      if (t === shownT && j === shownJ && a === shownA) return
      const c = a < 0.5 ? j : j + 1
      let stars = null
      for (let g = 0; g <= LAST; g++) {
        const on = j >= 0 && ((g === j && a < 1) || (g === j + 1 && a > 0))
        const want = on ? 'on' : j >= 0 && Math.abs(g - c) <= 1 && loaded[g] ? 'warm' : ''
        const el = groups[g]
        if (want !== shown[g]) {
          el.style.display = want ? 'block' : ''
          shown[g] = want
        }
        if (want === 'on') {
          el.style.opacity = g === j ? '1' : String(a)
          for (const { el: layer, speed } of groupLayers[g]) layer.style.transform = `translate3d(0,${-speed * t}px,0)`
          if (groupStars[g].length) {
            stars = stars || starTransforms(cur)
            groupStars[g].forEach((el, i) => { el.style.transform = stars[i] })
          }
        } else if (want === 'warm') {
          el.style.opacity = '0'
        }
      }
      nearTop.style.transform = nearBody.style.transform = `translate3d(0,${-t}px,0)`
      shownT = t; shownJ = j; shownA = a
    }

    // glide toward the scroll position at no less than 1/141 of the page per
    // tick (the pace the old 142-frame scrub was tuned to: a wheel notch catches
    // up in ~3 ticks), faster across big gaps
    const SPAN = 141
    const advance = () => {
      const dF = (target - cur) * SPAN
      if (Math.abs(dF) < 0.01) { cur = target; return true }
      const cap = Math.max(1.0, Math.abs(dF) * 0.3)
      cur += (Math.sign(dF) * Math.min(Math.abs(dF), cap)) / SPAN
      return false
    }
    // the day and nether layers are ONE continuous image each, panned by the
    // same eased cur as a float translateY. each pans by its own aspect: h/w =
    // 1.1024 (day) / 0.9457 (nether); the width factor is 1/aspect so the image
    // always covers the viewport.
    const panImg = (el, aspect, wFactor) => {
      if (!el) return
      const vw = window.innerWidth, vh = window.innerHeight
      const travel = Math.min(0, vh - aspect * Math.max(vw, wFactor * vh))
      el.style.transform = `translateX(-50%) translateY(${(1 - cur) * travel}px)`
    }
    const panDay = () => {
      panImg(dayEl, 1.1024, 0.91)
      panImg(netherEl, 0.9457, 1.06)
    }

    let lastTick = 0
    const tick = (ts) => {
      raf = 0
      lastTick = ts || performance.now()
      const settled = advance()
      place()
      panDay()
      if (!settled) raf = requestAnimationFrame(tick)
    }
    const ensure = () => { if (!raf) raf = requestAnimationFrame(tick) }

    // scroll 0 (top) = the surface; the bottom of the page = the deepest point.
    // scroll events only move the target; the rAF tick does the rest. if rAF is
    // stalled (hidden/occluded tab) place directly so the page still tracks.
    const unsub = subscribeScroll((p) => {
      target = 1 - p
      if (!primed) { primed = true; cur = target }
      if (still) { cur = target; place(); panDay(); return } // reduced motion: no glide
      if (performance.now() - lastTick > 120 && !raf) { advance(); place(); panDay() }
      ensure()
    })

    // loading: what's on screen first (the top of the cut face and the keyframe
    // at the current depth), then the rest of the cut face, the stars, and the
    // other keyframes nearest first, a few at a time. an image counts as in once
    // decoded, so showing it never stalls a frame.
    let width = 0, gen = 0
    const load = () => {
      const myGen = ++gen
      const j0 = Math.min(LAST, Math.floor(travelAt(cur) / STEP))
      const order = KEYS.map((_, g) => g).sort((p, q) => Math.abs(p - j0) - Math.abs(q - j0))
      const sheet = new Image()
      const keyframe = (g) => ({ file: KEYS[g].file, imgs: [...groups[g].querySelectorAll('img')], done: () => { loaded[g] = true } })
      const queue = [
        { file: NIGHT.near.top.file, imgs: [nearTop], done: () => { topIn = true } },
        keyframe(order[0]),
        { file: NIGHT.near.body.file, imgs: [nearBody], done: () => { bodyIn = true } },
        { file: NIGHT.stars.file, imgs: [sheet], done: () => { starsIn = true; frame.style.setProperty('--wl-stars', `url("${sheet.src}")`) } },
        ...order.slice(1).map(keyframe),
      ]
      const next = () => {
        const item = queue.shift()
        if (!item || disposed || myGen !== gen) return
        const src = `${DIR}/${item.file}-${width}.webp`
        for (const img of item.imgs) img.src = src
        const arrived = () => {
          if (disposed || myGen !== gen) return
          item.done()
          // at the very top the rest of the cut face is still just below the screen
          if (topIn && (bodyIn || travelAt(cur) === 0) && loaded.some(Boolean)) frame.classList.add('is-ready')
          shownT = NaN
          place()
          next()
        }
        item.imgs[0].decode().then(arrived, arrived)
      }
      for (let i = 0; i < 3; i++) next()
    }

    const resize = () => {
      const vw = window.innerWidth, vh = window.innerHeight
      const s = Math.max(vw / FRAME_W, vh / FRAME_H)  // cover, centred, like the video
      frame.style.transform = `translate(${(vw - FRAME_W * s) / 2}px,${(vh - FRAME_H * s) / 2}px) scale(${s})`
      // only ever load sharper: a window that grows gets bigger images, the old
      // ones stay on screen until the new ones are in
      const w = pickWidth(FRAME_W * s)
      if (w > width) { width = w; load() }
      shownT = NaN
      place()
      panDay()
    }

    resize()
    window.addEventListener('resize', resize)
    // read-only state probe (dev tooling + automated verification)
    window.__world = () => ({ ready: topIn && bodyIn && starsIn && loaded.every(Boolean), cur, target, t: travelAt(cur), kf: shownJ, fade: shownA, width })
    return () => {
      disposed = true; unsub(); cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      delete window.__world
    }
  }, [])
  const { stars, near } = NIGHT
  return (
    <div className="world-bg" aria-hidden="true">
      <img className="world-poster" src="/assets/world/night-poster.webp" alt="" decoding="async" />
      <div className="world-layers world-night">
        <div ref={frameRef} className="wl-frame" style={{ width: FRAME_W, height: FRAME_H }}>
          {KEYS.map((kf) => (
            <div key={kf.file} className="wl-kf">
              {kf.layers.map((l, i) => (
                <Fragment key={i}>
                  <div className="wl-layer" data-kind={l.kind} data-speed={l.speed} style={{ left: l.left, top: l.top, width: l.width, height: l.height }}>
                    <img alt="" decoding="async" style={{ left: -l.atlasX, top: -l.atlasY, width: kf.width, height: kf.height }} />
                  </div>
                  {l.kind === 'sky' &&
                    SPRITES.map(([, , w, h, sx, sy], s) => (
                      <i key={s} className="wl-star" style={{ width: w, height: h, backgroundPosition: `${-sx}px ${-sy}px`, backgroundSize: `${stars.width}px ${stars.height}px` }} />
                    ))}
                </Fragment>
              ))}
            </div>
          ))}
          <img className="wl-near wl-near-top" alt="" decoding="async" style={{ top: near.top.y, height: near.top.height }} />
          <img className="wl-near wl-near-body" alt="" decoding="async" style={{ top: near.body.y, height: near.body.height }} />
        </div>
      </div>
      <img
        ref={dayRef}
        className="world-img world-day"
        src="/assets/world/day-1600.webp"
        srcSet="/assets/world/day-1080.webp 1080w, /assets/world/day-1600.webp 1600w, /assets/world/day-2560.webp 2560w"
        sizes="100vw"
        decoding="async"
        alt=""
      />
      <img
        ref={netherRef}
        className="world-img world-nether"
        src="/assets/world/nether-1600.webp"
        srcSet="/assets/world/nether-1080.webp 1080w, /assets/world/nether-1600.webp 1600w, /assets/world/nether-2560.webp 2560w"
        sizes="100vw"
        decoding="async"
        alt=""
      />
      <div className="world-tint" />
    </div>
  )
}
