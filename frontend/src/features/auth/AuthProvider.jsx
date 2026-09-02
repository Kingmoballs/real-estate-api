import { useCallback, useEffect, useMemo, useState } from 'react'
import api, { ensureCsrfToken, setCsrfToken } from '../../lib/api.js'
import AuthContext from './authContext.js'

function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    const response = await api.get('/auth/me')
    setUser(response.data.user)
    return response.data.user
  }, [])

  useEffect(() => {
    let isActive = true

    const bootstrapSession = async () => {
      try {
        await ensureCsrfToken()
        const response = await api.get('/auth/me')

        if (isActive) setUser(response.data.user)
      } catch (error) {
        if (isActive) {
          setUser(null)

          if (error.response?.status !== 401) {
            console.error('Session bootstrap failed', error)
          }
        }
      } finally {
        if (isActive) setIsLoading(false)
      }
    }

    void bootstrapSession()

    return () => {
      isActive = false
    }
  }, [])

  const login = useCallback(async (credentials) => {
    await ensureCsrfToken()
    const response = await api.post('/auth/login', credentials, {
      skipAuthRefresh: true,
    })
    setCsrfToken(response.data.csrfToken)
    setUser(response.data.user)
    return response.data.user
  }, [])

  const register = useCallback(async (details) => {
    const response = await api.post('/auth/register', details, {
      skipAuthRefresh: true,
    })
    return response.data
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout', undefined, {
        skipAuthRefresh: true,
      })
    } finally {
      setCsrfToken(null)
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      refreshUser,
    }),
    [isLoading, login, logout, refreshUser, register, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider
