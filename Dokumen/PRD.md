# Product Requirements Document (PRD)
## Web Penjualan Sepatu

**Versi:** 1.0  
**Status:** Draft  
**Platform:** Web responsif  
**Frontend:** HTML, CSS, JavaScript, React.js  
**Database (rencana):** MySQL melalui XAMPP  
**Bahasa antarmuka:** Indonesia

---

## 1. Ringkasan Produk

Web Penjualan Sepatu adalah aplikasi e-commerce yang memungkinkan pelanggan melihat katalog sepatu, mencari dan memfilter produk, memasukkan produk ke keranjang, membuat pesanan, serta melihat status pesanan. Admin mengelola katalog, stok, kategori, dan pesanan melalui dashboard khusus.

React.js digunakan untuk membangun antarmuka interaktif. HTML menjadi struktur halaman, CSS mengatur tampilan, dan JavaScript menangani logika interaksi. Jika MySQL/XAMPP digunakan, aplikasi juga memerlukan backend/API untuk menghubungkan frontend dengan database; React.js tidak mengakses MySQL secara langsung.

## 2. Latar Belakang dan Masalah

Pembelian sepatu secara daring membutuhkan informasi produk yang jelas, pilihan ukuran, harga, dan ketersediaan stok. Pengelolaan yang hanya mengandalkan pencatatan terpisah berisiko menyebabkan informasi produk atau stok tidak konsisten. Aplikasi ini dirancang untuk memusatkan informasi katalog dan pesanan dalam satu sistem.

Masalah yang ingin dijawab:
1. Pelanggan kesulitan menemukan dan membandingkan produk jika katalog tidak tersusun dengan baik.
2. Informasi ukuran dan stok perlu ditampilkan dengan jelas.
3. Admin membutuhkan satu tempat untuk mengelola produk dan pesanan.
4. Status pesanan perlu dapat ditelusuri oleh pelanggan dan admin.

## 3. Tujuan Produk

- Menyediakan katalog sepatu yang mudah dijelajahi.
- Memudahkan pelanggan mencari produk berdasarkan kata kunci, kategori, harga, dan ukuran.
- Menyediakan alur keranjang dan checkout yang jelas.
- Membantu admin mengelola produk, variasi ukuran, stok, dan pesanan.
- Menjaga data pesanan, pelanggan, dan inventaris tetap konsisten.
- Menyediakan tampilan yang responsif di desktop maupun perangkat seluler.

## 4. Pengguna dan Hak Akses

### 4.1 Pelanggan
- Melihat katalog dan detail produk.
- Mencari dan memfilter produk.
- Memilih ukuran dan jumlah sesuai stok.
- Mengelola keranjang belanja.
- Mendaftar, masuk, dan mengelola profil.
- Membuat pesanan serta mengisi alamat pengiriman.
- Melihat riwayat dan status pesanan.

### 4.2 Admin
- Masuk ke dashboard admin.
- Melihat ringkasan produk, stok, dan pesanan.
- Menambah, mengubah, dan menonaktifkan produk.
- Mengelola kategori, foto, harga, ukuran, dan stok.
- Melihat detail pesanan.
- Memperbarui status pesanan.
- Melihat data pelanggan seperlunya untuk pemrosesan pesanan.

**Batas akses:** pelanggan tidak boleh membuka fungsi admin hanya dengan mengubah URL atau tampilan browser. Hak akses harus divalidasi di backend/API.

## 5. Ruang Lingkup

### 5.1 Fitur dalam MVP
1. Autentikasi dan otorisasi pelanggan/admin.
2. Beranda dan katalog produk.
3. Pencarian dan filter produk.
4. Detail produk, ukuran, harga, foto, dan stok.
5. Keranjang belanja.
6. Checkout dan pembuatan pesanan.
7. Riwayat serta status pesanan pelanggan.
8. Dashboard admin.
9. CRUD produk dan kategori.
10. Pengelolaan stok per variasi ukuran.
11. Pengelolaan status pesanan.

### 5.2 Di luar Ruang Lingkup MVP
- Sinkronisasi otomatis dengan marketplace pihak ketiga.
- Aplikasi Android/iOS native.
- Sistem loyalitas dan poin.
- Rekomendasi produk berbasis AI.
- Integrasi kurir atau pelacakan langsung, kecuali ditambahkan pada fase berikutnya.

### 5.3 Pembayaran
MVP dapat dimulai dengan metode **transfer bank/manual** dan verifikasi admin. Pembayaran otomatis melalui payment gateway merupakan pengembangan lanjutan. Jangan menampilkan pesanan sebagai lunas sebelum pembayaran diverifikasi atau dikonfirmasi oleh integrasi tepercaya.

## 6. Alur Pengguna Utama

### Pelanggan
1. Membuka beranda dan menjelajahi katalog.
2. Memilih produk untuk melihat detail.
3. Memilih ukuran dan jumlah.
4. Menambahkan produk ke keranjang.
5. Masuk atau mendaftar jika belum terautentikasi.
6. Mengisi alamat dan memilih metode pembayaran yang tersedia.
7. Meninjau ringkasan dan mengirim pesanan.
8. Melihat nomor pesanan dan statusnya.

