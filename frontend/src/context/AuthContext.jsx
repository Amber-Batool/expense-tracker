import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

const TOKEN_KEY = 'expensy_token'
const USER_KEY = 'expensy_user'

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    // A corrupted entry shouldn't lock anyone out of the app.
    localStorage.removeItem(USER_KEY)
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(readStoredUser)
  const [loading, setLoading] = useState(true)

  const login = useCallback((accessToken, userData) => {
    localStorage.setItem(TOKEN_KEY, accessToken)
    localStorage.setItem(USER_KEY, JSON.stringify(userData))
    if (userData?.currency) {
      localStorage.setItem('expensy_currency', userData.currency)
    }
    setToken(accessToken)
    setUser(userData)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }, [])

  /** Merge fresh fields into the stored user (after a profile edit). */
  const updateUser = useCallback((patch) => {
    setUser((previous) => {
      const next = { ...(previous || {}), ...patch }
      localStorage.setItem(USER_KEY, JSON.stringify(next))
      if (next.currency) localStorage.setItem('expensy_currency', next.currency)
      return next
    })
  }, [])

  // Verify the stored token against the server on boot. This also picks up a
  // currency change made on another device.
  useEffect(() => {
    let cancelled = false

    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }

    api
      .get('/auth/me')
      .then(({ data }) => {
        if (cancelled) return
        setUser(data)
        localStorage.setItem(USER_KEY, JSON.stringify(data))
        if (data?.currency) localStorage.setItem('expensy_currency', data.currency)
      })
      .catch((error) => {
        // 401 is handled by the api interceptor. Anything else (server down,
        // no network) shouldn't log the user out — keep the cached profile.
        if (cancelled) return
        if (error?.response?.status === 401) logout()
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token, logout])

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(token),
      login,
      logout,
      updateUser,
    }),
    [user, token, loading, login, logout, updateUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider')
  }
  return context
}