import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

const API_BASE_URL = 'http://localhost:3001/api/accounts'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('bg_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [token, setToken] = useState(() => localStorage.getItem('bg_token') || null)
  const [loading, setLoading] = useState(true)

  // Validate token with /me on initial load
  useEffect(() => {
    async function verifyUser() {
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const res = await fetch(`${API_BASE_URL}/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
          localStorage.setItem('bg_user', JSON.stringify(data.user))
        } else {
          // Token expired or invalid
          logout()
        }
      } catch (err) {
        console.warn('Could not verify session with server:', err)
      } finally {
        setLoading(false)
      }
    }

    verifyUser()
  }, [token])

  const login = async (emailOrUsername, password) => {
    const res = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrUsername, password })
    })

    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error || 'Login failed')
    }

    setUser(data.user)
    setToken(data.token)
    localStorage.setItem('bg_token', data.token)
    localStorage.setItem('bg_user', JSON.stringify(data.user))
    return data.user
  }

  const register = async ({ email, username, password, dateOfBirth }) => {
    const res = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password, dateOfBirth })
    })

    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed')
    }

    setUser(data.user)
    setToken(data.token)
    localStorage.setItem('bg_token', data.token)
    localStorage.setItem('bg_user', JSON.stringify(data.user))
    return data.user
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('bg_token')
    localStorage.removeItem('bg_user')
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
