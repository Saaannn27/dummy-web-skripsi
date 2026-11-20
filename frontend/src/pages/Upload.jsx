import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../components/Card'
import axios from 'axios'

const Upload = () => {
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile && selectedFile.name.endsWith('.xlsx')) {
      setFile(selectedFile)
      setError('')
    } else {
      setError('Please select a valid .xlsx file')
      setFile(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first')
      return
    }

    setUploading(true)
    setMessage('')
    setError('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      // Upload file
      const uploadResponse = await axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (uploadResponse.status === 200) {
        setMessage('File uploaded successfully! Processing clustering...')
        
        // Process clustering
        const processResponse = await axios.post('http://localhost:5000/process')
        
        if (processResponse.status === 200) {
          setMessage('Clustering completed successfully!')
          setTimeout(() => {
            navigate('/result')
          }, 1500)
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error uploading file')
      setMessage('')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card title="Upload Data Excel">
        <div className="space-y-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-500 transition-colors">
            <input
              type="file"
              accept=".xlsx"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer inline-flex flex-col items-center"
            >
              <svg
                className="w-12 h-12 text-gray-400 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <span className="text-gray-600">
                {file ? file.name : 'Click to upload or drag and drop'}
              </span>
              <span className="text-sm text-gray-500 mt-1">
                .xlsx files only
              </span>
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              {message}
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className={`w-full py-3 rounded-lg font-semibold transition-colors ${
              !file || uploading
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {uploading ? 'Processing...' : 'Upload & Process'}
          </button>

          <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded">
            <h3 className="font-semibold mb-2">Format Data yang Diperlukan:</h3>
            <p>File Excel harus memiliki kolom:</p>
            <ul className="list-disc list-inside mt-1">
              <li><strong>nama_barang</strong> (opsional, akan digunakan untuk label)</li>
              <li><strong>harga</strong> (wajib)</li>
              <li><strong>stok</strong> (wajib)</li>
              <li><strong>penjualan</strong> (wajib)</li>
            </ul>
            <p className="mt-2 text-yellow-600">* Jika tidak ada kolom nama_barang, sistem akan memberi nama default</p>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default Upload