### Admin
1. Masuk melalui halaman admin.
2. Melihat ringkasan dashboard.
3. Mengelola produk, kategori, variasi ukuran, dan stok.
4. Memeriksa pesanan baru dan bukti pembayaran bila pembayaran manual digunakan.
5. Memperbarui status pesanan sesuai proses operasional.

## 7. Kebutuhan Fungsional Tingkat Produk

| ID | Kebutuhan | Prioritas |
|---|---|---|
| PRD-01 | Pelanggan dapat melihat katalog dan detail sepatu | Must |
| PRD-02 | Pelanggan dapat mencari dan memfilter produk | Must |
| PRD-03 | Pelanggan dapat memilih ukuran dan jumlah sesuai stok | Must |
| PRD-04 | Pelanggan dapat mengelola keranjang | Must |
| PRD-05 | Pelanggan dapat checkout dan membuat pesanan | Must |
| PRD-06 | Pelanggan dapat melihat riwayat/status pesanan | Must |
| PRD-07 | Admin dapat mengelola produk dan kategori | Must |
| PRD-08 | Admin dapat mengelola stok per ukuran | Must |
| PRD-09 | Admin dapat memproses dan memperbarui status pesanan | Must |
| PRD-10 | Sistem menerapkan akses berdasarkan peran | Must |
| PRD-11 | Sistem menampilkan dashboard ringkas bagi admin | Should |
| PRD-12 | Sistem mendukung kupon, ulasan, dan wishlist | Could / fase berikutnya |

## 8. Kebutuhan Nonfungsional Tingkat Produk

- **Usability:** navigasi konsisten, pesan kesalahan jelas, dan proses checkout mudah dipahami.
- **Responsif:** dapat digunakan pada ponsel, tablet, dan desktop.
- **Keamanan:** kata sandi disimpan dalam bentuk hash di backend; validasi hak akses dilakukan di server.
- **Kinerja:** katalog dan halaman utama harus memuat secara wajar pada koneksi umum; gambar dioptimalkan.
- **Integritas data:** stok dan total pesanan dihitung serta divalidasi di backend, bukan dipercaya dari browser.
- **Maintainability:** kode dipisahkan menjadi komponen, halaman, layanan API, dan konfigurasi.
- **Kompatibilitas:** mendukung versi terbaru browser modern utama.

## 9. Indikator Keberhasilan

- Pelanggan dapat menyelesaikan alur katalog hingga pembuatan pesanan tanpa kesalahan kritis.
- Admin dapat menambah/mengubah produk dan memproses pesanan.
- Sistem menolak akses tanpa izin terhadap halaman dan API admin.
- Stok tidak menjadi negatif akibat pemrosesan pesanan.
- Tidak ada kesalahan kritis yang diketahui pada alur login, keranjang, checkout, dan pengelolaan pesanan saat pengujian penerimaan.

## 10. Asumsi dan Ketergantungan

- Data produk, foto, ukuran, harga, dan stok disediakan oleh pengelola toko.
- Nama toko, identitas visual, kebijakan pengiriman, dan kebijakan retur ditentukan sebelum peluncuran.
- Jika memakai MySQL/XAMPP, backend/API harus disiapkan secara terpisah (misalnya Node.js + Express) atau melalui teknologi backend lain yang dipilih. HTML/CSS/JavaScript dan React.js saja tidak cukup untuk mengamankan koneksi database.
- Lingkungan lokal XAMPP digunakan untuk pengembangan database; deployment produksi memerlukan hosting backend dan database yang sesuai.

## 11. Risiko dan Mitigasi

| Risiko | Mitigasi |
|---|---|
| Stok berubah saat pelanggan checkout | Validasi dan pengurangan stok secara atomik/transaksional di backend |
| Pengguna mengakses fungsi admin | Otorisasi backend untuk setiap endpoint admin |
| Harga dimanipulasi dari browser | Hitung ulang harga dan total dari data database di backend |
| Foto terlalu besar | Kompresi, ukuran gambar yang konsisten, dan lazy loading |
| Pembayaran manual tidak jelas | Status pembayaran terpisah dari status pemenuhan pesanan dan verifikasi admin |

## 12. Rencana Pengembangan

1. Finalisasi kebutuhan dan desain UI/UX.
2. Rancang skema database dan backend API.
3. Bangun autentikasi dan otorisasi.
4. Bangun katalog dan detail produk.
5. Bangun keranjang dan checkout.
6. Bangun dashboard admin.
7. Uji fungsional, keamanan dasar, responsivitas, dan alur pesanan.
8. Deploy dan siapkan panduan penggunaan.

## 13. Kriteria Penerimaan Produk

Produk dinyatakan siap untuk MVP jika seluruh fitur prioritas Must berjalan, data penting tervalidasi di backend, peran pelanggan/admin dipisahkan dengan benar, alur pesanan dapat diuji dari awal hingga akhir, dan dokumentasi instalasi tersedia.
