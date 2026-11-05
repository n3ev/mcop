import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { loadSession, saveSession } from '../lib/storage.js'
import { getSessionState } from '../lib/session.js'
import { claimReward } from '../lib/billing.js'

const date = (ms) => new Date(ms).toLocaleDateString(undefined, { day: 'numeric', month: 'long' })

// the referral week, after the hour: what you got, or a free account to claim it
export default function RewardBanner({ matchId, role }) {
  const { user, setUser } = useAuth()
  const [reward, setReward] = useState(() => loadSession().reward || null)
  const [error, setError] = useState('')

  // it can land after the session page last looked
  useEffect(() => {
    if (!matchId || reward) return
    getSessionState(matchId, role).then(s => {
      if (s?.reward) { setReward(s.reward); saveSession({ reward: s.reward }) }
    })
  }, [matchId])

  // a guest who has just signed up or logged in: claim it for that account
  useEffect(() => {
    if (!user || reward?.status !== 'claimable' || !reward.token) return
    claimReward(reward.token)
      .then(({ until, user: fresh }) => {
        const next = { status: 'claimed', days: reward.days, until }
        setReward(next)
        saveSession({ reward: next })
        setUser(fresh)
      })
      .catch(e => setError(e.message))
  }, [user, reward?.status])

  if (!reward) return null
  let body
  if (reward.status === 'granted' || reward.status === 'claimed') {
    body = <>A free week of the Campfire is yours, until {date(reward.until)}: first in line when it's busy, extra time and embers in-game. <Link to="/campfire" className="inline-link">More</Link></>
  } else if (reward.status === 'claimable') {
    body = user
      ? (error || 'Claiming your free week…')
      : <>You earned a free week of the Campfire. A free account claims it (you have 14 days).{' '}
        <Link to="/signup?next=/post-session" className="btn small primary">Sign up</Link>{' '}
        <Link to="/login?next=/post-session" className="btn small">Log in</Link></>
  } else if (reward.status === 'member') {
    body = "You're already in the Campfire, so there was nothing to add. Your friend got their week."
  } else if (reward.status === 'capped') {
    body = "That's the most free weeks one person can earn in a month. Your friend still got theirs."
  } else if (reward.status === 'had') {
    body = 'This account has already had its newcomer week.'
  } else return null
  return (
    <div className="reward-banner" role="status">
      <span className="campfire-mark" aria-hidden="true">✦</span>
      <span>{body}</span>
    </div>
  )
}
