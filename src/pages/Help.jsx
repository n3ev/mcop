import { Link } from 'react-router-dom'

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
                <span className="hour-icon" aria-hidden="true">☕</span>
                <h3 className="hour-title">Java 1.21.4</h3>
                <p className="hour-desc">Minecraft Java Edition on version 1.21.4, plus the Microsoft account you already log in with. Bedrock isn't supported yet.</p>
              </div>
              <div className="hour-card">
                <span className="hour-icon" aria-hidden="true">🪪</span>
                <h3 className="hour-title">Your exact username</h3>
                <p className="hour-desc">We whitelist the precise in-game name you give us. No mods, no launcher tricks, nothing to install.</p>
              </div>
              <div className="hour-card">
                <span className="hour-icon" aria-hidden="true">🕐</span>
                <h3 className="hour-title">A spare hour</h3>
                <p className="hour-desc">Sessions run 60 minutes, extendable by 30. Save the world for 30 days if you want to come back.</p>
              </div>
              <div className="hour-card">
                <span className="hour-icon" aria-hidden="true">🎧</span>
                <h3 className="hour-title">Optional: a mic</h3>
                <p className="hour-desc">Plenty of pairs play in silence and just build. Swap Discords at the end only if you both want to.</p>
              </div>
            </div>
          </div>

          <div className="frame reviews-section">
            <p className="section-eyebrow">Common questions</p>
            <div className="faq-list">
              <details className="faq">
                <summary>What do I need to play?</summary>
                <p className="faq-a">Minecraft Java Edition (1.21.4) and a Microsoft account. We whitelist your exact username on a private server. No mods, no launcher tricks. Bedrock isn't supported yet.</p>
              </details>
              <details className="faq">
                <summary>Is it actually free?</summary>
                <p className="faq-a">Yes. Matching, the private server, and the 30-day world save are all free while we're in beta. Long term we may charge a small fee to keep worlds alive past 30 days. Playing stays free.</p>
              </details>
              <details className="faq">
                <summary>What if we don't vibe?</summary>
                <p className="faq-a">It happens. Finish the hour or bail early, then hit "don't match again" and you'll never see each other in the queue again. Swapping socials afterwards is always optional, never required.</p>
              </details>
              <details className="faq">
                <summary>Can we keep playing after the hour?</summary>
                <p className="faq-a">Extend the session by 30 minutes from the session page, and save the world for 30 days free. Jump back in together whenever you both want.</p>
              </details>
              <details className="faq">
                <summary>Do I need an account?</summary>
                <p className="faq-a">No. Guests can jump straight into the queue. An account saves your playstyle, keeps your match history, remembers your buddies, and gets you one-click matching with a verified username.</p>
              </details>
              <details className="faq">
                <summary>Can I pick who I get matched with?</summary>
                <p className="faq-a">Not yet. The random buddy is the whole point. Friends lists already exist, and "play again with a friend" is on the roadmap.</p>
              </details>
              <details className="faq">
                <summary>Where are the servers?</summary>
                <p className="faq-a">Sydney, Australia, so Oceania pings are dreamy. It's absolutely playable from elsewhere; block games are forgiving.</p>
              </details>
              <details className="faq">
                <summary>Is it safe to play with a stranger?</summary>
                <p className="faq-a">You're on a whitelisted private server: just you two, verified usernames only. No personal info is exchanged unless you choose to share socials at the end. Block and report tools are one click away.</p>
              </details>
            </div>
          </div>
        </div>
      </section>

      {/* ── troubleshooting ── */}
      <section className="stratum-stone">
        <div className="wrap frame" style={{ maxWidth: 900 }}>
          <p className="section-eyebrow">If something's off</p>
          <div className="faq-list">
            <details className="faq">
              <summary>The server says I'm not whitelisted</summary>
              <p className="faq-a">Your Minecraft username has to match exactly, capital letters and all. If you recently changed your name, use the new one. Still stuck? Hop back to the start and requeue so we can re-add you.</p>
            </details>
            <details className="faq">
              <summary>I can't connect to the server</summary>
              <p className="faq-a">Double-check you're on Java Edition 1.21.4, not Bedrock and not an older or newer version. Paste the IP into Multiplayer exactly as shown, with no spaces. If it times out, give it a few seconds and hit refresh; a fresh world takes a moment to spin up.</p>
            </details>
            <details className="faq">
              <summary>My buddy never showed up</summary>
              <p className="faq-a">If they don't join within ten minutes, we free up the server and put you back at the front of the queue automatically, with priority. You'll get matched again fast, no penalty to you.</p>
            </details>
            <details className="faq">
              <summary>The timer ran out mid-build</summary>
              <p className="faq-a">You can add 30 minutes from the session page as long as nobody's waiting for a server. Want to come back later instead? Save the world before you leave and it's yours for 30 days.</p>
            </details>
            <details className="faq">
              <summary>My loadout or quest didn't appear</summary>
              <p className="faq-a">Both drop in the first few seconds after you join, announced in chat. If you joined before your buddy, hang tight; some of it waits until you're both in. A quick relog fixes the rest.</p>
            </details>
            <details className="faq">
              <summary>Someone was a jerk</summary>
              <p className="faq-a">Rate them down and hit report on the post-session screen. Reports come straight to me with the details, and "don't match again" makes sure you never see them in the queue again. Slurs or hate get a permanent ban, no appeals.</p>
            </details>
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
