import { Routes, Route, Link } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import Questionnaire from './pages/Questionnaire.jsx'
import Matching from './pages/Matching.jsx'
import Waiting from './pages/Waiting.jsx'
import Session from './pages/Session.jsx'
import PostSession from './pages/PostSession.jsx'
import Auth from './pages/Auth.jsx'
import Account from './pages/Account.jsx'
import Preferences from './pages/Preferences.jsx'
import BugReport from './components/BugReport.jsx'
import { useAuth } from './context/AuthContext.jsx'

function HeaderAuth() {
  const { user, logout, loading } = useAuth()
  if (loading) return null
  if (user) {
    return (
      <div className="header-auth">
        <Link to="/account" className="header-user">
          {user.displayName || user.email}
          {user.mcVerified && <span className="mc-dot" title="Minecraft linked" />}
        </Link>
        <button className="btn small ghost" onClick={logout}>Log out</button>
      </div>
    )
  }
  return (
    <div className="header-auth">
      <Link to="/login" className="header-link">Log in</Link>
      <Link to="/signup" className="btn small primary">Sign up</Link>
    </div>
  )
}

export default function App() {
  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand">⛏ MC<span className="brand-accent">OP</span></Link>
        <span className="tagline">Random buddy. One hour. One world.</span>
        <HeaderAuth />
      </header>

      <main className="content">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/questionnaire" element={<Questionnaire />} />
          <Route path="/matching" element={<Matching />} />
          <Route path="/waiting" element={<Waiting />} />
          <Route path="/session" element={<Session />} />
          <Route path="/post-session" element={<PostSession />} />
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/signup" element={<Auth mode="signup" />} />
          <Route path="/account" element={<Account />} />
          <Route path="/preferences" element={<Preferences />} />
        </Routes>
      </main>

      <footer className="footer">
        <span>© {new Date().getFullYear()} MCOP · Not affiliated with Mojang or Aternos</span>
        <BugReport />
      </footer>
    </div>
  )
}
