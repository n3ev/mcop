const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export const API_URL = BASE

export async function joinQueue({ displayName, mcUsername, answers, email }) {
  // read token directly to avoid a circular import with auth.js
  const token = localStorage.getItem('mcop_token')
  const res = await fetch(`${BASE}/queue/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    body: JSON.stringify({ displayName, mcUsername, answers, email }),
  })
  if (!res.ok) throw new Error('queue join failed')
  return res.json() // { queueId }
}
