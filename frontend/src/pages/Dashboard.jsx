import React from 'react'
import Card from '../components/Card'
import { Link } from 'react-router-dom'

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Analisis dan Segmentasi Data Barang
        </h1>
        <p className="text-gray-600">
          Menggunakan Metode K-Means Clustering dengan Evaluasi Silhouette Score
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Upload Data">
          <p className="text-gray-600 mb-4">
            Upload file Excel (.xlsx) yang berisi data barang dengan kolom:
            harga, stok, dan penjualan.
          </p>
          <Link
            to="/upload"
            className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Upload Sekarang
          </Link>
        </Card>

        <Card title="Proses Clustering">
          <p className="text-gray-600 mb-4">
            Sistem akan melakukan preprocessing, normalisasi data, dan
            menjalankan algoritma K-Means Clustering untuk mengelompokkan barang.
          </p>
          <div className="text-sm text-gray-500">
            • K = 3 clusters<br />
            • Evaluasi Silhouette Score<br />
            • Insight otomatis
          </div>
        </Card>

        <Card title="Lihat Hasil">
          <p className="text-gray-600 mb-4">
            Tampilkan hasil clustering dalam bentuk tabel dan grafik scatter plot.
            Dapatkan insight dari setiap kelompok barang.
          </p>
          <Link
            to="/result"
            className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Lihat Hasil
          </Link>
        </Card>
      </div>

      <Card title="Metodologi">
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-gray-800">K-Means Clustering</h3>
            <p className="text-gray-600">
              Algoritma unsupervised learning yang mengelompokkan data berdasarkan kemiripan fitur.
              Dalam penelitian ini, digunakan 3 cluster untuk mengelompokkan barang berdasarkan
              harga, stok, dan penjualan.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">Silhouette Score</h3>
            <p className="text-gray-600">
              Metode evaluasi untuk mengukur kualitas clustering. Nilai berkisar antara -1 hingga 1,
              dimana semakin mendekati 1 menunjukkan clustering yang baik.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default Dashboard