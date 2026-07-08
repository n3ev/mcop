import { Link } from 'react-router-dom'
import Reviews from '../components/Reviews.jsx'
import BedrockWaitlist from '../components/BedrockWaitlist.jsx'

// the story layer: why this exists, how it really works, where it's going
export default function About() {
  return (
    <div className="cross-section">
      <h1 className="sr-only">About MCOP: the story, the machinery, and the roadmap</h1>

      {/* ── the story + the quest board ── */}
      <section className="stratum-surface">
        <div className="pair">
          <div className="frame how-section">
            <p className="section-eyebrow">Why MCOP exists</p>
            <div className="story-copy">
              <p>I'm a uni student in Sydney who kept hitting the same wall: a world of your own gets old fast, and finding someone to share one with was miserable. Forum posts that died in silence. Discord servers full of strangers talking past each other. Friends who "totally would" but never log on.</p>
              <p>So I built the thing I wanted: press one button, get a real person who plays like you do, and be punching trees together inside a minute. No small talk required. The game is the small talk.</p>
              <p className="story-sign">Neev, somewhere in a mineshaft</p>
            </div>
          </div>

          <div className="frame how-section">
            <p className="section-eyebrow">Quests from the board</p>
            <p className="muted" style={{ margin: '0 auto 18px' }}>
              Every session rolls a shared quest. The kind of thing you'll see:
            </p>
            <div className="chip-row" style={{ justifyContent: 'center' }}>
              <span className="chip quest-chip">🌾 Build a wheat farm before the hour ends</span>
              <span className="chip quest-chip">⛏️ Full iron armour before sunset</span>
              <span className="chip quest-chip">🏘️ Find a village and rob... trade with it</span>
              <span className="chip quest-chip">🌉 Bridge a ravine, no scaffolding deaths</span>
              <span className="chip quest-chip">🔥 Light a nether portal together</span>
              <span className="chip quest-chip">🐄 Two cows, one boat. Good luck</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── how the matching actually works ── */}
      <section className="stratum-surface">
        <div className="pair">
          <div className="frame how-section">
            <p className="section-eyebrow">What we ask</p>
            <ul className="ask-list">
              <li><strong>Game mode</strong> — survival, creative, or somewhere in between.</li>
              <li><strong>Playstyle</strong> — builder, explorer, redstone brain, fighter, or just chilling.</li>
              <li><strong>Experience</strong> — first week or thousand-hour veteran.</li>
              <li><strong>Vibe</strong> — chatty and social, or heads-down and building.</li>
              <li><strong>How long you've got</strong> — matched right now, or notified when someone shows up.</li>
            </ul>
            <p className="muted small" style={{ marginTop: 16 }}>
              No account needed to answer. Sign up and we remember it for next time.
            </p>
          </div>

          <div className="frame how-section">
            <p className="section-eyebrow">How the match is scored</p>
            <div className="score-steps">
              <div className="score-step"><span className="score-num">1</span><p>Every answer you share adds to a compatibility score between you and everyone else in the queue.</p></div>
              <div className="score-step"><span className="score-num">2</span><p>The questions that matter most, like game mode and playstyle, count double. The lighter ones count once.</p></div>
              <div className="score-step"><span className="score-num">3</span><p>When people are waiting, we compare every possible pairing and take the highest-scoring one, not just the first two in line.</p></div>
              <div className="score-step"><span className="score-num">4</span><p>Blocked someone, or bailed on a session? You two will never land in the same match again.</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* ── the machinery + the players ── */}
      <section className="stratum-stone">
        <div className="pair">
          <div className="frame how-section">
            <p className="section-eyebrow">Under the hood</p>
            <div className="hour-grid">
              <div className="hour-card">
                <span className="hour-icon" aria-hidden="true">⏱️</span>
                <h3 className="hour-title">Patience tiers</h3>
                <p className="hour-desc">"Right now" matches fastest. Willing to wait? We hold your spot and email you.</p>
              </div>
              <div className="hour-card">
                <span className="hour-icon" aria-hidden="true">⚖️</span>
                <h3 className="hour-title">Weighted answers</h3>
                <p className="hour-desc">Core questions weigh double. A chatty builder won't get a silent speedrunner.</p>
              </div>
              <div className="hour-card">
                <span className="hour-icon" aria-hidden="true">🔐</span>
                <h3 className="hour-title">Whitelist, not luck</h3>
                <p className="hour-desc">The server only admits the two exact usernames in your match.</p>
              </div>
              <div className="hour-card">
                <span className="hour-icon" aria-hidden="true">🌱</span>
                <h3 className="hour-title">Fresh worlds</h3>
                <p className="hour-desc">Every session spawns a clean world, unless you save yours for 30 days, free.</p>
              </div>
            </div>
          </div>

          <Reviews />
        </div>
      </section>

      {/* ── the roadmap ── */}
      <section className="stratum-mineshaft">
        <div className="wrap frame" style={{ maxWidth: 860 }}>
          <p className="section-eyebrow">Mining next</p>
          <div className="hour-grid">
            <div className="hour-card">
              <span className="mc-badge">digging now</span>
              <h3 className="hour-title" style={{ marginTop: 10 }}>Play again</h3>
              <p className="hour-desc">Reconnect with a past buddy from your friends list.</p>
            </div>
            <div className="hour-card">
              <span className="mc-badge">surveyed</span>
              <h3 className="hour-title" style={{ marginTop: 10 }}>Bedrock support</h3>
              <p className="hour-desc">Java only for now. On Bedrock? Leave your email and you'll be first to know.</p>
              <BedrockWaitlist />
            </div>
          </div>
          <ul className="patch-list shipped-list">
            <li><span className="patch-date">Jul 2026</span> Smarter matchmaking, no-show requeue, saved worlds page, email verification.</li>
            <li><span className="patch-date">Jul 2026</span> World saves, buddy ratings and reports went live.</li>
            <li><span className="patch-date">Jul 2026</span> The big redesign: the world you're scrolling through.</li>
            <li><span className="patch-date">Jun 2026</span> Loadouts, social swap, friends, account linking, accounts.</li>
            <li><span className="patch-date">Always</span> Removed Herobrine.</li>
          </ul>
        </div>

        <Link to="/help" className="descend-link">▼ Keep descending: questions and house rules ▼</Link>
      </section>
    </div>
  )
}
