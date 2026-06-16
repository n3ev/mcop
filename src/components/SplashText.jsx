import { useMemo } from 'react'

// edit this list freely — fun, MCOP-themed, zero IP concern
export const SPLASHES = [
  'Now with 100% more friends!',
  'Find your player two!',
  'Blocky and cozy!',
  'Press start to make a buddy!',
  'No griefers allowed!',
  'Diamonds optional, friends required!',
  'Two players, one world!',
  'Punch trees together!',
  'Matched in 60 seconds!',
  'Better than digging straight down!',
  'Creeper-free friendships!',
  'Your hour starts now!',
]

export default function SplashText() {
  const splash = useMemo(() => SPLASHES[Math.floor(Math.random() * SPLASHES.length)], [])
  return <span className="hero-splash" aria-hidden="true">{splash}</span>
}
