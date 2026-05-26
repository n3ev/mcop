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
      <h1 className="hero-title">Find a Minecraft buddy<br/>in 60 seconds.</h1>
      <p className="hero-sub">
        Answer 8 quick questions. We pair you with someone whose vibe matches yours.
        You get a private server and one hour to play together.
      </p>
      <button className="btn primary big" onClick={start}>Find my buddy ⛏</button>
      <ul className="hero-bullets">
        <li>🎯 Matched by shared interests</li>
        <li>🌍 Free Minecraft server for 1 hour</li>
        <li>💬 Optional Discord swap after</li>
        <li>💾 Save your world for a month, free</li>
      </ul>
    </section>
  )
}
