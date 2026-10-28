// the FAQ on /help — also baked into /help/index.html as FAQPage structured
// data at build time (vite.config.js), so search results can show the answers
export const COMMON = [
  { q: 'What do I need to play?', a: "Minecraft Java Edition (1.21.4) and a Microsoft account. We whitelist your exact username on a private server. No mods, no launcher tricks. Bedrock isn't supported yet." },
  { q: 'Is it actually free?', a: "Yes. Matching, the private server, and the 30-day world save are all free while we're in beta. Long term we may charge a small fee to keep worlds alive past 30 days. Playing stays free." },
  { q: "What if we don't vibe?", a: 'It happens. Finish the hour or bail early, then hit "don\'t match again" and you\'ll never see each other in the queue again. Swapping socials afterwards is always optional, never required.' },
  { q: 'Can we keep playing after the hour?', a: 'Extend the session by 30 minutes from the session page, and save the world for 30 days free. Jump back in together whenever you both want.' },
  { q: 'Do I need an account?', a: 'No. Guests can jump straight into the queue. An account saves your playstyle, keeps your match history, remembers your buddies, and gets you one-click matching with a verified username.' },
  { q: 'Can I pick who I get matched with?', a: 'Not yet. The random buddy is the whole point. Friends lists already exist, and "play again with a friend" is on the roadmap.' },
  { q: 'Where are the servers?', a: "Sydney, Australia, so Oceania pings are dreamy. It's absolutely playable from elsewhere; block games are forgiving." },
  { q: 'Is it safe to play with a stranger?', a: "You're on a whitelisted private server: just you two, verified usernames only. No personal info is exchanged unless you choose to share socials at the end. Block and report tools are one click away." },
]

export const TROUBLE = [
  { q: "The server says I'm not whitelisted", a: 'Your Minecraft username has to match exactly, capital letters and all. If you recently changed your name, use the new one. Still stuck? Hop back to the start and requeue so we can re-add you.' },
  { q: "I can't connect to the server", a: "Double-check you're on Java Edition 1.21.4, not Bedrock and not an older or newer version. Paste the IP into Multiplayer exactly as shown, with no spaces. If it times out, give it a few seconds and hit refresh; a fresh world takes a moment to spin up." },
  { q: 'My buddy never showed up', a: "If they don't join within ten minutes, we free up the server and put you back at the front of the queue automatically, with priority. You'll get matched again fast, no penalty to you." },
  { q: 'The timer ran out mid-build', a: "You can add 30 minutes from the session page as long as nobody's waiting for a server. Want to come back later instead? Save the world before you leave and it's yours for 30 days." },
  { q: "My loadout or quest didn't appear", a: "Both drop in the first few seconds after you join, announced in chat. If you joined before your buddy, hang tight; some of it waits until you're both in. A quick relog fixes the rest." },
  { q: 'Someone was a jerk', a: 'Rate them down and hit report on the post-session screen. Reports come straight to me with the details, and "don\'t match again" makes sure you never see them in the queue again. Slurs or hate get a permanent ban, no appeals.' },
]
