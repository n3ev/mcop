import { track as vercelTrack } from '@vercel/analytics'
import { API_URL } from './api.js'
import { getRef } from './attribution.js'

// the few moments that tell us whether MCOP is working as a business: invites
// made and taken, checkouts opened, worlds downloaded, games voted for. Vercel
// Analytics custom events (cookieless; no names, emails or ids are sent)
export function track(event, props) {
  try { vercelTrack(event, props) } catch { /* analytics must never break the page */ }
}

// the backend's scoreboard too, for the few things only the page knows about
// (shared cards). fire and forget.
export function trackServer(type, detail) {
  try {
    fetch(`${API_URL}/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, detail, ref: getRef() }),
      keepalive: true,
    }).catch(() => {})
  } catch { /* never mind */ }
}
