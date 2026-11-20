import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Card from '../components/Card'
import { useAuth } from '../context/AuthContext'

// Cluster badge
const ClusterBadge = ({ cluster, label }) => {
  const cfg = {
    0: 'bg-blue-100 text-blue-800 border-blue-200',
    1: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  }
  const cls = cfg[cluster] || 'bg-gray-100 text-gray-800 border-gray-200'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      Cluster {cluster} – {label}
    </span>
  )
}

const Result = () => {
  const { user } = useAuth()
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterKategori, setFilterKategori] = useState('Semua')
  const [filterCluster, setFilterCluster] = useState('Semua')

  useEffect(() => {
    axios.get('http://localhost:5000/result')
      .then(res => { setResult(res.data); setLoading(false) })
      .catch(err => { setError(err.response?.data?.error || 'Gagal mengambil data'); setLoading(false) })
  }, [])

  const handleDownloadExcel = async () => {
    try {
      const res = await axios.get('http://localhost:5000/download/excel', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'hasil_clustering.xlsx'
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      alert('Gagal mengunduh Excel')
    }
  }

  const handleDownloadPdf = async () => {
    try {
      const res = await axios.get('http://localhost:5000/download/pdf', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = 'hasil_clustering.pdf'
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      alert('Gagal mengunduh PDF')
    }
  }

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 text-sm">Memuat hasil...</p>
      </div>
    </div>
  )

  if (error) return (
    <Card title="Belum Ada Hasil">
      <div className="text-center py-10">
        <div className="text-5xl mb-3">📭</div>
        <p className="text-gray-600">{error}</p>
        {user?.role === 'admin' && (
          <p className="text-sm text-gray-400 mt-2">Silakan upload dataset dan jalankan proses clustering terlebih dahulu.</p>
        )}
      </div>
    </Card>
  )

  if (!result) return null

  const data = result.data || []

  // Filter options
  const kategoris = ['Semua', ...Array.from(new Set(data.map(d => d.kategori).filter(k => k && k !== '-')))]
  const clusters = ['Semua', ...Array.from(new Set(data.map(d => String(d.cluster))))]

  const filteredData = data.filter(d => {
    const matchKat = filterKategori === 'Semua' || d.kategori === filterKategori
    const matchCluster = filterCluster === 'Semua' || String(d.cluster) === filterCluster
    return matchKat && matchCluster
  })

  // Stats per cluster
  const clusterStats = [0, 1].map(ci => {
    const items = data.filter(d => d.cluster === ci)
    return {
      cluster: ci,
      label: items[0]?.cluster_label || '-',
      count: items.length,
      avgStok: items.reduce((a, d) => a + d.stok_saat_ini, 0) / (items.length || 1),
      avgTerjual: items.reduce((a, d) => a + d.total_terjual, 0) / (items.length || 1),
    }
  })

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Hasil Analisis K-Means</h1>
          <p className="text-gray-500 text-sm mt-1">
            {user?.role === 'pemilik' ? 'Tampilan Pemilik – Dapat menyaring dan mengunduh laporan'
              : 'Tampilan Hasil Clustering Lengkap'}
          </p>
        </div>
        {/* Download — available for both roles */}
        <div className="flex gap-2">
          <button onClick={handleDownloadExcel}
            className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Excel
          </button>
          <button onClick={handleDownloadPdf}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            PDF
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-gray-400 text-xs">Total Data</p>
          <p className="text-2xl font-bold text-gray-800">{data.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-gray-400 text-xs">Silhouette Score</p>
          <p className="text-2xl font-bold text-indigo-700">{result.silhouette_score?.toFixed(4)}</p>
        </div>
        {clusterStats.map(cs => (
          <div key={cs.cluster} className={`rounded-xl shadow-sm border p-4 ${cs.cluster === 0 ? 'bg-blue-50 border-blue-200' : 'bg-emerald-50 border-emerald-200'}`}>
            <p className={`text-xs font-semibold ${cs.cluster === 0 ? 'text-blue-500' : 'text-emerald-500'}`}>
              Cluster {cs.cluster} – {cs.label}
            </p>
            <p className={`text-2xl font-bold ${cs.cluster === 0 ? 'text-blue-800' : 'text-emerald-800'}`}>{cs.count} item</p>
            <p className={`text-xs mt-1 ${cs.cluster === 0 ? 'text-blue-600' : 'text-emerald-600'}`}>
              Avg Stok: {cs.avgStok.toFixed(1)} · Avg Terjual: {cs.avgTerjual.toFixed(1)}
            </p>
          </div>
        ))}
      </div>

      {/* Filter — available for both roles */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <h3 className="font-semibold text-gray-700 mb-3 text-sm">🔍 Filter Data</h3>
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Kategori Barang</label>
            <select
              value={filterKategori}
              onChange={e => setFilterKategori(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {kategoris.map(k => <option key={k}>{k}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Cluster</label>
            <select
              value={filterCluster}
              onChange={e => setFilterCluster(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {clusters.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <span className="text-sm text-gray-500">
              Menampilkan <strong>{filteredData.length}</strong> dari <strong>{data.length}</strong> data
            </span>
          </div>
        </div>
      </div>

      {/* Tabel hasil */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="font-semibold text-gray-800">Tabel Hasil Clustering</h3>
        </div>
        <div className="overflow-x-auto max-h-[600px]">
          <table className="min-w-full text-xs">
            <thead className="bg-indigo-50 sticky top-0 z-10">
              <tr>
                {['No', 'Kode', 'Barcode', 'Nama Barang', 'Kategori', 'Harga Beli', 'Harga Jual', 'Stok Saat Ini', 'Total Terjual', 'Cluster'].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-indigo-700 font-semibold whitespace-nowrap border-b border-indigo-100">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2 text-gray-600">{item.no}</td>
                  <td className="px-3 py-2 font-mono text-gray-700">{item.kode_barang}</td>
                  <td className="px-3 py-2 font-mono text-gray-500">{item.barcode}</td>
                  <td className="px-3 py-2 font-medium text-gray-800 max-w-[180px] truncate">{item.nama_barang}</td>
                  <td className="px-3 py-2 text-gray-600">{item.kategori}</td>
                  <td className="px-3 py-2 text-gray-600">
                    {item.harga_beli != null ? `Rp ${Number(item.harga_beli).toLocaleString('id-ID')}` : '-'}
                  </td>
                  <td className="px-3 py-2 text-gray-600">
                    {item.harga_jual != null ? `Rp ${Number(item.harga_jual).toLocaleString('id-ID')}` : '-'}
                  </td>
                  <td className="px-3 py-2 text-center font-semibold text-gray-700">{item.stok_saat_ini?.toLocaleString('id-ID')}</td>
                  <td className="px-3 py-2 text-center font-semibold text-gray-700">{item.total_terjual?.toLocaleString('id-ID')}</td>
                  <td className="px-3 py-2">
                    <ClusterBadge cluster={item.cluster} label={item.cluster_label} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Result
