import React from 'react'

const Table = ({ data }) => {
  const getClusterColor = (cluster) => {
    const colors = {
      0: 'bg-red-100 text-red-800',
      1: 'bg-green-100 text-green-800',
      2: 'bg-blue-100 text-blue-800',
    }
    return colors[cluster] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Barang</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harga (Rp)</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stok</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Penjualan</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cluster</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Insight</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item, index) => (
            <tr key={index} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.nama_barang}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Rp {item.harga.toLocaleString()}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.stok.toLocaleString()}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.penjualan.toLocaleString()}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getClusterColor(item.cluster)}`}>
                  Cluster {item.cluster}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">{item.insight}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Table