// plain-language beta policies. clear and honest rather than lawyerly;
// swap for reviewed text (e.g. termly.io) before any big launch.
export function Terms() {
  return (
    <section className="card legal-card">
      <h2>Terms of use</h2>
      <p className="muted small">Last updated October 2026. MCOP is a fan-made community project in beta. Not an official Minecraft service. Not approved by or associated with Mojang or Microsoft.</p>
      <div className="legal-body">
        <h3>The deal</h3>
        <p>MCOP matches you with another player and gives you both access to a private Minecraft server for about an hour. Playing is free. There's an optional paid membership, the Campfire, described below. We can change, pause, or stop the service at any time (it runs on real hardware that occasionally needs sleep).</p>
        <h3>Friend invites</h3>
        <p>An invite link is for one friend and works for 30 minutes. Whoever opens it first takes the seat, so only send it to the person you mean. Friend sessions follow the same house rules as matched ones.</p>
        <h3>Free Campfire weeks</h3>
        <p>When you bring someone who has never played on MCOP before, and the two of you have played together for a while, you can both get free days of the Campfire. It's one newcomer week per person, at most four inviter weeks per person per month, and an unclaimed week expires after 14 days. Free days end on their own and never turn into a paid membership. Using more than one Minecraft account to earn weeks isn't allowed, and we may take back weeks earned that way or change or end the offer.</p>
        <h3>Match nights</h3>
        <p>Match nights are set times when everyone tries to come at once. If you say you'll come, we email you once, about an hour before. Every reminder has an unsubscribe link.</p>
        <h3>Age</h3>
        <p>You must be 13 or older to use MCOP. When you play, you tell us your age group: people under 18 are only ever matched with other under-18s, and adults with adults. A friend invite between an adult and someone under 18 shows both of them a warning first, and only goes ahead if they confirm they know each other in real life. If you see anyone breaking this, report them.</p>
        <h3>Your part</h3>
        <p>Follow the house rules: no griefing your buddy, no slurs or hate, no harassment, no doxing, one account per player with your real Minecraft username. Breaking these gets you banned, permanently for the serious ones. You need to own Minecraft Java Edition; we never ask for your Microsoft or Mojang password.</p>
        <h3>Worlds and saves</h3>
        <p>Session worlds are wiped after each session unless you save them. Saved worlds are kept for about 30 days (for as long as you're a member, if you're in the Campfire) on a best-effort basis, and you can download them while they're kept. Don't store anything precious in a block game: download what matters to you.</p>
        <h3>The Campfire (paid membership)</h3>
        <p>The Campfire is an optional subscription, billed monthly or yearly through Stripe at the price shown before you pay. It renews automatically until you cancel, which you can do any time from your account page; you keep the perks until the end of the period you've paid for. If you're under 18, ask a parent or guardian before buying.</p>
        <p>Its perks are about access (a spot first in line when servers are busy, longer sessions) and looks (cosmetic in-game effects and a mark next to your name). We never sell items, kits, or anything else that changes gameplay, so everyone on a server plays the same game. If we take a perk away or shut MCOP down, we'll refund the unused part of your period. Your rights under Australian Consumer Law always apply; if something's wrong with a charge, contact us and we'll sort it out.</p>
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
      <p className="muted small">Last updated October 2026. Short version: we collect the minimum needed to match you and run the server.</p>
      <div className="legal-body">
        <h3>What we collect</h3>
        <p>Your Minecraft username (to whitelist you), your questionnaire answers (to match you), and, if you give it, an email address (to tell you when a match is ready, or for your account). Accounts also store a display name and a hashed password. We never see or ask for your Microsoft password. If you vote for a game, join a waitlist or say you'll come to a match night, we keep that email for that, and you can unsubscribe from any email we send. Your age group (13 to 17, or 18 or older) is used to match you and is saved only on your account's profile; accounts also record that you confirmed you're 13 or older. We keep the Minecraft usernames that have played on MCOP, so we know who's new when you bring a friend. We count things that happen (a match, an invite, a sign-up) without who did them, and we note a short label for where a visit came from (like "card" for a shared picture), never anything about you. If you join the Campfire, Stripe takes the payment: we store your Stripe customer ID, whether your membership is active and when it renews, and never your card details.</p>
        <h3>What we do with it</h3>
        <p>Matching, whitelisting, session history if you have an account, and the emails you asked for. Reports you file are stored with the match details so we can act on them. We don't sell data, run ads, or use tracking pixels.</p>
        <h3>Where it lives</h3>
        <p>On our own server hardware in Australia, plus Resend (our email provider) for the emails we send you, and Stripe for Campfire payments. Social handles you choose to share go only to your matched buddy.</p>
        <h3>Your choices</h3>
        <p>Play as a guest with just a username. Delete your account any time in Settings, which removes your profile, history, friends and preferences. Email nchavla5@gmail.com for anything else.</p>
      </div>
    </section>
  )
}
