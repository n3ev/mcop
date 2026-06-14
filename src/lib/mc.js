import { API_URL } from './api.js'
import { getToken } from './auth.js'

async function authPost(path, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + getToken(),
    },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'something went wrong')
  return data
}

async function authGet(path) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: 'Bearer ' + getToken() },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'something went wrong')
  return data
}

// returns { serverHost }
export const linkStart = (username) => authPost('/mc/link/start', { username })
// returns { user }
export const linkVerify = (code) => authPost('/mc/link/verify', { code })
// returns { pending, codeSent }
export const linkStatus = () => authGet('/mc/link/status')
