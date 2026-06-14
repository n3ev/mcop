import { API_URL } from './api.js'

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

export function apiSignup({ email, password, displayName }) {
  return postJson('/auth/signup', { email, password, displayName })
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
