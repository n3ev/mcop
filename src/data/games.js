// what MCOP might do next. MCOP is Minecraft-only today; these are the co-op
// games people can vote for on /games (a vote is an email on that game's
// waitlist). the ids must match WAITLIST_KINDS in mcop-server/index.js.
//
// how each would work, if it wins: Minecraft gets a server MCOP runs. most of
// these have no server you can rent for an hour, so for them MCOP would do the
// matching and the hour (timer, chat, swap socials) and one of you hosts.
export const GAMES = [
  { id: 'terraria', name: 'Terraria', icon: 'iron_pickaxe', blurb: 'Dig, build and take on bosses that are much easier with two.' },
  { id: 'stardew', name: 'Stardew Valley', icon: 'wheat', blurb: 'A farm for two: crops, the mines, and whatever the festival is this week.' },
  { id: 'valheim', name: 'Valheim', icon: 'oak_boat', blurb: 'Viking survival. Build a longhouse, sail out, come home with a story.' },
  { id: 'lethal-company', name: 'Lethal Company', icon: 'bell', blurb: 'Scrap runs where the only thing keeping you alive is your buddy on voice.' },
  { id: 'dont-starve-together', name: "Don't Starve Together", icon: 'spider_eye', blurb: 'The strange woods are a lot less strange with someone watching your back.' },
  { id: 'core-keeper', name: 'Core Keeper', icon: 'diamond_pickaxe', blurb: 'Mine down into a glowing underground and build a base on the way.' },
  { id: 'split-fiction', name: 'Split Fiction', icon: 'writable_book', blurb: 'A whole story built for exactly two players. You need a buddy for it.' },
  { id: 'palworld', name: 'Palworld', icon: 'egg', blurb: 'Catch creatures, build a base and explore an open world together.' },
]
