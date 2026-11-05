import { useEffect, useState } from 'react'
import { getBillingConfig } from '../lib/billing.js'

// the "bring someone new, you both get a free week" offer, in one line,
// straight from the backend's settings (and nothing at all if it's off)
let cached = null
export default function ReferralNote({ newcomer = false }) {
  const [ref, setRef] = useState(cached)
  useEffect(() => {
    if (cached) return
    getBillingConfig().then(c => { cached = c.referral || false; setRef(cached) })
  }, [])
  if (!ref) return null
  const mins = Math.max(1, Math.round(ref.minutes))
  return (
    <p className="referral-note">
      <span className="campfire-mark" aria-hidden="true">✦</span>
      {newcomer
        ? `New to MCOP? Play ${mins} minute${mins === 1 ? '' : 's'} together and you both get a free week of the Campfire.`
        : `Bring someone new to MCOP: once you've played ${mins} minute${mins === 1 ? '' : 's'} together, you both get a free week of the Campfire.`}
    </p>
  )
}
