// where a visitor first came from: ?ref=card (someone's shared recap card),
// ?ref=reel, ?ref=night (a reminder email)… the first one is kept in this
// browser and sent along when they queue, invite, RSVP or sign up, so the
// scoreboard can say which channel brings players. a short label, never
// anything about the person.
const KEY = 'mcop_ref_v1'
const RE = /^[a-z0-9][a-z0-9-]{0,23}$/

export function captureRef() {
  try {
    const p = new URLSearchParams(window.location.search)
    const v = (p.get('ref') || p.get('utm_source') || '').trim().toLowerCase()
    if (RE.test(v) && !localStorage.getItem(KEY)) localStorage.setItem(KEY, v)
  } catch { /* private mode: no attribution, no problem */ }
}

export function getRef() {
  try { return localStorage.getItem(KEY) || undefined } catch { return undefined }
}
