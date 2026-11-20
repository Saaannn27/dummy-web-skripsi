from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score
import os
import json

app = Flask(__name__)
CORS(app)

# Folder untuk menyimpan file upload
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Global variable untuk menyimpan hasil clustering
raw_data = None
clustering_result = None

@app.route('/upload', methods=['POST'])
def upload_file():
    try:
        global raw_data
        
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not file.filename.endswith('.xlsx'):
            return jsonify({'error': 'File must be .xlsx format'}), 400
        
        # Simpan file
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        file.save(filepath)
        
        # Baca file Excel
        df = pd.read_excel(filepath)
        
        # Cek kolom yang diperlukan
        required_columns = ['harga', 'stok', 'penjualan']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            return jsonify({'error': f'Missing columns: {missing_columns}'}), 400
        
        # Jika tidak ada kolom nama_barang, buat kolom default
        if 'nama_barang' not in df.columns:
            df['nama_barang'] = [f'Item {i+1}' for i in range(len(df))]
        
        # Simpan data untuk proses selanjutnya
        raw_data = df
        raw_data['filename'] = file.filename
        
        return jsonify({
            'message': 'File uploaded successfully',
            'filename': file.filename,
            'columns': list(df.columns),
            'row_count': len(df)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/process', methods=['POST'])
def process_clustering():
    try:
        global raw_data, clustering_result
        
        if raw_data is None:
            return jsonify({'error': 'No data uploaded. Please upload file first.'}), 400
        
        # Ambil data yang diperlukan
        data = raw_data[['harga', 'stok', 'penjualan']].copy()
        
        # Preprocessing: Bersihkan data (hapus NaN)
        data = data.dropna()
        
        if len(data) == 0:
            return jsonify({'error': 'No valid data after cleaning'}), 400
        
        # Normalisasi data
        scaler = StandardScaler()
        data_scaled = scaler.fit_transform(data)
        
        # Jalankan K-Means dengan K=3
        k = 3
        kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
        clusters = kmeans.fit_predict(data_scaled)
        
        # Hitung Silhouette Score
        if len(set(clusters)) > 1:  # Silhouette score membutuhkan minimal 2 cluster
            silhouette_avg = silhouette_score(data_scaled, clusters)
        else:
            silhouette_avg = 0
        
        # Simpan hasil clustering
        raw_data['cluster'] = None
        raw_data.loc[data.index, 'cluster'] = clusters
        
        # Hitung median untuk insight
        median_harga = raw_data['harga'].median()
        median_penjualan = raw_data['penjualan'].median()
        median_stok = raw_data['stok'].median()
        
        # Generate insight otomatis
        insights = generate_insights(raw_data.loc[data.index], median_harga, median_penjualan, median_stok)
        
        # Siapkan data untuk response
        result_data = []
        for idx, row in raw_data.iterrows():
            if pd.notna(row.get('cluster')):
                insight = get_insight_for_item(
                    row['harga'], 
                    row['penjualan'], 
                    row['stok'],
                    median_harga,
                    median_penjualan,
                    median_stok
                )
                result_data.append({
                    'nama_barang': row.get('nama_barang', f'Item {idx}'),
                    'harga': float(row['harga']),
                    'stok': float(row['stok']),
                    'penjualan': float(row['penjualan']),
                    'cluster': int(row['cluster']),
                    'insight': insight
                })
        
        clustering_result = {
            'data': result_data,
            'silhouette_score': float(silhouette_avg),
            'n_clusters': k,
            'centroids': scaler.inverse_transform(kmeans.cluster_centers_).tolist(),
            'insights': insights
        }
        
        return jsonify(clustering_result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/result', methods=['GET'])
def get_result():
    global clustering_result
    
    if clustering_result is None:
        return jsonify({'error': 'No processed data. Please process clustering first.'}), 400
    
    return jsonify(clustering_result), 200

def generate_insights(df, median_harga, median_penjualan, median_stok):
    """Generate insights berdasarkan data"""
    insights = {
        'best_sellers': [],
        'slow_moving': [],
        'overstock': []
    }
    
    for idx, row in df.iterrows():
        insight = get_insight_for_item(
            row['harga'], 
            row['penjualan'], 
            row['stok'],
            median_harga,
            median_penjualan,
            median_stok
        )
        
        if 'Barang Laris' in insight:
            nama = row.get('nama_barang', f'Item {idx}')
            insights['best_sellers'].append(nama)
        elif 'Kurang Diminati' in insight:
            nama = row.get('nama_barang', f'Item {idx}')
            insights['slow_moving'].append(nama)
        elif 'Berpotensi Menumpuk' in insight:
            nama = row.get('nama_barang', f'Item {idx}')
            insights['overstock'].append(nama)
    
    return insights

def get_insight_for_item(harga, penjualan, stok, median_harga, median_penjualan, median_stok):
    """Generate insight untuk satu item"""
    if harga < median_harga and penjualan > median_penjualan:
        return "Barang Laris - Harga terjangkau dengan penjualan tinggi"
    elif harga > median_harga and penjualan < median_penjualan:
        return "Kurang Diminati - Harga tinggi dengan penjualan rendah"
    elif stok > median_stok and penjualan < median_penjualan:
        return "Berpotensi Menumpuk - Stok tinggi tapi penjualan rendah"
    else:
        return "Normal - Dalam batas wajar"

if __name__ == '__main__':
    app.run(debug=True, port=5000)