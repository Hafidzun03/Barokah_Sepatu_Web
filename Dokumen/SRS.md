# Software Requirements Specification (SRS)
## Web Penjualan Sepatu

**Versi:** 1.0  
**Status:** Draft  
**Frontend:** React.js, HTML, CSS, JavaScript  
**Database rencana:** MySQL  
**Lingkungan pengembangan database:** XAMPP  
**Backend/API yang direkomendasikan:** Node.js + Express (atau backend setara)

---

## 1. Pendahuluan

### 1.1 Tujuan Dokumen
Dokumen ini mendefinisikan kebutuhan fungsional, nonfungsional, antarmuka, aturan bisnis, dan kriteria pengujian untuk Web Penjualan Sepatu. Dokumen menjadi acuan pengembangan dan pengujian.

### 1.2 Ruang Lingkup Sistem
Sistem menyediakan katalog sepatu bagi pelanggan serta fitur administrasi untuk mengelola produk, variasi ukuran, stok, dan pesanan. Sistem memiliki dua peran utama: **Pelanggan** dan **Admin**.

### 1.3 Definisi
- **Pelanggan:** pengguna yang melihat produk dan melakukan pemesanan.
- **Admin:** pengguna berwenang yang mengelola katalog, inventaris, dan pesanan.
- **SKU:** kode unik untuk produk/variasi produk.
- **Checkout:** proses konfirmasi barang, alamat, dan pembayaran sebelum pesanan dibuat.
- **API:** antarmuka backend yang menghubungkan React dengan database.
- **MVP:** versi awal dengan fitur inti.

### 1.4 Asumsi dan Batasan
1. Aplikasi web menggunakan React.js untuk antarmuka.
2. HTML, CSS, dan JavaScript digunakan dalam implementasi frontend.
3. MySQL digunakan sebagai basis data apabila dipilih dalam implementasi.
4. React tidak boleh terhubung langsung ke MySQL; komunikasi dilakukan melalui backend/API.
5. XAMPP menyediakan layanan MySQL/MariaDB lokal, tetapi tidak otomatis menyediakan API untuk aplikasi React.
6. Pembayaran MVP dapat memakai transfer manual dengan konfirmasi admin. Integrasi payment gateway tidak termasuk kecuali ditetapkan kemudian.

## 2. Gambaran Umum

### 2.1 Perspektif Produk
Aplikasi terdiri dari:
- **Frontend:** halaman publik, area pelanggan, dan dashboard admin.
- **Backend/API:** autentikasi, otorisasi, validasi bisnis, perhitungan total, dan akses data.
- **Database:** pengguna, produk, kategori, variasi ukuran/stok, keranjang (opsional disimpan), pesanan, item pesanan, alamat, dan pembayaran.
- **Penyimpanan gambar:** penyimpanan lokal saat pengembangan atau object storage saat produksi.

### 2.2 Kelas Pengguna

| Peran | Hak akses utama |
|---|---|
| Pelanggan | Katalog, pencarian, detail produk, keranjang, checkout, profil, riwayat/status pesanan sendiri |
| Admin | Dashboard, pengelolaan produk/kategori/stok, melihat pesanan, mengubah status pesanan |

### 2.3 Lingkungan Operasional
- Browser modern di desktop dan perangkat seluler.
- Node.js untuk menjalankan backend jika memakai Express.
- MySQL/MariaDB dari XAMPP untuk pengembangan lokal.
- React development server saat pengembangan frontend.
- Deployment produksi menggunakan hosting yang mendukung frontend, backend, dan database.

### 2.4 Batasan Desain dan Implementasi
- Semua endpoint admin wajib memeriksa autentikasi dan role di backend.
- Harga, diskon, subtotal, ongkos kirim (jika ada), dan total akhir dihitung ulang di backend.
- Stok divalidasi kembali saat pesanan dibuat.
- Kata sandi tidak boleh disimpan dalam teks biasa.
- Rahasia aplikasi dan kredensial database tidak boleh dimasukkan ke kode frontend atau repositori publik.

## 3. Kebutuhan Antarmuka Eksternal

### 3.1 Antarmuka Pengguna
Halaman minimal:
1. Beranda.
2. Katalog produk.
3. Detail produk.
4. Daftar/masuk.
5. Keranjang.
6. Checkout.
7. Profil pelanggan.
8. Riwayat dan detail pesanan.
9. Login admin.
10. Dashboard admin.
11. Manajemen produk.
12. Manajemen kategori.
13. Manajemen pesanan.

