import { fixedQuestions } from './fixedQuestions.js'

// extra questions only asked on the permanent profile (set at signup, editable on /preferences).
// these build a richer picture for better matches and, later, friends.
const extraProfileQuestions = [
  {
    id: 'region',
    text: 'Where in the world are you?',
    options: ['Americas', 'Europe', 'Asia', 'Oceania', 'Africa'],
  },
  {
    id: 'playtime',
    text: 'When are you usually online?',
    options: ['Mornings', 'Afternoons', 'Evenings', 'Late night'],
  },
  {
    id: 'social',
    text: 'How social are you in-game?',
    options: ['Chatty', 'Friendly but focused', 'Pretty quiet'],
  },
  {
    id: 'goal',
    text: 'What do you enjoy most?',
    options: ['Building', 'Exploring', 'Combat / PvP', 'Redstone / tech', 'Farming', 'Just vibing'],
  },
  {
    id: 'commitment',
    text: 'What are you looking for?',
    options: ['A one-off session', 'A regular duo', 'Either works'],
  },
  {
    id: 'difficulty',
    text: 'Preferred difficulty?',
    options: ['Peaceful', 'Easy', 'Normal', 'Hard'],
  },
  {
    id: 'loadout',
    text: 'Preferred start?',
    // these labels must stay in sync with loadoutCommands() in the backend
    options: ['Vanilla', 'Iron kit', 'Elytra + fireworks', 'Creative'],
  },
]

// permanent profile = the core questions plus the extras
export const profileQuestions = [...fixedQuestions, ...extraProfileQuestions]
