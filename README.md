# mcop

minecraft matchmaking. answer a few questions about how you play, get paired with someone who plays the same way, and share a private server for an hour. free.

live at [mcop.world](https://mcop.world)

## what it does

you fill out a short questionnaire (game mode, playstyle, experience, voice chat, how long you've got), the backend queues you up and pairs you with the best-scoring match in the queue. both usernames get whitelisted on a fresh paper server, a quest for the hour and your starting loadouts drop in chat, and you can add 30 minutes or save the world for 30 days. afterwards you rate your buddy and, only if you both want to, swap discords.

guests can play straight away; an account saves your playstyle, links and verifies your minecraft username, and keeps your match history, friends and saved worlds.

built this because finding a minecraft buddy on reddit takes forever and most posts go unanswered.

## the site is a world

the whole site is a cut-away of a minecraft world you scroll down through, sky to bedrock:

- **the night world** is my 4k fly-through, rebuilt as gpu parallax layers (the cut face, landscape bands and trees at their own measured speeds, and the stars, which turn with the clip's time). `tools/world/build_night_layers.py` makes it from the video. flip the lever for day.
- **mining**: ore veins sit in the cave walls of every page at the depth they belong. hold one down to mine it; drops go in a real hotbar, pickaxes go stone → iron → diamond → netherite.
- **advancements**: 29 of them across three tabs, with the game's toasts.
- **secrets**: press `/` for a command bar (`/weather thunder`, `/summon dragon`, `/ride minecart`, `/nether`...), type words, try old codes.

## stack

- frontend: react + vite + plain css, deployed on vercel
- backend: node + express + socket.io + sqlite, self-hosted on my pc ([mcop-server](https://github.com/n3ev/mcop-server), private)
- minecraft: paper 1.21.4, exposed via playit.gg
- api tunnel: cloudflare tunnel (api.mcop.world)

## running it

```
npm install
VITE_API_URL=http://localhost:3001 npm run dev
```

without a backend the site still runs; matchmaking says it can't connect.

`npm run build` also writes a static copy of `index.html` per public page (`src/data/seo.js`) so search engines and link previews get the right title and description.

## layout

```
src/
  pages/          one per route
  components/     WorldBackdrop (the night layers), OreLayer + Hotbar (mining),
                  Achievements + Toasts, EasterEggs, ServerStatus, ChatReplay ...
  lib/            api, auth, achievements, mining, scroll, particles, worldfx ...
  data/           questions, faq, seo (titles + descriptions per page)
tools/
  world/          builds the night world's layers from the video
  brand/          builds the link preview card (public/og.png)
public/assets/    world layers, textures, fonts, audio, logo
```

## adding more servers

see `ops/README.md` in mcop-server: `ops/add-server.sh` sets up the next one (folder, ports, service) and walks you through its playit tunnel.

---

made by neev - discord: neev1198
