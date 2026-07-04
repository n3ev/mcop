// match-found notifications for players who alt-tabbed while waiting.
// permission is only requested once the user is actually in a queue.
let flashTimer = null
let baseTitle = null

export function askNotifyPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {})
  }
}

export function notifyMatchFound(partnerName) {
  if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
    try {
      const n = new Notification('⛏ Buddy found!', {
        body: `You're paired with ${partnerName}. Your hour starts now.`,
        icon: '/assets/logo/favicon.png',
      })
      n.onclick = () => { window.focus(); n.close() }
    } catch { /* notifications unavailable */ }
  }
  // flash the tab title until they come back
  if (document.hidden && !flashTimer) {
    baseTitle = document.title
    let on = false
    flashTimer = setInterval(() => {
      document.title = on ? baseTitle : '⛏ Buddy found!'
      on = !on
    }, 1200)
    const stop = () => {
      if (!document.hidden) {
        clearInterval(flashTimer)
        flashTimer = null
        document.title = baseTitle
        document.removeEventListener('visibilitychange', stop)
      }
    }
    document.addEventListener('visibilitychange', stop)
  }
}
