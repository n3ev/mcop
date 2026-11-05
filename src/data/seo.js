// what each page is called in the tab, in search results and in link
// previews. App.jsx sets the tab title from it; vite.config.js bakes the
// public ones (`page: true`) into their own copy of index.html at build time,
// so crawlers and link previews see the right title and description too.
export const SITE = 'https://mcop.world'

export const PAGES = {
  '/': {
    page: true,
    title: 'MCOP: Find a Minecraft buddy',
    description: 'Get matched with a Minecraft player who plays like you and share a private server for an hour. Answer a few questions, get matched in about a minute. Free.',
  },
  '/about': {
    page: true,
    title: 'About · MCOP',
    description: 'Why MCOP exists, how the matchmaking scores your answers, and what you get in your hour: a private server, quests, a build battle, a redstone lab, starting loadouts, and a world save you can download.',
  },
  '/help': {
    page: true,
    title: 'Help & FAQ · MCOP',
    description: 'What you need to play (Minecraft Java 1.21.4), how matching works, what happens if your buddy never shows, and the house rules.',
  },
  '/contact': {
    page: true,
    title: 'Contact · MCOP',
    description: 'Bugs, ideas, reports or just hi. MCOP is built and run by one person in Sydney who reads every message.',
  },
  '/questionnaire': {
    page: true,
    title: 'Find a buddy · MCOP',
    description: 'Answer a few quick questions about how you play Minecraft and get matched with a buddy for an hour on a private server.',
  },
  '/signup': {
    page: true,
    title: 'Sign up · MCOP',
    description: 'Save your playstyle, keep your match history and get one-click matching with a verified Minecraft username.',
  },
  '/invite': {
    page: true,
    title: 'Play with a friend · MCOP',
    description: 'Make an invite link, send it to a friend, and get a free private Minecraft server for the two of you for an hour, with quests, a build battle and a redstone lab.',
  },
  '/campfire': {
    page: true,
    title: 'The Campfire · MCOP',
    description: 'Chip in to keep MCOP free. Members get longer sessions, a spot first in line when servers are busy, and cosmetic embers in-game. Nothing that changes gameplay.',
  },
  '/games': {
    page: true,
    title: "What's next · MCOP",
    description: 'MCOP pairs Minecraft players for an hour. Vote for the co-op game that should get a buddy button next: Terraria, Stardew Valley, Valheim and more.',
  },
  '/login': { page: true, title: 'Log in · MCOP', description: 'Log in to MCOP to pick up where you left off.' },
  '/terms': { page: true, title: 'Terms · MCOP', description: 'The terms for using MCOP.' },
  '/privacy': { page: true, title: 'Privacy · MCOP', description: 'What MCOP stores about you, why, and how to delete it.' },
  '/matching': { title: 'Finding your buddy… · MCOP' },
  '/waiting': { title: 'In the queue · MCOP' },
  '/session': { title: 'Your session · MCOP' },
  '/post-session': { title: 'How was it? · MCOP' },
  '/account': { title: 'Your account · MCOP' },
  '/preferences': { title: 'Your playstyle · MCOP' },
  '/settings': { title: 'Settings · MCOP' },
  '/worlds': { title: 'My worlds · MCOP' },
  '/p': { title: "You're invited · MCOP" },
  '/admin': { title: 'Scoreboard · MCOP' },
  '/verify-email': { title: 'Verify email · MCOP' },
  '/forgot': { title: 'Forgot password · MCOP' },
  '/reset-password': { title: 'Reset password · MCOP' },
}