### 3.2 Antarmuka Perangkat Lunak
- React frontend berkomunikasi dengan backend melalui HTTP API, umumnya JSON.
- Backend mengakses MySQL/MariaDB menggunakan driver/ORM yang sesuai.
- Layanan penyimpanan gambar dapat ditambahkan untuk unggah dan penyajian foto produk.
- Payment gateway tidak diwajibkan untuk MVP.

### 3.3 Antarmuka Komunikasi
- HTTPS wajib di lingkungan produksi.
- Permintaan API harus menangani status sukses dan gagal secara konsisten.
- Backend menerapkan validasi input, autentikasi, otorisasi, dan pembatasan permintaan yang sesuai.

## 4. Kebutuhan Fungsional

### 4.1 Autentikasi dan Otorisasi

| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-AUTH-01 | Sistem memungkinkan pelanggan mendaftar dengan nama, email, dan kata sandi | Must |
| FR-AUTH-02 | Sistem memungkinkan pengguna masuk dan keluar | Must |
| FR-AUTH-03 | Sistem membedakan peran pelanggan dan admin | Must |
| FR-AUTH-04 | Sistem menolak akses endpoint admin dari pelanggan | Must |
| FR-AUTH-05 | Sistem memvalidasi data masukan dan memberikan pesan kesalahan yang jelas | Must |
| FR-AUTH-06 | Sistem menyimpan kata sandi dalam bentuk hash menggunakan mekanisme aman di backend | Must |

**Aturan:** pembuatan akun admin tidak boleh terbuka melalui formulir pendaftaran pelanggan biasa. Admin dibuat melalui proses yang dikendalikan.

### 4.2 Katalog dan Pencarian Produk

| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-PROD-01 | Sistem menampilkan produk aktif | Must |
| FR-PROD-02 | Sistem menampilkan nama, foto, harga, deskripsi, kategori, ukuran, dan ketersediaan | Must |
| FR-PROD-03 | Sistem mendukung pencarian berdasarkan nama atau kata kunci | Must |
| FR-PROD-04 | Sistem mendukung filter kategori, rentang harga, dan ukuran | Should |
| FR-PROD-05 | Sistem menyediakan halaman detail produk | Must |
| FR-PROD-06 | Sistem tidak mengizinkan pembelian variasi yang stoknya tidak mencukupi | Must |

### 4.3 Keranjang Belanja

| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-CART-01 | Pelanggan dapat menambahkan variasi produk ke keranjang | Must |
| FR-CART-02 | Pelanggan dapat mengubah jumlah barang | Must |
| FR-CART-03 | Pelanggan dapat menghapus barang dari keranjang | Must |
| FR-CART-04 | Sistem menampilkan subtotal setiap item dan total sementara | Must |
| FR-CART-05 | Sistem memvalidasi ulang harga dan stok saat checkout | Must |

Keranjang dapat disimpan di backend untuk pengguna login. Keranjang lokal di browser boleh digunakan sebagai kemudahan, tetapi bukan sumber kebenaran untuk harga dan stok.

### 4.4 Checkout dan Pesanan

| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-ORDER-01 | Pelanggan dapat memasukkan atau memilih alamat pengiriman | Must |
| FR-ORDER-02 | Sistem menampilkan ringkasan barang dan total sebelum konfirmasi | Must |
| FR-ORDER-03 | Sistem membuat nomor pesanan unik | Must |
| FR-ORDER-04 | Sistem menyimpan detail item, ukuran, jumlah, dan harga saat transaksi | Must |
| FR-ORDER-05 | Sistem menyediakan metode pembayaran yang dikonfigurasi | Must |
| FR-ORDER-06 | Pelanggan dapat melihat riwayat dan status pesanan miliknya | Must |
| FR-ORDER-07 | Sistem mengurangi atau mereservasi stok secara konsisten ketika pesanan dibuat sesuai kebijakan stok | Must |
| FR-ORDER-08 | Sistem mencegah pelanggan melihat pesanan milik pengguna lain | Must |

### 4.5 Pembayaran

| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-PAY-01 | Sistem menyimpan metode dan status pembayaran | Must |
| FR-PAY-02 | Untuk transfer manual, admin dapat menandai pembayaran terverifikasi setelah pemeriksaan | Should |
| FR-PAY-03 | Sistem tidak menandai pembayaran sebagai lunas hanya berdasarkan nilai yang dikirim frontend | Must |

Status pembayaran minimal: `Belum Dibayar`, `Menunggu Verifikasi`, `Lunas`, `Gagal`, `Dikembalikan` (status yang tidak relevan dapat dihilangkan untuk MVP).

