# mcop

minecraft matchmaking. answer 9 questions about how you play, get paired with someone compatible, jump into a private server together for an hour. free, no account needed.

live at [mcop.world](https://mcop.world)

## what it does

you fill out a short questionnaire (playstyle, game mode, experience, voice chat etc), the backend queues you up and matches you with someone whose answers line up with yours. both players get the address for a private paper server and have an hour together. optionally swap discords at the end.

built this because finding a minecraft buddy on reddit takes forever and most posts go unanswered.

## stack

- frontend: react + vite + plain css, deployed on vercel
- backend: node + express + socket.io, self-hosted on my pc
- minecraft: paper 1.21.4, exposed via playit.gg
- api tunnel: cloudflare tunnel (api.mcop.world)


## project layout

```
src/
  data/
    fixedQuestions.js     questions everyone answers
    variableQuestions.js  pool of 50, picks 3 random bonus ones per session
  lib/
    matching.js           compatibility scoring + fake partner for solo demo
    storage.js            localstorage session wrapper
    api.js                api client
    serverPool.js         old placeholder, not used anymore
  pages/
    Landing.jsx
    Questionnaire.jsx
    Matching.jsx
    Waiting.jsx
    Session.jsx
    PostSession.jsx
  components/
    BugReport.jsx         bug report modal
mcop-server/
  index.js               express + socket.io backend
```

## what works

- questionnaire + compatibility algorithm
- real-time matching via websockets
- real paper server assigned on match
- rcon whitelist so only matched players can join
- 1 hour countdown timer
- world resets automatically after each session
- everything auto-starts on boot

## still todo

- email notifications (resend, not wired up yet)
- social handle exchange is ui only right now
- world save after session is ui only
- bedrock not supported, java only for now

## adding more servers

1. copy the mcop-minecraft folder
2. change the port in server.properties
3. create a new playit.gg tunnel pointing at that port
4. set up a new systemd service for it
5. uncomment the second entry in SERVER_POOL in mcop-server/index.js and fill in the tunnel url

---

made by neev - discord: neev1198
