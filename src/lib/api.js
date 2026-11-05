import { getRef } from './attribution.js'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export const API_URL = BASE

// public activity numbers for the landing ticker
export async function fetchActivity() {
  try {
    const res = await fetch(`${BASE}/stats`)
    if (!res.ok) return null
    return res.json() // { online, queue, matchesToday }
  } catch { return null }
}

// a waitlist: just an email. kind is 'bedrock', 'campfire', or a game id
// from src/data/games.js (the vote for what MCOP does next)
export async function joinWaitlist(email, kind = 'bedrock') {
  const res = await fetch(`${BASE}/waitlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, kind, ref: getRef() }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'could not join the waitlist')
  return data
}

export async function joinQueue({ displayName, mcUsername, answers, email }) {
  // read token directly to avoid a circular import with auth.js
  const token = localStorage.getItem('mcop_token')
  const res = await fetch(`${BASE}/queue/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    body: JSON.stringify({ displayName, mcUsername, answers, email, ref: getRef() }),
  })
  if (!res.ok) throw new Error('queue join failed')
  return res.json() // { queueId }
}
