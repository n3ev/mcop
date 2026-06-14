import { createContext, useContext, useEffect, useState } from 'react'
import { apiLogin, apiSignup, apiMe, getToken, setToken, clearToken } from '../lib/auth.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // on first load, if we have a token, fetch the current user
  useEffect(() => {
    let active = true
    if (!getToken()) { setLoading(false); return }
    apiMe().then(u => {
      if (!active) return
      if (u) setUser(u)
      else clearToken()
      setLoading(false)
    })
    return () => { active = false }
  }, [])

  const login = async (creds) => {
    const { token, user } = await apiLogin(creds)
    setToken(token)
    setUser(user)
    return user
  }

  const signup = async (creds) => {
    const { token, user } = await apiSignup(creds)
    setToken(token)
    setUser(user)
    return user
  }

  const logout = () => {
    clearToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
