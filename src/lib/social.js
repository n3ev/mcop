import { API_URL } from './api.js'
import { getToken } from './auth.js'

function authPost(path, body) {
  return fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
    body: JSON.stringify(body || {}),
  }).then(async r => {
    const d = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(d.error || 'something went wrong')
    return d
  })
}

export const addFriend = (matchKey) => authPost('/social/friends/add', { matchKey })
export const respondFriend = (fromUserId, accept) => authPost('/social/friends/respond', { fromUserId, accept })
export const blockBuddy = (matchKey) => authPost('/social/block', { matchKey })

export async function getFriends() {
  const r = await fetch(`${API_URL}/social/friends`, { headers: { Authorization: 'Bearer ' + getToken() } })
  if (!r.ok) return { friends: [], pending: [] }
  return r.json()
}
