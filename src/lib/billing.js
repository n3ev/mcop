import { API_URL } from './api.js'

// the Campfire membership. prices come from the backend, which reads them from
// Stripe, so the page always shows what the checkout will charge.
const auth = () => { const t = localStorage.getItem('mcop_token'); return t ? { Authorization: 'Bearer ' + t } : {} }

export async function getBillingConfig() {
  try {
    const res = await fetch(`${API_URL}/billing/config`)
    if (!res.ok) return { enabled: false, prices: null }
    return await res.json()
  } catch { return { enabled: false, prices: null, offline: true } }
}

async function post(path, body) {
  const res = await fetch(`${API_URL}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...auth() }, body: JSON.stringify(body || {}) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) { const e = new Error(data.error || 'something went wrong'); e.manage = !!data.manage; throw e }
  return data
}

// both return { url } on Stripe's own pages
export const startCheckout = (interval) => post('/billing/checkout', { interval })
export const openBillingPortal = () => post('/billing/portal')

// 400 cents in usd -> "US$4" / "$4.00" in the reader's locale
export function money(p, { perMonthOf } = {}) {
  if (!p) return null
  const amount = (perMonthOf ? p.amount / perMonthOf : p.amount) / 100
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: p.currency.toUpperCase(), minimumFractionDigits: amount % 1 ? 2 : 0, maximumFractionDigits: 2 }).format(amount)
  } catch { return `${amount.toFixed(2)} ${p.currency.toUpperCase()}` }
}

// a free referral week earned as a guest, claimed now that they're signed in
export async function claimReward(token) {
  return post('/rewards/claim', { token }) // { until, user }
}
