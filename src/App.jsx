import { Routes, Route, Link } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import Questionnaire from './pages/Questionnaire.jsx'
import Matching from './pages/Matching.jsx'
import Session from './pages/Session.jsx'
import PostSession from './pages/PostSession.jsx'

export default function App() {
  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand">⛏ MCOP</Link>
        <span className="tagline">Random buddy. One hour. One world.</span>
      </header>

      <main className="content">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/questionnaire" element={<Questionnaire />} />
          <Route path="/matching" element={<Matching />} />
          <Route path="/session" element={<Session />} />
          <Route path="/post-session" element={<PostSession />} />
        </Routes>
      </main>

      <footer className="footer">
        <span>© {new Date().getFullYear()} MCOP · Not affiliated with Mojang or Aternos</span>
      </footer>
    </div>
  )
}
