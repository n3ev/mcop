import { useState } from 'react'
import BedrockWaitlist from '../components/BedrockWaitlist.jsx'
import { playXp, playError } from '../lib/sound.js'
import { toast } from '../lib/toast.js'

const WEB3FORMS_KEY = '469775ad-d571-4c52-b507-891f1df4970a'

// a real message form (same delivery pipe as the bug reporter) + the ways to reach me
function ContactForm() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState(null) // null | sending | sent | error

  const submit = async (e) => {
    e.preventDefault()
    if (!message.trim()) return
    setStatus('sending')
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject: 'MCOP Contact message',
          from_name: 'MCOP Visitor',
          email: email || 'not provided',
          message,
        }),
      })
      const data = await res.json()
      if (data.success) { setStatus('sent'); playXp(); toast('Message sent — thanks!') }
      else { setStatus('error'); playError() }
    } catch { setStatus('error'); playError() }
  }

  if (status === 'sent') {
    return (
      <div className="contact-reveal">
        <p className="success">Sent ✓ I read every one of these.</p>
        <p className="muted small">If you left an email I'll get back to you. Otherwise, see you in a world.</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit}>
      <input
        className="text-input"
        type="email"
        placeholder="Your email (optional, so I can reply)"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <textarea
        className="bug-textarea"
        rows={5}
        placeholder="What's on your mind? Feedback, a question, an idea, anything."
        value={message}
        onChange={e => setMessage(e.target.value)}
      />
      {status === 'error' && <p className="auth-error">Something went wrong. Try again, or email me directly.</p>}
      <button className="btn primary" type="submit" disabled={!message.trim() || status === 'sending'}>
        {status === 'sending' ? 'Sending…' : 'Send message'}
      </button>
    </form>
  )
}

export default function Contact() {
  return (
    <div className="cross-section">
      <h1 className="sr-only">Contact MCOP</h1>

      <section className="stratum-surface">
        <div className="pair">
          <div className="frame how-section">
            <p className="section-eyebrow">Say hello</p>
            <p className="muted" style={{ marginBottom: 16 }}>
              MCOP is built and run by one person. Bugs, ideas, "hey this is cool" —
              it all comes straight to me and I actually read it.
            </p>
            <ContactForm />
          </div>

          <div className="frame how-section">
            <p className="section-eyebrow">Find me</p>
            <div className="kv spec-rows">
              <div className="kv-row">
                <span className="kv-key">Email</span>
                <a className="kv-val inline-link" href="mailto:nchavla5@gmail.com">nchavla5@gmail.com</a>
                <span />
              </div>
              <div className="kv-row">
                <span className="kv-key">GitHub</span>
                <a className="kv-val inline-link" href="https://github.com/n3ev/mcop" target="_blank" rel="noreferrer">github.com/n3ev/mcop</a>
                <span />
              </div>
              <div className="kv-row">
                <span className="kv-key">Instagram</span>
                <a className="kv-val inline-link" href="https://instagram.com/neevchavla" target="_blank" rel="noreferrer">@neevchavla</a>
                <span />
              </div>
              <div className="kv-row">
                <span className="kv-key">Based in</span>
                <span className="kv-val">Sydney, Australia</span>
                <span />
              </div>
            </div>

            <div className="contact-waitlist">
              <h3 className="hour-title" style={{ marginBottom: 6 }}>On Bedrock?</h3>
              <p className="muted small" style={{ marginBottom: 10 }}>
                Java only for now. Leave your email and you'll be the first to know if cross-play lands.
              </p>
              <BedrockWaitlist />
            </div>

            <p className="muted small" style={{ marginTop: 18 }}>
              Response time is usually a day or two. It's just me and a lot of Minecraft.
            </p>
          </div>
        </div>
      </section>

      {/* ── what reaching out actually gets you ── */}
      <section className="stratum-stone">
        <div className="wrap frame" style={{ maxWidth: 900 }}>
          <p className="section-eyebrow">Good things to send</p>
          <div className="hour-grid">
            <div className="hour-card">
              <span className="hour-icon" aria-hidden="true">🐛</span>
              <h3 className="hour-title">A bug</h3>
              <p className="hour-desc">Something broke or looked wrong? Tell me what you did and what you expected. Screenshots help. It goes to the top of my list.</p>
            </div>
            <div className="hour-card">
              <span className="hour-icon" aria-hidden="true">💡</span>
              <h3 className="hour-title">An idea</h3>
              <p className="hour-desc">A feature you wish existed, a question we should ask, a loadout you want. The roadmap is shaped by what people ask for.</p>
            </div>
            <div className="hour-card">
              <span className="hour-icon" aria-hidden="true">🚩</span>
              <h3 className="hour-title">A report</h3>
              <p className="hour-desc">If a buddy was a problem, the fastest route is the report button after a session, but you can reach me here too. I read every one.</p>
            </div>
            <div className="hour-card">
              <span className="hour-icon" aria-hidden="true">👋</span>
              <h3 className="hour-title">Just hi</h3>
              <p className="hour-desc">Made a friend on here? Built something great? I genuinely love hearing it. It's the reason the whole thing exists.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
