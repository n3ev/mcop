import { API_URL } from './api.js'

// share a social handle with your buddy. token attached if logged in so it saves to history.
export async function shareContact({ matchId, role, platform, handle }) {
  const token = localStorage.getItem('mcop_token')
  const res = await fetch(`${API_URL}/session/share`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: JSON.stringify({ matchId, role, platform, handle }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'could not share')
  return data // { partner }
}

export async function getPartnerContact(matchId, role) {
  const res = await fetch(`${API_URL}/session/partner?matchId=${encodeURIComponent(matchId)}&role=${role}`)
  if (!res.ok) return { partner: null }
  return res.json()
}

// live session state: quest, who's in-game, when it ends
export async function getSessionState(matchId, role) {
  try {
    const res = await fetch(`${API_URL}/session/state?matchId=${encodeURIComponent(matchId)}&role=${role}`)
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}

// run a safe in-game action (day | clear | tp)
export async function sessionCommand(matchId, role, action) {
  const res = await fetch(`${API_URL}/session/command`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ matchId, role, action }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'could not do that')
  return data
}

// extend the session by 30 minutes (returns new endsAt)
export async function extendSession(matchId, role) {
  const res = await fetch(`${API_URL}/session/extend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ matchId, role }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'could not extend')
  return data
}
