import { API_URL } from './api.js'
import { getRef } from './attribution.js'

// "play with a friend": an invite link (mcop.world/p/CODE) that the friend
// opens. the key proves which of the two you are; it lives in this browser so
// a refresh finds your invite again.
const KEY = 'mcop_party_v1'

export function loadParty() {
  try { return JSON.parse(localStorage.getItem(KEY) || 'null') } catch { return null }
}
export function saveParty(p) {
  try { localStorage.setItem(KEY, JSON.stringify(p)) } catch { /* private mode */ }
}
export function clearParty() {
  try { localStorage.removeItem(KEY) } catch { /* private mode */ }
}

export const inviteUrl = (code) => `${window.location.origin}/p/${code}`
// "ABC123" -> "ABC 123", easier to read out loud
export const prettyCode = (code) => (code || '').replace(/^(.{3})(.{3})$/, '$1 $2')

async function call(method, path, body) {
  const token = localStorage.getItem('mcop_token')
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) { const e = new Error(data.error || 'something went wrong'); e.status = res.status; e.data = data; throw e }
  return data
}

export const createParty = ({ displayName, mcUsername, age }) => call('POST', '/party', { displayName, mcUsername, age, ref: getRef() })
// confirmMixed: the friend has seen the warning about different age groups and still wants in
export const joinParty = (code, { displayName, mcUsername, age, confirmMixed }) => call('POST', `/party/${encodeURIComponent(code)}/join`, { displayName, mcUsername, age, confirmMixed, ref: getRef() })
export const getParty = (code, key) => call('GET', `/party/${encodeURIComponent(code)}${key ? `?key=${encodeURIComponent(key)}` : ''}`)
export const leaveParty = (code, key) => call('POST', `/party/${encodeURIComponent(code)}/leave`, { key })
// the inviter's "yes, I know them in real life" when the friend is in the other age group
export const confirmParty = (code, key) => call('POST', `/party/${encodeURIComponent(code)}/confirm`, { key })
