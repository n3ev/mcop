// plain-language beta policies. clear and honest rather than lawyerly;
// swap for reviewed text (e.g. termly.io) before any big launch.
export function Terms() {
  return (
    <section className="card legal-card">
      <h2>Terms of use</h2>
      <p className="muted small">Last updated July 2026. MCOP is a fan-made community project in beta, not affiliated with Mojang or Microsoft.</p>
      <div className="legal-body">
        <h3>The deal</h3>
        <p>MCOP matches you with another player and gives you both access to a private Minecraft server for about an hour. It's free while in beta. We can change, pause, or stop the service at any time (it runs on real hardware that occasionally needs sleep).</p>
        <h3>Your part</h3>
        <p>Follow the house rules: no griefing your buddy, no slurs or hate, no harassment, no doxing, one account per player with your real Minecraft username. Breaking these gets you banned, permanently for the serious ones. You need to own Minecraft Java Edition; we never ask for your Microsoft or Mojang password.</p>
        <h3>Worlds and saves</h3>
        <p>Session worlds are wiped after each session unless you save them. Saved worlds are kept for about 30 days on a best-effort basis. Don't store anything precious in a block game.</p>
        <h3>No warranties</h3>
        <p>The service is provided as-is, with no guarantees of uptime, matches, or compatible buddies. To the maximum extent allowed by law, we're not liable for losses arising from using MCOP.</p>
        <h3>Minecraft</h3>
        <p>Minecraft is a trademark of Mojang Synergies AB. MCOP is an independent fan project and follows Mojang's usage guidelines for community servers.</p>
      </div>
    </section>
  )
}

export function Privacy() {
  return (
    <section className="card legal-card">
      <h2>Privacy</h2>
      <p className="muted small">Last updated July 2026. Short version: we collect the minimum needed to match you and run the server.</p>
      <div className="legal-body">
        <h3>What we collect</h3>
        <p>Your Minecraft username (to whitelist you), your questionnaire answers (to match you), and, if you give it, an email address (to tell you when a match is ready, or for your account). Accounts also store a display name and a hashed password. We never see or ask for your Microsoft password.</p>
        <h3>What we do with it</h3>
        <p>Matching, whitelisting, session history if you have an account, and the emails you asked for. Reports you file are stored with the match details so we can act on them. We don't sell data, run ads, or use tracking pixels.</p>
        <h3>Where it lives</h3>
        <p>On our own server hardware in Australia, plus Resend (our email provider) for the emails we send you. Social handles you choose to share go only to your matched buddy.</p>
        <h3>Your choices</h3>
        <p>Play as a guest with just a username. Delete your account any time in Settings, which removes your profile, history, friends and preferences. Email nchavla5@gmail.com for anything else.</p>
      </div>
    </section>
  )
}
