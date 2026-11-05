import { fixedQuestions, ageQuestion, AGE_UNDER_13 } from './fixedQuestions.js'

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

// accounts are 13+ (the sign-up tick box), so the profile only asks which side of 18
const profileAgeQuestion = { ...ageQuestion, options: ageQuestion.options.filter(o => o !== AGE_UNDER_13) }

// permanent profile = age group, the core questions, then the extras
export const profileQuestions = [profileAgeQuestion, ...fixedQuestions, ...extraProfileQuestions]
// the ones that describe how you play (age is a filter, not a style)
export const styleQuestions = profileQuestions.filter(q => q.id !== 'age')
