// Simple overlap scoring. Fixed questions count more than variables.
// Replace this with a backend call when you go multi-user.

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

// Generate a plausible "matched stranger" profile by lightly perturbing the user's answers.
// Used only for the single-player demo. Real backend would pull a queued partner.
export function generateFakePartner(userAnswers, allQuestionsById) {
  const partner = {}
  for (const [qid, val] of Object.entries(userAnswers)) {
    // ~70% chance partner picked the same option, otherwise pick another
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
