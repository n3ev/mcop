# MCOP

A React app that pairs two random Minecraft players via a short interest questionnaire, gives them a shared Aternos server for one hour, then offers to swap socials and save their world.

This is the **frontend skeleton** — every screen and flow is wired up. Backend integration points are marked with `// TODO:` comments.

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Build for production

```bash
npm run build
npm run preview   # to test the production build locally
```

## Project layout

```
src/
├── main.jsx                 entry, sets up router
├── App.jsx                  layout shell + routes
├── styles.css               all styling (single file for now)
├── data/
│   ├── fixedQuestions.js    5 questions everyone answers (weight 2)
│   └── variableQuestions.js pool of 20, picks 3 random (weight 1)
├── lib/
│   ├── matching.js          compatibilityScore() + fake partner generator
│   ├── serverPool.js        manual Aternos pool, checkout/release
│   └── storage.js           localStorage session helper
└── pages/
    ├── Landing.jsx
    ├── Questionnaire.jsx    name → 5 fixed → 3 variable
    ├── Matching.jsx         loading phases → reveal partner + score
    ├── Session.jsx          server IP + 1-hour countdown
    └── PostSession.jsx      share socials + save world CTA
```

## How the flow works today

1. **Landing** — single CTA, clears any prior session.
2. **Questionnaire** — collects a display name, then 5 fixed questions, then 3 randomly picked from a pool of 20. Answers stored in `localStorage`.
3. **Matching** — fakes the "finding partner" UX, then generates a synthetic partner whose answers are 70% aligned with yours and shows a compatibility %.
4. **Session** — checks out the next available server from `serverPool.js`, displays IP/port with copy buttons, runs a live 1-hour countdown. At zero, routes to post-session.
5. **PostSession** — releases the server slot back to the pool, offers social share (Discord / Insta / Snap / Steam), offers "save world free for 30 days", and shows the future $3.99/mo paywall placeholder.

## Adding your real Aternos servers

Edit `src/lib/serverPool.js` and replace `SEED_POOL` with your actual server hostnames:

```js
const SEED_POOL = [
  { id: 'srv-1', host: 'your-real-server.aternos.me', port: 25565, world: 'World A', note: 'Vanilla 1.21' },
  // ...
]
```

If you want to reset the local pool state during testing, open browser devtools and run `localStorage.removeItem('mc_match_server_pool_v1')`.

## What's mocked vs real

| Piece | Status | Where to upgrade |
|---|---|---|
| Questionnaire | ✅ Real | — |
| Matching score | ✅ Real algorithm | `src/lib/matching.js` |
| Partner discovery | ⚠️ Faked (single-user) | Needs backend + WebSocket queue |
| Server assignment | ⚠️ Local pool | Move pool to backend DB |
| 1-hour timer | ✅ Real (uses real timestamps) | — |
| Social handle exchange | ⚠️ UI only | Needs backend to store + email |
| World save | ⚠️ UI only | Needs Aternos admin automation |
| Paywall | 🔜 Placeholder text | Stripe + the save flow |

## Next steps toward launch

1. **Backend**: spin up a small Node/Express + Postgres (or Supabase) to handle the matchmaking queue, server pool, and saved socials.
2. **Realtime matching**: add WebSockets (Socket.io is simplest) so two queued players actually find each other.
3. **Email**: SendGrid or Resend to fire "you matched on socials" notifications.
4. **Deploy**: drop this repo on Vercel or Netlify (zero config — both auto-detect Vite). Point your domain at it.
5. **Stripe**: add a $3.99/mo plan and gate the "keep playing past 30 days" CTA on `PostSession.jsx`.

## Deploying to Vercel (fastest path)

```bash
npm i -g vercel
vercel
```

Accept the defaults — Vercel auto-detects Vite. You'll get a public URL in ~30 seconds.
