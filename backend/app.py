from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.cluster import kmeans_plusplus
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score
import os
import io
import re
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.enums import TA_CENTER, TA_LEFT

app = Flask(__name__)
CORS(app)

# ─── Konfigurasi ───────────────────────────────────────────────────────────────
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Kolom wajib untuk proses clustering
REQUIRED_COLUMNS = ['stok_saat_ini', 'total_terjual']

# Daftar sinonim fleksibel untuk mengenali variasi nama kolom dari file Excel
COLUMN_SYNONYMS = {
    'stok_saat_ini': [
        'stok_saat_ini', 'stok saat ini', 'stok', 'stock', 'current_stock', 
        'stok_sekarang', 'sisa_stok', 'stok akhir', 'stok_akhir', 'jumlah_stok'
    ],
    'total_terjual': [
        'total_terjual', 'total terjual', 'terjual', 'penjualan', 
        'total_penjualan', 'qty_terjual', 'sales', 'jumlah_terjual', 'terjual_unit', 'total_sales'
    ],
    'no': ['no', 'no.', 'nomor', 'number', 'num', 'no_urut', 'id'],
    'kode_barang': ['kode_barang', 'kode barang', 'kode', 'item_code', 'kode_produk', 'kd_barang', 'kd_produk'],
    'barcode': ['barcode', 'kode_barcode', 'bar_code', 'upc', 'ean'],
    'nama_barang': ['nama_barang', 'nama barang', 'nama', 'item_name', 'produk', 'nama_produk', 'deskripsi', 'nama_item'],
    'kategori': ['kategori', 'kategori_barang', 'category', 'jenis', 'jenis_barang', 'kelompok', 'group'],
    'harga_beli': ['harga_beli', 'harga beli', 'harga_pokok', 'beli', 'hpp', 'modal', 'cost_price'],
    'harga_jual': ['harga_jual', 'harga jual', 'jual', 'harga', 'price', 'selling_price']
}

# Konfigurasi K-Means
KMEANS_CONFIG = {
    'n_clusters': 2,
    'init': 'k-means++',
    'random_state': 42,
    'n_init': 10,
    'max_iter': 300,
    'tol': 0.0001,
}

# ─── Global state ───────────────────────────────────────────────────────────────
raw_data = None
clustering_result = None
preprocessing_log = None

# ─── Helpers ────────────────────────────────────────────────────────────────────

def clean_str(val):
    if pd.isna(val) or val is None:
        return '-'
    if isinstance(val, float) and val.is_integer():
        return str(int(val))
    val_str = str(val).strip()
    return val_str if val_str else '-'

def safe_int(val, default=1):
    try:
        return int(float(val))
    except Exception:
        return default

def safe_float(val):
    try:
        if pd.isna(val) or val is None:
            return None
        if isinstance(val, str):
            cleaned = re.sub(r'[^\d.-]', '', val.replace(',', '.'))
            return float(cleaned) if cleaned else None
        return float(val)
    except Exception:
        return None

def get_cluster_label(cluster_id, centroids_original):
    """Tentukan label cluster berdasarkan centroid di ruang asli."""
    c = centroids_original[cluster_id]
    terjual_mean = c[1]
    all_terjual = [centroids_original[i][1] for i in range(len(centroids_original))]
    rank = sorted(all_terjual, reverse=True)
    if terjual_mean == rank[0]:
        return 'Laku'
    else:
        return 'Tidak Laku'

