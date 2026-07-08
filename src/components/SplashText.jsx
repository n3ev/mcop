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
  'Also try single... no wait, don\'t!',
  'It\'s dangerous to go alone!',
  'Emeralds not required!',
  'Made in Sydney!',
  'The queue is warm!',
  'Bring a friend home from the mines!',
  'One hour. Infinite blocks.',
  'Whitelisted with love!',
  // ── nudges toward the secrets ──
  'This site is FULL of secrets!',
  'Try typing a word... any word?',
  'Press / for a little chaos!',
  'More easter eggs than a village chest!',
  'Have you found the rare one yet?',
  'Right-click something. Go on.',
  'Ten secrets and counting...',
  'Say the shiny word out loud!',
  'The Awards tab hides more than you think!',
  'Up up down down...',
  'Some words summon things...',
  'Herobrine was never removed!',
  'Check the sky. Click it maybe.',
]

// deterministic pick for the day so the splash is stable across a session's
// re-renders but still rotates day to day — plus a rare 1-in-40 golden one.
export default function SplashText() {
  const splash = useMemo(() => {
    if (Math.random() < 1 / 40) return '† Herobrine sends his regards †'
    const day = Math.floor(Date.now() / 86400000)
    const seed = (day * 2654435761) >>> 0
    return SPLASHES[seed % SPLASHES.length]
  }, [])
  return <span className="hero-splash" aria-hidden="true">{splash}</span>
}
