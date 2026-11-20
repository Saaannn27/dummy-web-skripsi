import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Card from '../components/Card'
import axios from 'axios'

// ─── Sub-komponen ─────────────────────────────────────────────────────────────

const SectionHeader = ({ step, title, subtitle, color }) => (
  <div className={`rounded-t-xl px-6 py-4 ${color}`}>
    <div className="flex items-center gap-3">
      <span className="w-8 h-8 rounded-full bg-white bg-opacity-20 flex items-center justify-center font-bold text-white text-sm">{step}</span>
      <div>
        <h3 className="font-bold text-white text-base">{title}</h3>
        {subtitle && <p className="text-white text-opacity-80 text-xs mt-0.5">{subtitle}</p>}
      </div>
    </div>
  </div>
)

// Tabel scrollable generik
const DataTable = ({ columns, rows, maxH = 'max-h-80', highlight }) => (
  <div className={`overflow-auto ${maxH} border border-gray-200 rounded-lg`}>
    <table className="min-w-full text-xs">
      <thead className="bg-gray-100 sticky top-0 z-10">
        <tr>
          {columns.map((col, i) => (
            <th key={i} className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap border-b border-gray-200">
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {rows.map((row, i) => (
          <tr key={i} className={`hover:bg-gray-50 transition-colors ${highlight && highlight(row, i) ? 'bg-yellow-50' : ''}`}>
            {row.map((cell, j) => (
              <td key={j} className="px-3 py-2 whitespace-nowrap text-gray-700">{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

// Cluster badge
const ClusterBadge = ({ cluster, label }) => {
  const cfg = {
    0: { bg: 'bg-blue-100 text-blue-800 border-blue-200', dot: 'bg-blue-500' },
    1: { bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' },
  }
  const c = cfg[cluster] || { bg: 'bg-gray-100 text-gray-800 border-gray-200', dot: 'bg-gray-400' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.bg}`}>
      <span className={`w-2 h-2 rounded-full ${c.dot}`}></span>
      Cluster {cluster} – {label}
    </span>
  )
}

// ─── Komponen utama ───────────────────────────────────────────────────────────

const Dashboard = () => {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openSection, setOpenSection] = useState({ pre: true, log: true, zscore: true, kmeans: true, table: true })

  const toggle = (key) => setOpenSection(s => ({ ...s, [key]: !s[key] }))

  useEffect(() => {
    axios.get('http://localhost:5000/result')
      .then(res => { setResult(res.data); setLoading(false) })
      .catch(() => { setError('no_data'); setLoading(false) })
  }, [])

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 text-sm">Memuat data...</p>
      </div>
    </div>
  )

  if (error === 'no_data') return (
    <div className="space-y-6">
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📊</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Belum Ada Hasil Analisis</h2>
        <p className="text-gray-500 mb-6">Upload dataset dan jalankan proses clustering terlebih dahulu</p>
        <Link to="/upload"
          className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors font-semibold">
          Upload Dataset
        </Link>
      </div>

      {/* Info metodologi */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Konfigurasi K-Means">
          <ul className="space-y-2 text-sm text-gray-700">
            {[
              ['Jumlah Cluster (K)', '2'],
              ['Metode Inisialisasi', 'K-Means++'],
              ['Random State', '42'],
              ['n_init', '10'],
              ['max_iter', '300'],
              ['Toleransi', '0.0001'],
            ].map(([k, v]) => (
              <li key={k} className="flex justify-between border-b border-gray-100 pb-1">
                <span className="text-gray-500">{k}</span>
                <span className="font-semibold font-mono text-indigo-700">{v}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Alur Proses">
          <ol className="space-y-3 text-sm">
            {[
              ['1', 'Preprocessing', 'Pembersihan data (hapus NaN)', 'bg-blue-100 text-blue-800'],
              ['2', 'Transformasi Log1p', 'Reduksi skewness data', 'bg-purple-100 text-purple-800'],
              ['3', 'Standarisasi Z-Score', 'Normalisasi distribusi data', 'bg-indigo-100 text-indigo-800'],
              ['4', 'K-Means Clustering', 'Pengelompokan dengan K=2', 'bg-emerald-100 text-emerald-800'],
            ].map(([n, title, desc, cls]) => (
              <li key={n} className="flex gap-3">
                <span className={`flex-shrink-0 w-7 h-7 rounded-full ${cls} flex items-center justify-center font-bold text-xs`}>{n}</span>
                <div>
                  <p className="font-semibold text-gray-800">{title}</p>
                  <p className="text-gray-500 text-xs">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </div>
  )

  const { data, preprocessing, iteration_history, centroids_original, silhouette_score, n_clusters, kmeans_config, init_products } = result

  // ── 1. Data preprocessing raw ──
  const preRows = data.map(d => [
    d.no, d.kode_barang, d.nama_barang, d.kategori,
    d.stok_saat_ini?.toLocaleString('id-ID'), d.total_terjual?.toLocaleString('id-ID')
  ])

  // ── 2. Setelah log1p ──
  const logRows = data.map(d => [
    d.no, d.nama_barang,
    d.stok_saat_ini?.toFixed(4), d.total_terjual?.toFixed(4),
    d.stok_log?.toFixed(6), d.terjual_log?.toFixed(6),
  ])

  // ── 3. Setelah Z-Score ──
  const zRows = data.map(d => [
    d.no, d.nama_barang,
    d.stok_log?.toFixed(6), d.terjual_log?.toFixed(6),
    d.stok_scaled?.toFixed(6), d.terjual_scaled?.toFixed(6),
  ])

  // ── 4. Iterasi K-Means ──
  const initEntry = iteration_history?.[0]
  const iterEntries = iteration_history?.slice(1) || []

  // ── 5. Tabel hasil ──
  const resultRows = data.map(d => [
    d.no, d.kode_barang, d.barcode, d.nama_barang, d.kategori,
    d.harga_beli != null ? `Rp ${Number(d.harga_beli).toLocaleString('id-ID')}` : '-',
    d.harga_jual != null ? `Rp ${Number(d.harga_jual).toLocaleString('id-ID')}` : '-',
    d.stok_saat_ini?.toLocaleString('id-ID'),
    d.total_terjual?.toLocaleString('id-ID'),
    <ClusterBadge key={d.no} cluster={d.cluster} label={d.cluster_label} />,
  ])

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard Admin – Proses K-Means</h1>
          <p className="text-gray-500 text-sm mt-1">Analisis persediaan barang menggunakan K-Means Clustering</p>
        </div>
        <div className="flex gap-3">
          <span className="bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-semibold">
            K = {n_clusters}
          </span>
          <span className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-sm font-semibold">
            Silhouette: {silhouette_score?.toFixed(4)}
          </span>
          <span className="bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg text-sm font-semibold">
            {data.length} Data
          </span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          STEP 1 — PREPROCESSING
      ═══════════════════════════════════════════ */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <button className="w-full text-left" onClick={() => toggle('pre')}>
          <SectionHeader step="1" title="Preprocessing Data"
            subtitle={`Data asli sebelum transformasi · ${preprocessing?.raw_count} baris · ${preprocessing?.dropped_count} dihapus (NaN)`}
            color="bg-gradient-to-r from-blue-600 to-blue-500" />
        </button>
        {openSection.pre && (
          <div className="p-5 space-y-4">
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="bg-blue-50 rounded-lg px-4 py-3">
                <p className="text-blue-500 text-xs">Total Data Awal</p>
                <p className="text-blue-800 font-bold text-xl">{preprocessing?.raw_count}</p>
              </div>
              <div className="bg-green-50 rounded-lg px-4 py-3">
                <p className="text-green-500 text-xs">Data Valid</p>
                <p className="text-green-800 font-bold text-xl">{preprocessing?.valid_count}</p>
              </div>
              <div className="bg-red-50 rounded-lg px-4 py-3">
                <p className="text-red-500 text-xs">Data Dihapus (NaN)</p>
                <p className="text-red-800 font-bold text-xl">{preprocessing?.dropped_count}</p>
              </div>
              <div className="bg-indigo-50 rounded-lg px-4 py-3">
                <p className="text-indigo-500 text-xs">Variabel Clustering</p>
                <p className="text-indigo-800 font-bold text-sm mt-1">stok_saat_ini, total_terjual</p>
              </div>
            </div>
            <DataTable
              columns={['No', 'Kode Barang', 'Nama Barang', 'Kategori', 'Stok Saat Ini', 'Total Terjual']}
              rows={preRows}
            />
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════
          STEP 2 — TRANSFORMASI LOG1P
      ═══════════════════════════════════════════ */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <button className="w-full text-left" onClick={() => toggle('log')}>
          <SectionHeader step="2" title="Transformasi Data – Log1p"
            subtitle="x' = log(1 + x) untuk mereduksi skewness dan menangani nilai 0"
            color="bg-gradient-to-r from-purple-600 to-purple-500" />
        </button>
        {openSection.log && (
          <div className="p-5 space-y-3">
            <div className="bg-purple-50 border border-purple-100 rounded-lg px-4 py-3 text-sm text-purple-800">
              <strong>Formula:</strong> x' = log₁p(x) = ln(1 + x) &nbsp;|&nbsp;
              Transformasi ini menstabilkan varians dan meratakan sebaran data penjualan/stok yang timpang.
            </div>
            <DataTable
              columns={['No', 'Nama Barang', 'Stok Asli', 'Terjual Asli', 'Stok (log1p)', 'Terjual (log1p)']}
              rows={logRows}
            />
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════
          STEP 3 — STANDARISASI Z-SCORE
      ═══════════════════════════════════════════ */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <button className="w-full text-left" onClick={() => toggle('zscore')}>
          <SectionHeader step="3" title="Standarisasi Data – Z-Score"
            subtitle="z = (x − μ) / σ untuk menyamakan skala antar variabel"
            color="bg-gradient-to-r from-indigo-600 to-indigo-500" />
        </button>
        {openSection.zscore && (
          <div className="p-5 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              {['stok_saat_ini', 'total_terjual'].map((feat, i) => (
                <React.Fragment key={feat}>
                  <div className="bg-indigo-50 rounded-lg px-4 py-3">
                    <p className="text-indigo-400 text-xs">μ (mean log) – {feat}</p>
                    <p className="text-indigo-800 font-mono font-bold">{preprocessing?.mean_log?.[i]?.toFixed(6)}</p>
                  </div>
                  <div className="bg-indigo-50 rounded-lg px-4 py-3">
                    <p className="text-indigo-400 text-xs">σ (std log) – {feat}</p>
                    <p className="text-indigo-800 font-mono font-bold">{preprocessing?.std_log?.[i]?.toFixed(6)}</p>
                  </div>
                </React.Fragment>
              ))}
            </div>
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-3 text-sm text-indigo-800">
              <strong>Formula:</strong> z = (x_log1p − μ_log) / σ_log
            </div>
            <DataTable
              columns={['No', 'Nama Barang', 'Stok (log1p)', 'Terjual (log1p)', 'Stok (z-score)', 'Terjual (z-score)']}
              rows={zRows}
            />
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════
          STEP 4 — K-MEANS CLUSTERING
      ═══════════════════════════════════════════ */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <button className="w-full text-left" onClick={() => toggle('kmeans')}>
          <SectionHeader step="4" title="K-Means Clustering"
            subtitle={`K=${n_clusters} · Inisialisasi: K-Means++ · random_state=42 · max_iter=300 · tol=0.0001`}
            color="bg-gradient-to-r from-emerald-600 to-emerald-500" />
        </button>
        {openSection.kmeans && (
          <div className="p-5 space-y-6">
            {/* Config badges */}
            <div className="flex flex-wrap gap-2">
              {Object.entries(kmeans_config || {}).map(([k, v]) => (
                <span key={k} className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs px-3 py-1 rounded-full font-mono">
                  {k}={String(v)}
                </span>
              ))}
            </div>

            {/* Inisialisasi Centroid Awal */}
            {initEntry && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-amber-500 text-white px-2.5 py-0.5 rounded text-xs font-bold">INISIALISASI</span>
                  <h4 className="font-bold text-gray-800 text-sm">
                    Centroid Awal Terpilih (Metode K-Means++, random_state=42)
                  </h4>
                </div>
                <p className="text-xs text-amber-800 mb-4">
                  Berdasarkan algoritma K-Means++ dengan <code>random_state=42</code>, terpilih 2 produk sebagai titik awal centroid:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(init_products || []).map((prod, ci) => (
                    <div key={ci} className={`rounded-xl border-2 p-4 bg-white shadow-sm ${ci === 0 ? 'border-blue-400' : 'border-emerald-400'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold text-white ${ci === 0 ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                          Centroid Awal C{ci}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">Baris No. {prod.no}</span>
                      </div>
                      <p className="font-bold text-gray-800 text-sm mb-1">{prod.nama_barang}</p>
                      <p className="text-xs text-gray-500 mb-3">Kategori: {prod.kategori}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2.5 rounded-lg font-mono">
                        <div>
                          <p className="text-gray-400">Stok Asli:</p>
                          <p className="font-bold text-gray-800">{prod.stok_saat_ini}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Terjual Asli:</p>
                          <p className="font-bold text-gray-800">{prod.total_terjual}</p>
                        </div>
                        <div className="col-span-2 pt-1 border-t border-gray-200 flex justify-between text-[11px] text-gray-500">
                          <span>Z-Score: [{prod.stok_scaled}, {prod.terjual_scaled}]</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Riwayat Iterasi Lengkap */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                  <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-bold">PROSES ITERASI</span>
                  Riwayat Pembaruan Centroid per Iterasi (Hingga Konvergen)
                </h4>
                <span className="text-xs text-gray-500">
                  Total Iterasi: <strong>{iterEntries.length} langkah</strong>
                </span>
              </div>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {iterEntries.map((iter, idx) => (
                  <div key={idx}
                    className={`rounded-xl border p-4 transition-all ${iter.converged ? 'border-green-400 bg-green-50 shadow-sm' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${iter.converged ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                          Iterasi {iter.iteration}
                        </span>
                        {iter.converged && (
                          <span className="text-xs bg-green-100 border border-green-300 text-green-800 px-2.5 py-0.5 rounded-full font-semibold">
                            ✓ KONVERGEN (Pergeseran ≤ 0.0001)
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 font-mono">
                        Pergeseran Centroid (Shift): <strong className={iter.converged ? 'text-green-700' : 'text-gray-800'}>{iter.centroid_shift?.toFixed(8)}</strong>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {iter.centroids_original.map((c, ci) => (
                        <div key={ci} className={`rounded-lg border p-3 text-xs font-mono bg-white ${ci === 0 ? 'border-blue-200' : 'border-emerald-200'}`}>
                          <p className={`font-bold mb-1.5 ${ci === 0 ? 'text-blue-700' : 'text-emerald-700'}`}>
                            Cluster {ci} · {iter.cluster_sizes?.[ci]} data anggota
                          </p>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Centroid Stok (Asli):</span>
                              <span className="font-semibold">{c[0]?.toFixed(4)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Centroid Terjual (Asli):</span>
                              <span className="font-semibold">{c[1]?.toFixed(4)}</span>
                            </div>
                            <div className="flex justify-between pt-1 border-t border-gray-100 text-[11px] text-gray-400">
                              <span>Z-Score: [{iter.centroids_scaled[ci]?.[0]?.toFixed(4)}, {iter.centroids_scaled[ci]?.[1]?.toFixed(4)}]</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Centroid Final & Evaluasi */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-bold">HASIL AKHIR</span>
                Centroid Final & Evaluasi Model
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(centroids_original || []).map((c, ci) => (
                  <div key={ci} className={`rounded-xl border-2 p-4 ${ci === 0 ? 'border-blue-300 bg-blue-50' : 'border-emerald-300 bg-emerald-50'}`}>
                    <p className={`font-bold text-sm mb-2 ${ci === 0 ? 'text-blue-700' : 'text-emerald-700'}`}>
                      Centroid Final – Cluster {ci}
                    </p>
                    <div className="space-y-1 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Rata-rata Stok (asli):</span>
                        <span className="font-semibold text-sm">{c[0]?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Rata-rata Terjual (asli):</span>
                        <span className="font-semibold text-sm">{c[1]?.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm flex items-center justify-between">
                <div>
                  <p className="font-semibold text-amber-800">Evaluasi Silhouette Score: <span className="text-indigo-700 font-bold">{silhouette_score?.toFixed(4)}</span></p>
                  <p className="text-amber-700 text-xs mt-0.5">
                    {silhouette_score > 0.5 ? '✅ Struktur cluster sangat baik'
                      : silhouette_score > 0.25 ? '⚠️ Struktur cluster cukup baik'
                      : '❌ Struktur cluster lemah'}
                  </p>
                </div>
                <span className="text-xs bg-amber-200 text-amber-900 font-bold px-3 py-1 rounded-full">
                  K = 2 Kluster
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════
          STEP 5 — TABEL SELURUH DATA
      ═══════════════════════════════════════════ */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <button className="w-full text-left" onClick={() => toggle('table')}>
          <SectionHeader step="5" title="Seluruh Data Hasil Clustering"
            subtitle={`${data.length} data · Semua field ditampilkan`}
            color="bg-gradient-to-r from-gray-700 to-gray-600" />
        </button>
        {openSection.table && (
          <div className="p-5">
            <DataTable
              maxH="max-h-[600px]"
              columns={[
                'No', 'Kode Barang', 'Barcode', 'Nama Barang', 'Kategori',
                'Harga Beli', 'Harga Jual', 'Stok Saat Ini', 'Total Terjual', 'Cluster'
              ]}
              rows={resultRows}
            />
          </div>
        )}
      </div>

    </div>
  )
}

export default Dashboard
