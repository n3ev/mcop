// Every player answers these. Heavily weighted in matching.
// NOTE: 'patience' is queue-routing data — exclude from compatibility scoring when backend is real.
export const fixedQuestions = [
  {
    id: 'gamemode',
    text: 'Favorite game mode?',
    options: ['Survival', 'Creative', 'Hardcore', 'Adventure'],
  },
  {
    id: 'playstyle',
    text: 'Which play style fits you best?',
    options: ['Builder', 'Explorer', 'Redstone engineer', 'PvPer', 'Farmer / villager trader'],
  },
  {
    id: 'edition',
    text: 'Java or Bedrock?',
    options: ['Java', 'Bedrock', 'Both'],
  },
  {
    id: 'experience',
    text: 'How long have you been playing?',
    options: ['< 1 year', '1–3 years', '3–5 years', '5+ years'],
  },
  {
    id: 'voice',
    text: 'Comfortable on voice chat?',
    options: ['Yes — Discord ready', 'Text only', 'Maybe, depends on the vibe'],
  },
  {
    id: 'patience',
    text: 'When do you want to play?',
    options: ['Right now', 'Within 1 hour', 'Within 2 hours', 'Willing to wait — email me'],
  },
]
