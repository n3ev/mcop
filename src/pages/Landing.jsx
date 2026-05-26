import { useNavigate } from 'react-router-dom'
import { clearSession } from '../lib/storage.js'

export default function Landing() {
  const nav = useNavigate()
  const start = () => {
    clearSession()
    nav('/questionnaire')
  }

  return (
    <section className="hero">
      <div className="hero-eyebrow">
        <span className="hero-eyebrow-dot" />
        Free · No account needed
      </div>

      <h1 className="hero-title">Find a Minecraft buddy<br/>in 60 seconds.</h1>

      <p className="hero-sub">
        Answer 9 quick questions. We pair you with someone whose vibe matches yours.
        Private server. One hour. No strings.
      </p>

      <button className="btn primary big" onClick={start}>Find my buddy ⛏</button>

      <ul className="hero-bullets">
        <li>🎯 Matched by playstyle, not luck</li>
        <li>🌍 Free Minecraft server for 1 hour</li>
        <li>💬 Optional Discord swap after</li>
        <li>💾 Save your world for 30 days, free</li>
      </ul>
    </section>
  )
}