def load_and_standardize_excel(filepath):
    """
    Membaca file Excel secara cerdas:
    1. Memeriksa semua sheets (menangani sheet pertama yang kosong).
    2. Mendeteksi baris header secara dinamis (header=0, 1, 2, dll).
    3. Memetakan variasi nama kolom menjadi nama kolom standar.
    """
    xl = pd.ExcelFile(filepath)
    best_df = None
    best_mapping = {}
    best_score = -1
    best_sheet = None

    for sheet_name in xl.sheet_names:
        for header_idx in [0, 1, 2, 3]:
            try:
                df = xl.parse(sheet_name, header=header_idx)
                if df.empty or len(df.columns) <= 1:
                    continue
                
                col_mapping = {}
                norm_cols = {col: re.sub(r'[^a-z0-9]', '_', str(col).strip().lower()).strip('_') for col in df.columns}
                
                for std_col, synonyms in COLUMN_SYNONYMS.items():
                    norm_synonyms = [re.sub(r'[^a-z0-9]', '_', s.lower()).strip('_') for s in synonyms]
                    for orig_col, norm_col in norm_cols.items():
                        if norm_col in norm_synonyms and std_col not in col_mapping.values():
                            col_mapping[orig_col] = std_col
                            break
                
                has_stok = 'stok_saat_ini' in col_mapping.values()
                has_terjual = 'total_terjual' in col_mapping.values()
                score = (100 if has_stok else 0) + (100 if has_terjual else 0) + len(col_mapping) * 5 + min(len(df), 50)
                
                if has_stok and has_terjual and score > best_score:
                    best_score = score
                    best_df = df
                    best_mapping = col_mapping
                    best_sheet = sheet_name
            except Exception:
                continue

    if best_df is None:
        first_non_empty = None
        for sheet_name in xl.sheet_names:
            try:
                df = xl.parse(sheet_name)
                if not df.empty and len(df.columns) > 0:
                    first_non_empty = df
                    break
            except Exception:
                pass
        
        cols_found = [str(c) for c in first_non_empty.columns] if first_non_empty is not None else []
        raise ValueError(
            f"Kolom wajib ('stok saat ini' dan 'total terjual') tidak ditemukan di sheet manapun. "
            f"Sheet yang ada: {xl.sheet_names}. Kolom terdeteksi: {cols_found}"
        )

    # Lakukan standarisasi nama kolom
    renamed_df = best_df.rename(columns=best_mapping)
    renamed_df = renamed_df.dropna(how='all').reset_index(drop=True)
    
    return renamed_df, best_sheet, list(best_mapping.values())

# ─── Routes ─────────────────────────────────────────────────────────────────────

