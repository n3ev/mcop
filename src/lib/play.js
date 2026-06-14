import { saveSession } from './storage.js'
import { joinQueue } from './api.js'

// shared "start a match" flow used by the questionnaire and the dashboard quick-play.
// saves the session, joins the queue (token auto-attached if logged in),
// and returns where to navigate next.
export async function startMatch({ displayName, mcUsername, answers, email }) {
  saveSession({
    user: { displayName },
    answers,
    email: email || null,
    questionIds: Object.keys(answers),
    startedAt: Date.now(),
  })
  try {
    const { queueId } = await joinQueue({ displayName, mcUsername, answers, email })
    saveSession({ queueId })
  } catch {
    // backend unavailable — destination page handles the demo fallback
  }
  const patience = answers.patience ?? 'Right now'
  return patience === 'Right now' ? '/matching' : '/waiting'
}
