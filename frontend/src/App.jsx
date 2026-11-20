import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Upload from './pages/Upload'
import Result from './pages/Result'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <nav className="bg-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex space-x-8">
                <Link to="/" className="inline-flex items-center px-3 py-2 text-gray-700 hover:text-indigo-600 transition-colors">
                  Dashboard
                </Link>
                <Link to="/upload" className="inline-flex items-center px-3 py-2 text-gray-700 hover:text-indigo-600 transition-colors">
                  Upload Data
                </Link>
                <Link to="/result" className="inline-flex items-center px-3 py-2 text-gray-700 hover:text-indigo-600 transition-colors">
                  Hasil Clustering
                </Link>
              </div>
              <div className="flex items-center">
                <span className="text-gray-600 font-medium">Skripsi K-Means Clustering</span>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/result" element={<Result />} />
          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App