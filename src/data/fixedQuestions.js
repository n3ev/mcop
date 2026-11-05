// the short "temporary" set — guests and anyone playing a one-off style answer these.
// patience is NOT here anymore, it's a session thing (see patienceQuestion below), not a saved trait.
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
    id: 'experience',
    text: 'How long have you been playing?',
    options: ['< 1 year', '1–3 years', '3–5 years', '5+ years'],
  },
  {
    id: 'voice',
    text: 'Comfortable on voice chat?',
    options: ['Yes, Discord ready', 'Text only', 'Maybe, depends on the vibe'],
  },
]

// age group: who you can be matched with. under-18s are only ever matched with
// under-18s, adults with adults, and MCOP is 13+. the labels are what the
// backend reads (agePool in mcop-server/index.js), so keep them in step.
export const AGE_UNDER_13 = 'Under 13'
export const AGE_TEEN = '13 to 17'
export const AGE_ADULT = '18 or older'
export const ageQuestion = {
  id: 'age',
  text: 'How old are you?',
  hint: "Under-18s are only matched with other under-18s, and adults with adults.",
  options: [AGE_UNDER_13, AGE_TEEN, AGE_ADULT],
}

// asked as its own step in the temporary/play flow only. routes the queue, never saved as a preference.
export const patienceQuestion = {
  id: 'patience',
  text: 'When do you want to play?',
  options: ['Right now', 'Within 1 hour', 'Within 2 hours', 'Willing to wait (email me)'],
}
