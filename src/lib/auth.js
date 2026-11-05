import { API_URL } from './api.js'
import { getRef } from './attribution.js'

const TOKEN_KEY = 'mcop_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}
export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

async function postJson(path, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'something went wrong')
  return data
}

export function apiSignup({ email, password, displayName, over13 }) {
  return postJson('/auth/signup', { email, password, displayName, over13, ref: getRef() })
}

export function apiLogin({ email, password }) {
  return postJson('/auth/login', { email, password })
}

export async function apiMe() {
  const token = getToken()
  if (!token) return null
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: 'Bearer ' + token },
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.user
}

// returns { user }
export async function apiSavePreferences(answers) {
  const res = await fetch(`${API_URL}/auth/preferences`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
    body: JSON.stringify({ answers }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'could not save preferences')
  return data
}

// returns { matches, total }
export async function apiGetMatches() {
  const res = await fetch(`${API_URL}/auth/matches`, {
    headers: { Authorization: 'Bearer ' + getToken() },
  })
  if (!res.ok) return { matches: [], total: 0 }
  return res.json()
}

async function authedJson(path, method, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'something went wrong')
  return data
}

// password reset (no auth)
export async function apiForgot(email) {
  await fetch(`${API_URL}/auth/forgot`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }),
  })
  return { ok: true } // always ok, never leak whether the email exists
}
export async function apiReset(token, password) {
  const res = await fetch(`${API_URL}/auth/reset`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'could not reset password')
  return data
}

// email verification
export async function apiVerifyEmail(token) {
  return postJson('/auth/verify-email', { token }) // { ok, user }
}
export const apiResendVerification = () => authedJson('/auth/resend-verification', 'POST', {})

// saved world snapshots
export async function apiGetWorlds() {
  const res = await fetch(`${API_URL}/auth/worlds`, {
    headers: { Authorization: 'Bearer ' + getToken() },
  })
  if (!res.ok) return { worlds: [] }
  return res.json()
}

// download a saved world as a singleplayer-ready .zip (needs the token, so it
// comes down as a blob and is handed to the browser as a file)
export async function apiDownloadWorld(matchKey) {
  const res = await fetch(`${API_URL}/auth/worlds/${encodeURIComponent(matchKey)}/download`, {
    headers: { Authorization: 'Bearer ' + getToken() },
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'could not download that world')
  }
  const name = /filename="([^"]+)"/.exec(res.headers.get('content-disposition') || '')?.[1] || 'MCOP world.zip'
  const url = URL.createObjectURL(await res.blob())
  const a = Object.assign(document.createElement('a'), { href: url, download: name })
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60000)
  return name
}

// account management (auth)
export const apiUpdateProfile = (displayName) => authedJson('/auth/profile', 'PUT', { displayName })
export const apiChangePassword = (currentPassword, newPassword) => authedJson('/auth/change-password', 'POST', { currentPassword, newPassword })
export const apiDeleteAccount = () => authedJson('/auth/account', 'DELETE')
export const apiGetBlocked = () => authedJson('/auth/blocked', 'GET')
export const apiUnblock = (userId) => authedJson('/auth/unblock', 'POST', { userId })
