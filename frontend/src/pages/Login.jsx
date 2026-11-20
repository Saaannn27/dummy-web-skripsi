import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Login = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setTimeout(() => {
      const result = login(form.username, form.password)
      if (result.success) {
        navigate(result.role === 'admin' ? '/dashboard' : '/result')
      } else {
        setError('Username atau password salah')
      }
      setLoading(false)
    }, 400)
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-2xl w-full max-w-md p-8 text-white border border-blue-500">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-md mb-4">
            <svg className="w-9 h-9 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Analisis Persediaan Barang</h1>
          <p className="text-sm text-blue-100 mt-1">K-Means Clustering System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-blue-100 mb-1">Username</label>
            <input
              type="text"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              className="w-full bg-white text-gray-900 placeholder-gray-400 border border-transparent rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-white focus:bg-white text-sm shadow-inner"
              placeholder="Masukkan username"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-blue-100 mb-1">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="w-full bg-white text-gray-900 placeholder-gray-400 border border-transparent rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-white focus:bg-white text-sm shadow-inner"
              placeholder="Masukkan password"
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/90 border border-red-300 text-white px-4 py-2.5 rounded-lg text-sm font-medium">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white hover:bg-blue-50 text-blue-700 font-bold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-60 text-sm mt-2"
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