@app.route('/upload', methods=['POST'])
def upload_file():
    global raw_data
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'Tidak ada file yang di-upload'}), 400
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'Tidak ada file yang dipilih'}), 400
        if not file.filename.endswith('.xlsx'):
            return jsonify({'error': 'Format file harus .xlsx'}), 400

        filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        file.save(filepath)

        # Gunakan pembaca cerdas
        df, sheet_name, detected_cols = load_and_standardize_excel(filepath)

        # Validasi kolom wajib
        missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
        if missing:
            return jsonify({
                'error': f'Kolom wajib tidak ditemukan: {missing}. '
                         f'Pastikan file memiliki kolom stok saat ini dan total terjual.'
            }), 400

        raw_data = df
        return jsonify({
            'message': 'File berhasil di-upload dan diproses',
            'filename': file.filename,
            'sheet_name': sheet_name,
            'columns': list(df.columns),
            'detected_columns': detected_cols,
            'row_count': len(df)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/process', methods=['POST'])
def process_clustering():
    global raw_data, clustering_result, preprocessing_log
    try:
        if raw_data is None:
            return jsonify({'error': 'Belum ada data. Silakan upload file terlebih dahulu.'}), 400

        df = raw_data.copy()

        # ── 1. Ambil fitur yang dipakai (stok_saat_ini & total_terjual) ───────
        features = df[REQUIRED_COLUMNS].copy()
        
        # Bersihkan format teks numerik jika ada
        for col in REQUIRED_COLUMNS:
            features[col] = features[col].apply(safe_float)

        # ── 2. Preprocessing: hapus NaN ──────────────────────────────────────
        valid_mask = features.notna().all(axis=1)
        features_clean = features[valid_mask].reset_index(drop=True)
        df_clean = df[valid_mask].reset_index(drop=True)

        if len(features_clean) == 0:
            return jsonify({'error': 'Tidak ada data valid setelah pembersihan nilai kosong'}), 400

        # Simpan data mentah setelah bersih
        raw_values = features_clean.values.tolist()

        # ── 3. Transformasi Log1p ─────────────────────────────────────────────
        # log1p(x) = log(1 + x)
        features_log = np.log1p(np.maximum(features_clean.values.astype(float), 0))
        log_values = features_log.tolist()

        # ── 4. Standarisasi Z-Score ───────────────────────────────────────────
        scaler = StandardScaler()
        features_scaled = scaler.fit_transform(features_log)
        scaled_values = features_scaled.tolist()

        mean_log = scaler.mean_.tolist()
        std_log = scaler.scale_.tolist()

        # Helper konversi z-score scaled ke nilai asli
        def to_original(c_scaled):
            c_log = np.array(c_scaled) * scaler.scale_ + scaler.mean_
            return np.expm1(c_log).tolist()

        # ── 5. Inisialisasi Centroid Awal K-Means++ ───────────────────────────
        # Menggunakan random_state=42 dan n_clusters=2
        centers_init, indices_init = kmeans_plusplus(
            features_scaled, 
            n_clusters=KMEANS_CONFIG['n_clusters'], 
            random_state=KMEANS_CONFIG['random_state']
        )

        init_products = []
        for c_idx, row_idx in enumerate(indices_init):
            row_item = df_clean.iloc[row_idx]
            init_products.append({
                'cluster': c_idx,
                'index': int(row_idx),
                'no': safe_int(row_item.get('no'), default=int(row_idx) + 1),
                'nama_barang': clean_str(row_item.get('nama_barang')),
                'kategori': clean_str(row_item.get('kategori')),
                'stok_saat_ini': float(features_clean.iloc[row_idx]['stok_saat_ini']),
                'total_terjual': float(features_clean.iloc[row_idx]['total_terjual']),
                'stok_scaled': round(float(centers_init[c_idx][0]), 6),
                'terjual_scaled': round(float(centers_init[c_idx][1]), 6),
            })

        iteration_history = []
        iteration_history.append({
            'iteration': 0,
            'type': 'init',
            'centroids_scaled': centers_init.tolist(),
            'centroids_original': [to_original(c) for c in centers_init],
            'init_products': init_products,
            'description': f"Inisialisasi centroid awal (K-Means++): {init_products[0]['nama_barang']} dan {init_products[1]['nama_barang']}"
        })

        # ── 6. Iterasi K-Means Langkah Demi Langkah ──────────────────────────
        current_centroids = centers_init.copy()
        tol = KMEANS_CONFIG['tol']
        max_iter = KMEANS_CONFIG['max_iter']
        clusters = np.zeros(len(features_scaled), dtype=int)
        converged_iter = 0

        for it in range(1, max_iter + 1):
            # Assignment: tentukan jarak terdekat ke centroid
            dists = np.linalg.norm(features_scaled[:, np.newaxis] - current_centroids[np.newaxis, :], axis=2)
            clusters = np.argmin(dists, axis=1)

            # Update: hitung titik pusat baru dari masing-masing cluster
            new_centroids = np.array([
                features_scaled[clusters == k].mean(axis=0) if np.any(clusters == k) else current_centroids[k]
                for k in range(KMEANS_CONFIG['n_clusters'])
            ])

            shift = np.linalg.norm(new_centroids - current_centroids)

            entry = {
                'iteration': it,
                'type': 'iteration',
                'centroids_scaled': new_centroids.tolist(),
                'centroids_original': [to_original(c) for c in new_centroids],
                'centroid_shift': round(float(shift), 8),
                'cluster_sizes': [int(np.sum(clusters == k)) for k in range(KMEANS_CONFIG['n_clusters'])],
                'description': f"Iterasi {it}: pergeseran centroid = {shift:.8f}"
            }

            if shift <= tol:
                entry['converged'] = True
                entry['description'] += f" → KONVERGEN (pergeseran <= {tol})"
                iteration_history.append(entry)
                converged_iter = it
                current_centroids = new_centroids
                break

            iteration_history.append(entry)
            current_centroids = new_centroids

        if converged_iter == 0:
            converged_iter = max_iter

        # Centroid final
        centroids_scaled = current_centroids.tolist()
        centroids_original = [to_original(c) for c in current_centroids]
        centroids_log = (np.array(current_centroids) * scaler.scale_ + scaler.mean_).tolist()

        # Silhouette score
        sil_score = float(silhouette_score(features_scaled, clusters)) if len(set(clusters)) > 1 else 0.0

        # ── 7. Susun hasil data akhir ────────────────────────────────────────
        result_data = []
        for i, row in df_clean.iterrows():
            cluster_id = int(clusters[i])
            label = get_cluster_label(cluster_id, centroids_original)
            item = {
                'no': safe_int(row.get('no'), default=i + 1),
                'kode_barang': clean_str(row.get('kode_barang')),
                'barcode': clean_str(row.get('barcode')),
                'nama_barang': clean_str(row.get('nama_barang')) if row.get('nama_barang') is not None else f'Item {i+1}',
                'kategori': clean_str(row.get('kategori')),
                'harga_beli': safe_float(row.get('harga_beli')),
                'harga_jual': safe_float(row.get('harga_jual')),
                'stok_saat_ini': float(features_clean.iloc[i]['stok_saat_ini']),
                'total_terjual': float(features_clean.iloc[i]['total_terjual']),
                'stok_log': round(log_values[i][0], 6),
                'terjual_log': round(log_values[i][1], 6),
                'stok_scaled': round(scaled_values[i][0], 6),
                'terjual_scaled': round(scaled_values[i][1], 6),
                'cluster': cluster_id,
                'cluster_label': label,
            }
            result_data.append(item)

        clustering_result = {
            'data': result_data,
            'silhouette_score': sil_score,
            'n_clusters': KMEANS_CONFIG['n_clusters'],
            'kmeans_config': KMEANS_CONFIG,
            'init_products': init_products,
            'centroids_scaled': centroids_scaled,
            'centroids_log': centroids_log,
            'centroids_original': centroids_original,
            'n_iter': converged_iter,
            'total_steps': len(iteration_history),
            'iteration_history': iteration_history,
            'preprocessing': {
                'raw_count': len(df),
                'valid_count': len(df_clean),
                'dropped_count': len(df) - len(df_clean),
                'features': REQUIRED_COLUMNS,
                'mean_log': mean_log,
                'std_log': std_log,
            }
        }

        preprocessing_log = clustering_result['preprocessing']

        return jsonify(clustering_result), 200

    except Exception as e:
        import traceback
        return jsonify({'error': str(e), 'trace': traceback.format_exc()}), 500


@app.route('/result', methods=['GET'])
def get_result():
    global clustering_result
    if clustering_result is None:
        return jsonify({'error': 'Belum ada hasil. Silakan proses clustering terlebih dahulu.'}), 400
    return jsonify(clustering_result), 200


@app.route('/download/excel', methods=['GET'])
def download_excel():
    global clustering_result
    if clustering_result is None:
        return jsonify({'error': 'Belum ada hasil'}), 400
    try:
        data = clustering_result['data']
        df_out = pd.DataFrame(data)

        cols_map = {
            'no': 'No',
            'kode_barang': 'Kode Barang',
            'barcode': 'Barcode',
            'nama_barang': 'Nama Barang',
            'kategori': 'Kategori',
            'harga_beli': 'Harga Beli',
            'harga_jual': 'Harga Jual',
            'stok_saat_ini': 'Stok Saat Ini',
            'total_terjual': 'Total Terjual',
            'cluster': 'Cluster',
            'cluster_label': 'Label Cluster',
        }
        existing = [c for c in cols_map if c in df_out.columns]
        df_out = df_out[existing].rename(columns={c: cols_map[c] for c in existing})

        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df_out.to_excel(writer, index=False, sheet_name='Hasil Clustering')
        output.seek(0)
        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name='hasil_clustering.xlsx'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/download/pdf', methods=['GET'])
def download_pdf():
    global clustering_result
    if clustering_result is None:
        return jsonify({'error': 'Belum ada hasil'}), 400
    try:
        data = clustering_result['data']
        output = io.BytesIO()

        doc = SimpleDocTemplate(
            output,
            pagesize=landscape(A4),
            rightMargin=1*cm, leftMargin=1*cm,
            topMargin=1.5*cm, bottomMargin=1.5*cm
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle('title', parent=styles['Title'], fontSize=14, alignment=TA_CENTER)
        sub_style = ParagraphStyle('sub', parent=styles['Normal'], fontSize=9, alignment=TA_CENTER)

        elements = []
        elements.append(Paragraph('Laporan Hasil Analisis Clustering K-Means', title_style))
        elements.append(Paragraph(f"Jumlah Cluster: {clustering_result['n_clusters']}  |  "
                                   f"Silhouette Score: {clustering_result['silhouette_score']:.4f}", sub_style))
        elements.append(Spacer(1, 0.4*cm))

        headers = ['No', 'Kode Barang', 'Nama Barang', 'Kategori',
                   'Stok Saat Ini', 'Total Terjual', 'Cluster', 'Label']
        col_map = ['no', 'kode_barang', 'nama_barang', 'kategori',
                   'stok_saat_ini', 'total_terjual', 'cluster', 'cluster_label']

        table_data = [headers]
        for item in data:
            row = [str(item.get(c, '-')) for c in col_map]
            table_data.append(row)

        col_widths = [1*cm, 2.5*cm, 5*cm, 3*cm, 2.5*cm, 2.5*cm, 1.8*cm, 2.5*cm]
        t = Table(table_data, colWidths=col_widths, repeatRows=1)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4F46E5')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 8),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTSIZE', (0, 1), (-1, -1), 7),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#EEF2FF')]),
            ('GRID', (0, 0), (-1, -1), 0.3, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        elements.append(t)

        doc.build(elements)
        output.seek(0)
        return send_file(
            output,
            mimetype='application/pdf',
            as_attachment=True,
            download_name='hasil_clustering.pdf'
        )
    except Exception as e:
        import traceback
        return jsonify({'error': str(e), 'trace': traceback.format_exc()}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)
