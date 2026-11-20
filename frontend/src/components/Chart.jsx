import React from 'react'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const Chart = ({ data }) => {
  const getColorByCluster = (cluster) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']
    return colors[cluster % colors.length]
  }

  const scatterData = data.map(item => ({
    x: item.harga,
    y: item.penjualan,
    cluster: item.cluster,
    name: item.nama_barang,
    stok: item.stok
  }))

  return (
    <div className="w-full h-96">
      <ResponsiveContainer>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            type="number" 
            dataKey="x" 
            name="Harga" 
            label={{ value: 'Harga (Rp)', position: 'bottom', offset: 0 }}
          />
          <YAxis 
            type="number" 
            dataKey="y" 
            name="Penjualan" 
            label={{ value: 'Penjualan (unit)', angle: -90, position: 'left' }}
          />
          <Tooltip 
            content={({ payload }) => {
              if (payload && payload[0]) {
                const data = payload[0].payload
                return (
                  <div className="bg-white p-3 shadow-lg rounded border border-gray-200">
                    <p className="font-semibold">{data.name}</p>
                    <p>Harga: Rp {data.x.toLocaleString()}</p>
                    <p>Penjualan: {data.y.toLocaleString()} unit</p>
                    <p>Stok: {data.stok.toLocaleString()}</p>
                    <p>Cluster: {data.cluster}</p>
                  </div>
                )
              }
              return null
            }}
          />
          <Legend />
          {[...new Set(scatterData.map(d => d.cluster))].map(cluster => (
            <Scatter
              key={cluster}
              name={`Cluster ${cluster}`}
              data={scatterData.filter(d => d.cluster === cluster)}
              fill={getColorByCluster(cluster)}
              shape="circle"
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}

export default Chart