import { API_URL } from './api.js'
import { getRef } from './attribution.js'

// match nights: a couple of set times a week when everyone queues at once
// (the backend's MATCH_NIGHTS). shown here in the visitor's own time zone.
export async function getNights() {
  try {
    const res = await fetch(`${API_URL}/nights`)
    return res.ok ? await res.json() : null
  } catch { return null }
}

export async function rsvpNight(start, email) {
  const token = localStorage.getItem('mcop_token')
  const res = await fetch(`${API_URL}/nights/rsvp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: JSON.stringify({ start, email, ref: getRef() }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'could not save that')
  return data
}

// "Friday 7:00 pm" in the reader's time zone
export const nightWhen = (ms) => new Intl.DateTimeFormat(undefined, { weekday: 'long', hour: 'numeric', minute: '2-digit' }).format(ms)
export const clockTime = (ms) => new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(ms)

export function untilText(ms, now = Date.now()) {
  const mins = Math.round((ms - now) / 60000)
  if (mins < 1) return 'starting now'
  if (mins < 60) return `in ${mins} minute${mins === 1 ? '' : 's'}`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `in ${hours} hour${hours === 1 ? '' : 's'}`
  const days = Math.round(hours / 24)
  return `in ${days} day${days === 1 ? '' : 's'}`
}

// an .ics file for one night, with a reminder 15 minutes before
export function downloadIcs(night) {
  const t = (ms) => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const url = 'https://mcop.world/questionnaire?ref=calendar'
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//MCOP//Match night//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:mcop-night-${night.start}@mcop.world`,
    `DTSTAMP:${t(Date.now())}`,
    `DTSTART:${t(night.start)}`,
    `DTEND:${t(night.end)}`,
    'SUMMARY:MCOP match night',
    `DESCRIPTION:When everyone tries to come at once\\, so you're more likely to get a Minecraft buddy. ${url}`,
    `URL:${url}`,
    'BEGIN:VALARM', 'TRIGGER:-PT15M', 'ACTION:DISPLAY', 'DESCRIPTION:MCOP match night in 15 minutes', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ]
  const blob = new Blob([lines.join('\r\n') + '\r\n'], { type: 'text/calendar' })
  const href = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), { href, download: 'mcop-match-night.ics' })
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(href), 30000)
}
