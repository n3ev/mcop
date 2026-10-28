import { saveSession, loadSession } from './storage.js'
import { joinQueue } from './api.js'

// shared "start a match" flow used by the questionnaire and the dashboard quick-play.
// saves the session, joins the queue (token auto-attached if logged in),
// and returns where to navigate next. if the server can't be reached the
// session has no queueId, and the queue pages say so and offer a retry.
export async function startMatch({ displayName, mcUsername, answers, email }) {
  saveSession({
    user: { displayName },
    mcUsername,
    answers,
    email: email || null,
    questionIds: Object.keys(answers),
    startedAt: Date.now(),
    queueId: null,
  })
  await joinSavedQueue()
  const patience = answers.patience ?? 'Right now'
  return patience === 'Right now' ? '/matching' : '/waiting'
}

// (re)join the queue with the answers already saved — true once in the queue
export async function joinSavedQueue() {
  const s = loadSession()
  try {
    const { queueId } = await joinQueue({
      displayName: s.user?.displayName,
      mcUsername: s.mcUsername || s.user?.displayName,
      answers: s.answers,
      email: s.email,
    })
    saveSession({ queueId })
    return true
  } catch {
    return false
  }
}
