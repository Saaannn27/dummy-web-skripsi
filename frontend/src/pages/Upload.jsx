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
  const [uploadInfo, setUploadInfo] = useState(null)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile && selectedFile.name.endsWith('.xlsx')) {
      setFile(selectedFile)
      setError('')
      setMessage('')
      setUploadInfo(null)
    } else {
      setError('Pilih file dengan format .xlsx')
      setFile(null)
    }
  }

  const handleUpload = async () => {
    if (!file) { setError('Pilih file terlebih dahulu'); return }
    setUploading(true)
    setMessage('')
    setError('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const uploadRes = await axios.post('http://localhost:5000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      if (uploadRes.status === 200) {
        setUploadInfo(uploadRes.data)
        setMessage(`File "${uploadRes.data.filename}" berhasil di-upload dan divalidasi! (${uploadRes.data.row_count} baris data ditemukan pada sheet "${uploadRes.data.sheet_name || 'Aktif'}")`)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal mengupload file')
    } finally {
      setUploading(false)
    }
  }

  const handleProcess = async () => {
    setUploading(true)
    setMessage('Menjalankan proses clustering...')
    setError('')
    try {
      const res = await axios.post('http://localhost:5000/process')
      if (res.status === 200) {
        setMessage('Clustering selesai! Mengarahkan ke dashboard admin...')
        setTimeout(() => navigate('/dashboard'), 1200)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal memproses clustering')
      setMessage('')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card title="Upload Dataset Excel">
        <div className="space-y-5">
          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer
              ${file ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'}`}
            onClick={() => document.getElementById('file-upload').click()}
          >
            <input
              type="file"
              accept=".xlsx"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <svg className={`w-14 h-14 mx-auto mb-3 ${file ? 'text-indigo-500' : 'text-gray-400'}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            {file ? (
              <div>
                <p className="text-indigo-600 font-semibold">{file.name}</p>
                <p className="text-sm text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div>
                <p className="text-gray-600 font-medium">Klik atau seret file Excel ke sini</p>
                <p className="text-sm text-gray-400 mt-1">Format file harus .xlsx</p>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
              <span className="text-lg">⚠️</span>
              <div>
                <p className="font-semibold">Terjadi Kesalahan:</p>
                <p className="text-xs mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Success */}
          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
              <span className="text-lg">✅</span>
              <div>
                <p className="font-semibold">Status:</p>
                <p className="text-xs mt-0.5">{message}</p>
              </div>
            </div>
          )}

          {/* Upload info */}
          {uploadInfo && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-sm space-y-2">
              <p className="font-semibold text-indigo-900">Hasil Pembacaan File:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-indigo-800">
                <p>• Sheet Terbaca: <strong>{uploadInfo.sheet_name}</strong></p>
                <p>• Jumlah Baris: <strong>{uploadInfo.row_count} baris</strong></p>
                <p className="sm:col-span-2">• Kolom Terdeteksi: <strong>{uploadInfo.detected_columns?.join(', ')}</strong></p>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className={`flex-1 py-3 rounded-lg font-semibold transition-colors text-sm
                ${!file || uploading ? 'bg-gray-200 cursor-not-allowed text-gray-400' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
            >
              {uploading ? '⏳ Mengupload...' : '📤 1. Upload & Validasi File'}
            </button>
            <button
              onClick={handleProcess}
              disabled={!uploadInfo || uploading}
              className={`flex-1 py-3 rounded-lg font-semibold transition-colors text-sm
                ${!uploadInfo || uploading ? 'bg-gray-200 cursor-not-allowed text-gray-400' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
            >
              {uploading ? '⏳ Memproses...' : '⚙️ 2. Jalankan Clustering'}
            </button>
          </div>
        </div>
      </Card>

      {/* Format ketentuan */}
      <Card title="Ketentuan Kolom File Excel">
        <div className="text-sm text-gray-700 space-y-3">
          <p className="text-gray-600">
            Sistem otomatis mendukung variasi penulisan nama kolom (huruf besar/kecil, spasi, atau underscore):
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-indigo-50">
                <tr>
                  <th className="px-3 py-2 text-left text-indigo-700 font-semibold">Field Standar</th>
                  <th className="px-3 py-2 text-left text-indigo-700 font-semibold">Variasi Penulisan Diterima</th>
                  <th className="px-3 py-2 text-left text-indigo-700 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  ['stok_saat_ini', 'Stok Saat Ini, stok_saat_ini, Stok, Stock', '⭐ WAJIB (Variabel Clustering)'],
                  ['total_terjual', 'Total Terjual, total_terjual, Penjualan, Terjual', '⭐ WAJIB (Variabel Clustering)'],
                  ['no', 'No., Nomor, No, ID', 'Opsional'],
                  ['kode_barang', 'Kode Barang, kode_barang, Kode, Kd Barang', 'Opsional'],
                  ['barcode', 'Barcode, Bar Code, Kode Barcode', 'Opsional'],
                  ['nama_barang', 'Nama Barang, nama_barang, Nama, Produk', 'Opsional'],
                  ['kategori', 'Kategori, kategori_barang, Category, Jenis', 'Opsional'],
                  ['harga_beli', 'Harga Beli, harga_beli, Beli, HPP, Modal', 'Opsional'],
                  ['harga_jual', 'Harga Jual, harga_jual, Jual, Harga', 'Opsional'],
                ].map(([col, sample, status]) => (
                  <tr key={col} className={status.includes('WAJIB') ? 'bg-yellow-50' : ''}>
                    <td className="px-3 py-2 font-mono text-indigo-600 font-semibold">{col}</td>
                    <td className="px-3 py-2 text-gray-600">{sample}</td>
                    <td className={`px-3 py-2 font-semibold ${status.includes('WAJIB') ? 'text-orange-600' : 'text-gray-400'}`}>
                      {status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800">
            💡 <strong>Tips:</strong> Jika file Excel Anda memiliki beberapa sheets (misal sheet pertama kosong dan data ada di sheet ke-2), sistem akan secara otomatis mendeteksi sheet yang berisi data Anda.
          </div>
        </div>
      </Card>
    </div>
  )
}

export default Upload