### 4.6 Dashboard dan Administrasi

| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-ADM-01 | Admin dapat melihat ringkasan jumlah produk dan pesanan | Should |
| FR-ADM-02 | Admin dapat menambah produk | Must |
| FR-ADM-03 | Admin dapat melihat, mengubah, dan menonaktifkan produk | Must |
| FR-ADM-04 | Admin dapat mengelola kategori | Must |
| FR-ADM-05 | Admin dapat mengelola variasi ukuran, SKU, dan stok | Must |
| FR-ADM-06 | Admin dapat melihat daftar dan detail pesanan | Must |
| FR-ADM-07 | Admin dapat memperbarui status pesanan sesuai alur yang diizinkan | Must |
| FR-ADM-08 | Sistem menyimpan waktu perubahan status pesanan | Should |

Status pesanan yang disarankan: `Menunggu Pembayaran`, `Menunggu Konfirmasi`, `Diproses`, `Dikirim`, `Selesai`, `Dibatalkan`. Perubahan status harus mengikuti aturan transisi yang ditentukan dan dicatat.

## 5. Kebutuhan Nonfungsional

| ID | Kategori | Persyaratan |
|---|---|---|
| NFR-01 | Keamanan | Autentikasi dan otorisasi dilakukan di backend; password di-hash |
| NFR-02 | Keamanan | Query database menggunakan parameterisasi/ORM untuk mengurangi risiko SQL injection |
| NFR-03 | Keamanan | Validasi input dilakukan di frontend dan backend |
| NFR-04 | Privasi | Pelanggan hanya dapat mengakses data profil dan pesanan miliknya |
| NFR-05 | Kinerja | Halaman katalog menggunakan gambar teroptimasi dan pemuatan yang efisien |
| NFR-06 | Usability | Formulir menyediakan label, validasi, dan pesan kesalahan yang dapat dipahami |
| NFR-07 | Responsif | Tata letak menyesuaikan desktop, tablet, dan ponsel |
| NFR-08 | Kompatibilitas | Mendukung browser modern utama |
| NFR-09 | Integritas | Total harga dihitung ulang di backend; stok tidak boleh negatif |
| NFR-10 | Maintainability | Kode dibagi ke komponen, halaman, layanan API, dan modul backend |
| NFR-11 | Availability | Ketersediaan mengikuti kemampuan hosting; target operasional ditentukan sebelum produksi |
| NFR-12 | Logging | Kegagalan penting dan perubahan status pesanan dicatat tanpa merekam kata sandi atau rahasia |

## 6. Aturan Bisnis

1. Produk hanya dapat dibeli jika berstatus aktif dan variasi ukuran tersedia.
2. Jumlah pesanan harus berupa bilangan bulat positif dan tidak melebihi stok yang tersedia.
3. Harga transaksi disalin ke detail item pesanan agar riwayat tidak berubah saat harga produk diperbarui.
4. Total pesanan dihitung dari harga yang tersimpan di database, kuantitas, diskon sah, dan biaya tambahan yang berlaku.
5. Pelanggan hanya dapat melihat pesanan miliknya.
6. Admin hanya dapat mengakses fungsi administrasi setelah otorisasi server berhasil.
7. Pembatalan dan pengembalian stok mengikuti status pesanan serta kebijakan toko.
8. Perubahan status pembayaran dan pesanan harus konsisten dan dapat diaudit.
9. Produk yang sudah memiliki riwayat transaksi sebaiknya dinonaktifkan, bukan dihapus permanen, untuk menjaga referensi riwayat.

## 7. Model Data Konseptual

| Entitas | Atribut utama | Relasi |
|---|---|---|
| users | id, name, email, password_hash, role, created_at | Satu pengguna memiliki banyak pesanan |
| categories | id, name, description, is_active | Satu kategori memiliki banyak produk |
| products | id, category_id, name, description, base_price, is_active, created_at | Produk memiliki banyak variasi |
| product_variants | id, product_id, sku, size, stock, price_override | Satu variasi dapat muncul di banyak item pesanan |
| product_images | id, product_id, image_url, is_primary | Produk memiliki banyak gambar |
| addresses | id, user_id, recipient_name, phone, address, city, postal_code | Pengguna memiliki banyak alamat |
| orders | id, order_number, user_id, address_snapshot, subtotal, shipping_cost, total, payment_status, order_status, created_at | Pesanan memiliki banyak item |
| order_items | id, order_id, product_variant_id, product_name_snapshot, size_snapshot, unit_price, quantity, line_total | Setiap item milik satu pesanan |
| payments (opsional) | id, order_id, method, amount, status, reference, verified_at | Pesanan dapat memiliki catatan pembayaran |

