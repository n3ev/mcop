import { useState } from 'react'
import { Link } from 'react-router-dom'
import { GAMES } from '../data/games.js'
import { joinWaitlist } from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { playError, playPop } from '../lib/sound.js'
import Ico from '../components/Ico.jsx'
import { track } from '../lib/track.js'

const VOTED = 'mcop_votes_v1'
const loadVotes = () => { try { return new Set(JSON.parse(localStorage.getItem(VOTED) || '[]')) } catch { return new Set() } }
const saveVotes = (s) => { try { localStorage.setItem(VOTED, JSON.stringify([...s])) } catch { /* private mode */ } }

// what MCOP does next. it's Minecraft-only today; a vote is an email on that
// game's list, so we can tell you the day it's live and only build what people want
export default function Games() {
  const { user } = useAuth()
  const [votes, setVotes] = useState(loadVotes)
  const [typed, setEmail] = useState('')
  const email = user?.email || typed
  const [open, setOpen] = useState(null)
  const [err, setErr] = useState('')

  const vote = async (id) => {
    setErr('')
    if (!email) { setOpen(id); return }
    try {
      await joinWaitlist(email, id)
      const next = new Set(votes); next.add(id)
      setVotes(next); saveVotes(next); setOpen(null)
      track('game_vote', { game: id })
      playPop()
    } catch (e) { setErr(e.message); setOpen(id); playError() }
  }

  return (
    <section className="card games-page">
      <span className="tag">What's next</span>
      <h2>Which game should get a buddy button?</h2>
      <p className="muted">
        MCOP pairs you with someone for an hour of Minecraft. The same idea could work for a lot of
        co-op games, and you get to choose which comes first. Vote with your email on the ones you'd
        actually play, as many as you like, and we'll tell you the day one goes live. No spam.
      </p>
      {!user && (
        <label className="field games-email">
          <span className="field-label">Your email</span>
          <input className="text-input" type="email" placeholder="you@example.com" value={typed} onChange={e => setEmail(e.target.value)} />
        </label>
      )}
      <ul className="games-grid">
        {GAMES.map(g => {
          const voted = votes.has(g.id)
          return (
            <li key={g.id} className={'game-card' + (voted ? ' voted' : '')}>
              <span className="game-icon"><Ico name={g.icon} /></span>
              <h3>{g.name}</h3>
              <p className="muted small">{g.blurb}</p>
              {voted ? (
                <span className="success small">✔ You're on the list</span>
              ) : (
                <button className="btn small" onClick={() => vote(g.id)}>I'd play this</button>
              )}
              {open === g.id && !email && <span className="auth-error small">Add your email above first</span>}
            </li>
          )
        })}
      </ul>
      {err && <p className="auth-error">{err}</p>}
      <p className="muted small games-other">
        Something else? <Link to="/contact" className="inline-link">Tell us which game</Link>. Bedrock
        players: you have <Link to="/contact" className="inline-link">your own list</Link> already.
      </p>
      <p className="muted small">Game names belong to their owners. MCOP isn't connected to any of these games or their makers.</p>
    </section>
  )
}
