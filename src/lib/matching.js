// overlap scoring - fixed questions count double vs variable ones

const FIXED_WEIGHT = 2
const VARIABLE_WEIGHT = 1

export function compatibilityScore(answersA, answersB) {
  let score = 0
  let max = 0

  for (const [qid, valA] of Object.entries(answersA)) {
    const weight = qid.startsWith('v_') ? VARIABLE_WEIGHT : FIXED_WEIGHT
    max += weight
    if (answersB[qid] && answersB[qid] === valA) score += weight
  }

  if (max === 0) return 0
  return Math.round((score / max) * 100)
}

// only used for the solo demo - real matches come from the backend
// roughly 70% chance the fake partner shares an answer, otherwise picks something different
export function generateFakePartner(userAnswers, allQuestionsById) {
  const partner = {}
  for (const [qid, val] of Object.entries(userAnswers)) {
    if (Math.random() < 0.7) {
      partner[qid] = val
    } else {
      const opts = allQuestionsById[qid]?.options ?? [val]
      const others = opts.filter(o => o !== val)
      partner[qid] = others.length ? others[Math.floor(Math.random() * others.length)] : val
    }
  }
  return {
    id: 'stranger-' + Math.random().toString(36).slice(2, 8),
    displayName: randomMcName(),
    answers: partner,
  }
}

function randomMcName() {
  const prefix = ['Creeper', 'Diamond', 'Ender', 'Pixel', 'Lava', 'Nether', 'Obsidian', 'Redstone', 'Steve', 'Alex']
  const suffix = ['_King', '_42', '_Slayer', 'Mage', 'Crafter', '_99', 'Wolf', 'Fox', '_X']
  return prefix[Math.floor(Math.random() * prefix.length)] + suffix[Math.floor(Math.random() * suffix.length)]
}
