import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Navbar = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path
    ? 'text-indigo-600 border-b-2 border-indigo-600 font-semibold'
    : 'text-gray-600 hover:text-indigo-600'

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="font-bold text-gray-800 text-sm hidden sm:block">K-Means Persediaan</span>
          </div>

          {/* Nav Links */}
          <div className="flex items-center space-x-6">
            {user?.role === 'admin' && (
              <>
                <Link to="/dashboard" className={`text-sm pb-1 transition-all ${isActive('/dashboard')}`}>
                  Dashboard
                </Link>
                <Link to="/upload" className={`text-sm pb-1 transition-all ${isActive('/upload')}`}>
                  Upload Data
                </Link>
              </>
            )}
            <Link to="/result" className={`text-sm pb-1 transition-all ${isActive('/result')}`}>
              Hasil Analisis
            </Link>
          </div>

          {/* User info + logout */}
          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-gray-700">{user?.name}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${user?.role === 'admin' ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
              {user?.name?.charAt(0) || '?'}
            </div>
            <button
              onClick={handleLogout}
              className="text-xs bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
            >
              Keluar
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