**Catatan desain:** `address_snapshot` dapat dipecah menjadi kolom atau tabel snapshot alamat agar perubahan alamat profil tidak mengubah alamat pesanan lama. Struktur akhir ditentukan saat desain database.

## 8. Kebutuhan API Awal

Rute berikut merupakan rancangan awal; metode dan skema respons harus disepakati saat implementasi.

| Metode | Endpoint | Akses | Tujuan |
|---|---|---|---|
| POST | `/api/auth/register` | Publik | Daftar pelanggan |
| POST | `/api/auth/login` | Publik | Masuk |
| POST | `/api/auth/logout` | Pengguna masuk | Keluar |
| GET | `/api/products` | Publik | Daftar/filter produk |
| GET | `/api/products/:id` | Publik | Detail produk |
| GET | `/api/categories` | Publik | Daftar kategori |
| GET | `/api/cart` | Pelanggan | Lihat keranjang |
| POST | `/api/cart/items` | Pelanggan | Tambah item |
| PATCH | `/api/cart/items/:id` | Pelanggan | Ubah jumlah |
| DELETE | `/api/cart/items/:id` | Pelanggan | Hapus item |
| POST | `/api/orders` | Pelanggan | Buat pesanan |
| GET | `/api/orders/me` | Pelanggan | Riwayat pesanan sendiri |
| GET | `/api/orders/:id` | Pemilik pesanan/Admin | Detail pesanan |
| GET | `/api/admin/products` | Admin | Daftar produk untuk admin |
| POST | `/api/admin/products` | Admin | Tambah produk |
| PATCH | `/api/admin/products/:id` | Admin | Ubah produk |
| DELETE atau PATCH | `/api/admin/products/:id` | Admin | Nonaktifkan produk |
| GET | `/api/admin/orders` | Admin | Daftar pesanan |
| PATCH | `/api/admin/orders/:id/status` | Admin | Ubah status pesanan |
| POST | `/api/admin/categories` | Admin | Tambah kategori |

## 9. Kriteria Pengujian dan Penerimaan

| ID Uji | Skenario | Hasil yang Diharapkan |
|---|---|---|
| TC-01 | Pelanggan membuka katalog | Produk aktif ditampilkan |
| TC-02 | Pelanggan mencari nama sepatu | Hasil relevan ditampilkan atau pesan kosong |
| TC-03 | Pelanggan memilih ukuran yang stoknya habis | Sistem menolak penambahan/pemesanan |
| TC-04 | Pelanggan mengubah jumlah di keranjang | Subtotal diperbarui dan jumlah divalidasi |
| TC-05 | Pelanggan checkout dengan data valid | Pesanan unik tersimpan dan ringkasan benar |
| TC-06 | Harga dikirim dengan nilai yang dimanipulasi dari browser | Backend mengabaikan harga klien dan menghitung ulang |
| TC-07 | Pelanggan mencoba endpoint admin | Permintaan ditolak |
| TC-08 | Pelanggan mencoba membuka pesanan orang lain | Akses ditolak |
| TC-09 | Admin menambah produk dengan data valid | Produk tersimpan dan tampil sesuai status |
| TC-10 | Admin memperbarui status pesanan | Status tersimpan sesuai aturan transisi |
| TC-11 | Dua checkout bersamaan untuk stok terakhir | Sistem mencegah stok menjadi negatif |
| TC-12 | Aplikasi dibuka dari layar ponsel | Tata letak tetap dapat digunakan |

## 10. Prioritas dan Ketergantungan

Urutan implementasi yang disarankan:
1. Skema database dan backend/API.
2. Autentikasi dan role.
3. Kategori, produk, variasi ukuran, dan stok.
4. Katalog dan detail produk.
5. Keranjang dan checkout.
6. Riwayat pesanan dan status.
7. Dashboard admin.
8. Pengujian, hardening keamanan, dan deployment.

## 11. Hal yang Perlu Diputuskan

- Nama dan identitas visual toko.
- Apakah pelanggan wajib login sebelum checkout.
- Pilihan pembayaran untuk MVP.
- Kebijakan ongkos kirim dan pengiriman.
- Apakah bukti transfer diunggah ke sistem.
- Kebijakan pembatalan, retur, dan pengembalian dana.
- Apakah produk memiliki beberapa foto dan variasi warna selain ukuran.
