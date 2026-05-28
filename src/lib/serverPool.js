// old aternos placeholder - server pool is managed by the backend now
// keeping this around because postsession still references it but it doesn't really do anything useful anymore

const SEED_POOL = [
  { id: 'srv-1', host: 'mcmatch-alpha.aternos.me',   port: 25565, world: 'Alpha',   note: 'Vanilla 1.20' },
  { id: 'srv-2', host: 'mcmatch-bravo.aternos.me',   port: 25565, world: 'Bravo',   note: 'Vanilla 1.20' },
  { id: 'srv-3', host: 'mcmatch-charlie.aternos.me', port: 25565, world: 'Charlie', note: 'Vanilla 1.21' },
  { id: 'srv-4', host: 'mcmatch-delta.aternos.me',   port: 25565, world: 'Delta',   note: 'Vanilla 1.21' },
  { id: 'srv-5', host: 'mcmatch-echo.aternos.me',    port: 25565, world: 'Echo',    note: 'Vanilla 1.21' },
]

const LS_KEY = 'mcop_server_pool_v1'

function load() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch { return null }
}

function save(state) {
  localStorage.setItem(LS_KEY, JSON.stringify(state))
}

function ensureSeeded() {
  let state = load()
  if (!state) {
    state = { servers: SEED_POOL.map(s => ({ ...s, inUse: false })) }
    save(state)
  }
  return state
}

export function checkoutServer() {
  const state = ensureSeeded()
  const idx = state.servers.findIndex(s => !s.inUse)
  if (idx === -1) return null
  state.servers[idx].inUse = true
  save(state)
  return state.servers[idx]
}

export function releaseServer(serverId) {
  const state = ensureSeeded()
  const s = state.servers.find(s => s.id === serverId)
  if (s) {
    s.inUse = false
    save(state)
  }
}

export function resetPool() {
  localStorage.removeItem(LS_KEY)
}
