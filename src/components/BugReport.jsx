import { useState } from 'react'

const WEB3FORMS_KEY = 'REPLACE_WITH_YOUR_KEY'

export default function BugReport() {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [status, setStatus] = useState(null) // null | 'sending' | 'sent' | 'error'

  const submit = async () => {
    if (!text.trim()) return
    setStatus('sending')
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject: 'MCOP Bug Report',
          message: text,
          from_name: 'MCOP Beta User',
        }),
      })
      const data = await res.json()
      setStatus(data.success ? 'sent' : 'error')
    } catch {
      setStatus('error')
    }
  }

  const close = () => {
    setOpen(false)
    setText('')
    setStatus(null)
  }

  return (
    <>
      <button className="bug-btn" onClick={() => setOpen(true)}>
        🐛 Report a bug
      </button>

      {open && (
        <div className="modal-overlay" onClick={close}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            {status === 'sent' ? (
              <>
                <h3 className="modal-title">Thanks!</h3>
                <p className="muted">We got your report and will look into it.</p>
                <button className="btn primary" onClick={close}>Close</button>
              </>
            ) : (
              <>
                <h3 className="modal-title">Report a bug</h3>
                <p className="muted">We're in beta — bugs happen. Tell us what went wrong.</p>
                <textarea
                  className="bug-textarea"
                  placeholder="Describe what happened and what you expected..."
                  value={text}
                  onChange={e => setText(e.target.value)}
                  rows={5}
                  autoFocus
                />
                {status === 'error' && <p className="bug-error">Something went wrong — try again.</p>}
                <div className="modal-actions">
                  <button className="btn ghost" onClick={close}>Cancel</button>
                  <button
                    className="btn primary"
                    onClick={submit}
                    disabled={!text.trim() || status === 'sending'}
                  >
                    {status === 'sending' ? 'Sending…' : 'Send report'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
