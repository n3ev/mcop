import { useState } from 'react'
import { joinWaitlist } from '../lib/api.js'
import { playXp, playError } from '../lib/sound.js'

// bedrock players can leave an email for when (if) cross-play lands
export default function BedrockWaitlist() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState('idle') // idle | busy | done | error
  const submit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setState('busy')
    try { await joinWaitlist(email.trim()); setState('done'); playXp() }
    catch { setState('error'); playError() }
  }
  if (state === 'done') return <p className="success small">You're on the list. I'll email you if Bedrock happens.</p>
  return (
    <form className="wl-form" onSubmit={submit}>
      <input
        className="text-input wl-input"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
        aria-label="Email for the Bedrock waitlist"
      />
      <button className="btn small primary" type="submit" disabled={state === 'busy' || !email.trim()}>
        {state === 'busy' ? '…' : 'Notify me'}
      </button>
      {state === 'error' && <p className="auth-error small">That didn't work, is the email right?</p>}
    </form>
  )
}
