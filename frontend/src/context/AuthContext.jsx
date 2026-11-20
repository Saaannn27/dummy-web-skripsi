import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export const USERS = {
  admin: { username: 'admin', password: 'admin123', role: 'admin', name: 'Administrator' },
  pemilik: { username: 'pemilik', password: 'pemilik123', role: 'pemilik', name: 'Pemilik Toko' },
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('auth_user')
    if (stored) setUser(JSON.parse(stored))
  }, [])

  const login = (username, password) => {
    const found = Object.values(USERS).find(
      u => u.username === username && u.password === password
    )
    if (found) {
      const userData = { username: found.username, role: found.role, name: found.name }
      setUser(userData)
      sessionStorage.setItem('auth_user', JSON.stringify(userData))
      return { success: true, role: found.role }
    }
    return { success: false }
  }

  const logout = () => {
    setUser(null)
    sessionStorage.removeItem('auth_user')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
