// Pool of 20. We pick 3 at random per session.
export const variableQuestions = [
  { id: 'biome',      text: 'Favorite biome?',                   options: ['Forest', 'Desert', 'Mountains', 'Ocean', 'Nether wastes', 'Mushroom fields'] },
  { id: 'priority',   text: 'Mining or building?',               options: ['Mining', 'Building', 'About equal'] },
  { id: 'mods',       text: 'Mods or vanilla?',                  options: ['Strictly vanilla', 'Light mods (QoL)', 'Heavy mods / modpacks'] },
  { id: 'music',      text: 'Music while playing?',              options: ['Game music only', 'Lo-fi', 'Hip-hop / rap', 'Rock / metal', 'Silence'] },
  { id: 'mob',        text: 'Favorite hostile mob to fight?',    options: ['Creeper', 'Skeleton', 'Enderman', 'Wither skeleton', 'Phantom'] },
  { id: 'first_goal', text: 'Nether or End first?',              options: ['Nether deep dive', 'Rush the End', 'Neither — I just chill'] },
  { id: 'pace',       text: 'Speedrun or chill?',                options: ['Speedrun', 'Casual progression', 'Pure chill — no goals'] },
  { id: 'youtuber',   text: 'Who do you watch?',                 options: ['Dream', 'Technoblade fans forever', 'Mumbo Jumbo', 'Grian / Hermitcraft', 'I don\'t really watch'] },
  { id: 'combat',     text: 'PvP or PvE?',                       options: ['PvP all day', 'PvE mostly', 'Both equally'] },
  { id: 'server',     text: 'Preferred server type?',            options: ['SMP with friends', 'Anarchy / 2b2t style', 'Minigames (Hypixel)', 'Roleplay / creative'] },
  { id: 'endgame',    text: 'What\'s endgame for you?',          options: ['Beat the Ender Dragon', 'Mega-build a base', 'Full enchanted netherite', 'Collect every advancement'] },
  { id: 'weapon',     text: 'Favorite weapon?',                  options: ['Sword', 'Bow', 'Crossbow', 'Trident', 'Axe'] },
  { id: 'time',       text: 'Day or night player?',              options: ['Day builder', 'Night explorer', 'No preference'] },
  { id: 'horror',     text: 'Spooky mods / mobs?',               options: ['Love horror', 'Tolerate it', 'No thanks'] },
  { id: 'pet',        text: 'Pet of choice?',                    options: ['Dog', 'Cat', 'Parrot', 'Axolotl', 'No pets'] },
  { id: 'villagers',  text: 'Villager strategy?',                options: ['Build a trading hall', 'Raid for emeralds', 'Mostly ignore them'] },
  { id: 'redstone',   text: 'Redstone level?',                   options: ['Beginner', 'Pistons + comparators', 'Auto farms', 'Full computers'] },
  { id: 'death',      text: 'On dying in Hardcore...',           options: ['Cry & reset', 'Laugh it off', 'I never die'] },
  { id: 'build_size', text: 'Builds tend to be...',              options: ['Small + cozy', 'Medium functional', 'Massive megabuilds'] },
  { id: 'social',     text: 'How chatty are you in-game?',       options: ['Quiet — focused', 'Friendly chatter', 'Constant banter'] },
]

// Pick `count` random unique questions from the pool.
export function pickVariableQuestions(count = 3, seed = Math.random()) {
  const shuffled = [...variableQuestions].sort(() => 0.5 - seed - Math.random())
  return shuffled.slice(0, count)
}
