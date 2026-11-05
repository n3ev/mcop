import { Link } from 'react-router-dom'
import Ico from '../components/Ico.jsx'
import { COMMON, TROUBLE } from '../data/faq.js'

// everything a new or cautious player needs: FAQ, house rules, requirements
export default function Help() {
  return (
    <div className="cross-section">
      <h1 className="sr-only">MCOP help: frequently asked questions and house rules</h1>

      {/* ── requirements + FAQ ── */}
      <section className="stratum-surface">
        <div className="pair">
          <div className="frame how-section">
            <p className="section-eyebrow">Before you play</p>
            <div className="hour-grid">
              <div className="hour-card">
                <span className="hour-icon"><Ico name="block:grass-side" /></span>
                <h3 className="hour-title">Java 1.21.4</h3>
                <p className="hour-desc">Minecraft Java Edition on version 1.21.4, plus the Microsoft account you already log in with. Bedrock isn't supported yet.</p>
              </div>
              <div className="hour-card">
                <span className="hour-icon"><Ico name="name_tag" /></span>
                <h3 className="hour-title">Your exact username</h3>
                <p className="hour-desc">We whitelist the precise in-game name you give us. No mods, no launcher tricks, nothing to install.</p>
              </div>
              <div className="hour-card">
                <span className="hour-icon"><Ico name="clock_00" /></span>
                <h3 className="hour-title">A spare hour</h3>
                <p className="hour-desc">Sessions run 60 minutes, extendable by 30. Save the world and download it if you want to keep it.</p>
              </div>
              <div className="hour-card">
                <span className="hour-icon"><Ico name="music_disc_cat" /></span>
                <h3 className="hour-title">Optional: a mic</h3>
                <p className="hour-desc">Plenty of pairs play in silence and just build. Swap Discords at the end only if you both want to.</p>
              </div>
            </div>
          </div>

          <div className="frame reviews-section">
            <p className="section-eyebrow">Common questions</p>
            <div className="faq-list">
              {COMMON.map(f => (
                <details className="faq" key={f.q}>
                  <summary>{f.q}</summary>
                  <p className="faq-a">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── troubleshooting ── */}
      <section className="stratum-stone">
        <div className="wrap frame" style={{ maxWidth: 900 }}>
          <p className="section-eyebrow">If something's off</p>
          <div className="faq-list">
            {TROUBLE.map(f => (
              <details className="faq" key={f.q}>
                <summary>{f.q}</summary>
                <p className="faq-a">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── house rules ── */}
      <section className="stratum-deep">
        <div className="wrap frame" style={{ maxWidth: 720 }}>
          <p className="section-eyebrow">House rules</p>
          <ul className="rules-list">
            <li>Be cool. You're someone's hour of Minecraft today.</li>
            <li>No griefing your buddy. You're on the same team.</li>
            <li>Slurs or hate = instant, permanent ban. Zero appeals.</li>
            <li>What happens on the server stays there. No doxing, no drama.</li>
            <li>One account per player, real usernames only.</li>
          </ul>
          <p className="muted small" style={{ marginTop: 18 }}>
            Something went wrong in a session? <Link to="/contact" className="inline-link">Report it here</Link> and it lands straight in my inbox.
          </p>
        </div>

        <Link to="/contact" className="descend-link">▼ Still stuck? Get in touch ▼</Link>
      </section>
    </div>
  )
}
