import React, { useState, useEffect } from 'react'
import Card from '../components/Card'
import Table from '../components/Table'
import Chart from '../components/Chart'
import axios from 'axios'

const Result = () => {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchResult()
  }, [])

  const fetchResult = async () => {
    try {
      const response = await axios.get('http://localhost:5000/result')
      setResult(response.data)
      setLoading(false)
    } catch (err) {
      setError(err.response?.data?.error || 'Error fetching results')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading results...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card title="Error">
        <div className="text-center text-red-600 py-8">
          <p>{error}</p>
          <p className="mt-2 text-sm">Please upload and process data first.</p>
        </div>
      </Card>
    )
  }

  if (!result) {
    return (
      <Card title="No Data">
        <div className="text-center text-gray-600 py-8">
          <p>No clustering results available.</p>
          <p className="mt-2 text-sm">Please upload data and process clustering.</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card title="Hasil Clustering">
        <div className="mb-6">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 rounded-lg">
            <h3 className="text-lg font-semibold">Silhouette Score</h3>
            <p className="text-3xl font-bold">{result.silhouette_score.toFixed(4)}</p>
            <p className="text-sm mt-1">
              Nilai Silhouette Score: {result.silhouette_score.toFixed(4)} 
              {result.silhouette_score > 0.5 
                ? ' (Struktur cluster baik)' 
                : result.silhouette_score > 0.25 
                ? ' (Struktur cluster cukup)' 
                : ' (Struktur cluster lemah)'}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Scatter Plot: Harga vs Penjualan</h3>
          <Chart data={result.data} />
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Data Hasil Clustering</h3>
          <Table data={result.data} />
        </div>
      </Card>

      <Card title="Insight Otomatis">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2">✓ Barang Laris</h3>
            <p className="text-sm text-green-700">
              {result.insights.best_sellers.length > 0 
                ? result.insights.best_sellers.join(', ')
                : 'Tidak ada barang dengan kategori ini'}
            </p>
            <p className="text-xs text-green-600 mt-2">
              Harga terjangkau dengan penjualan tinggi
            </p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-800 mb-2">⚠ Kurang Diminati</h3>
            <p className="text-sm text-red-700">
              {result.insights.slow_moving.length > 0 
                ? result.insights.slow_moving.join(', ')
                : 'Tidak ada barang dengan kategori ini'}
            </p>
            <p className="text-xs text-red-600 mt-2">
              Harga tinggi dengan penjualan rendah
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">⚠ Berpotensi Menumpuk</h3>
            <p className="text-sm text-yellow-700">
              {result.insights.overstock.length > 0 
                ? result.insights.overstock.join(', ')
                : 'Tidak ada barang dengan kategori ini'}
            </p>
            <p className="text-xs text-yellow-600 mt-2">
              Stok tinggi tapi penjualan rendah
            </p>
          </div>
        </div>

        <div className="mt-4 bg-gray-50 p-4 rounded">
          <h3 className="font-semibold text-gray-800 mb-2">Rekomendasi Strategi:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            {result.insights.best_sellers.length > 0 && (
              <li>✓ Tingkatkan stok untuk barang laris untuk menghindari kehabisan stok</li>
            )}
            {result.insights.slow_moving.length > 0 && (
              <li>✓ Lakukan promosi atau diskon untuk barang kurang diminati</li>
            )}
            {result.insights.overstock.length > 0 && (
              <li>✓ Evaluasi strategi pembelian untuk barang dengan potensi menumpuk</li>
            )}
          </ul>
        </div>
      </Card>
    </div>
  )
}

export default Result