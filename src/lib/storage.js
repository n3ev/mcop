// session state helper, will swap for real auth eventually
const KEY = 'mcop_session_v1'

export function saveSession(data) {
  const cur = loadSession()
  localStorage.setItem(KEY, JSON.stringify({ ...cur, ...data }))
}

export function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}')
  } catch { return {} }
}

export function clearSession() {
  localStorage.removeItem(KEY)
}
