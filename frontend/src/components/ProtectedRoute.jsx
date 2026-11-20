import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * allowedRoles: array of role strings, e.g. ['admin'] or ['admin','pemilik']
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="text-red-500 text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-semibold text-gray-700">Akses Ditolak</h2>
        <p className="text-gray-500 mt-2">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
      </div>
    )
  }

  return children
}

export default ProtectedRoute
