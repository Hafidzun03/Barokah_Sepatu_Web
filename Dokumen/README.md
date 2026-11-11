# Web Penjualan Sepatu

Aplikasi web e-commerce sepatu dengan dua peran pengguna: **Pelanggan** dan **Admin**. Frontend direncanakan menggunakan React.js dengan HTML, CSS, dan JavaScript. Database yang direncanakan adalah MySQL melalui XAMPP.

> **Penting:** React.js berjalan di browser dan tidak boleh mengakses MySQL secara langsung. Aplikasi memerlukan backend/API (misalnya Node.js + Express) untuk autentikasi, validasi, otorisasi, dan operasi database. Dokumen ini adalah panduan awal; sesuaikan perintah setelah struktur proyek dan backend benar-benar dibuat.

## Fitur yang Direncanakan

### Pelanggan
- Melihat katalog dan detail sepatu.
- Mencari dan memfilter produk.
- Memilih ukuran dan jumlah.
- Mengelola keranjang.
- Mendaftar dan masuk.
- Checkout dan melihat status pesanan.
- Melihat riwayat pesanan.

### Admin
- Masuk ke dashboard admin.
- Mengelola produk, kategori, ukuran, harga, dan stok.
- Melihat pesanan pelanggan.
- Memperbarui status pesanan.

## Teknologi

- HTML
- CSS
- JavaScript
- React.js
- MySQL/MariaDB melalui XAMPP (rencana)
- Node.js + Express sebagai opsi backend/API (rencana)
- Git untuk version control (opsional)

## Prasyarat

Pasang dan siapkan:
1. Node.js versi LTS yang kompatibel dengan versi React/Vite yang digunakan.
2. npm (biasanya ikut terpasang bersama Node.js).
3. XAMPP jika menggunakan MySQL/MariaDB lokal.
4. Editor kode seperti Visual Studio Code.
5. Browser modern.

Periksa instalasi:

```bash
node -v
npm -v
```

## Struktur Folder yang Disarankan

Struktur berikut adalah contoh target, bukan jaminan struktur proyek yang sudah dibuat:

```text
web-penjualan-sepatu/
├── client/
│   ├── public/
│   │   └── images/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── customer/
│   │   │   └── admin/
│   │   ├── layouts/
│   │   ├── services/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── styles/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   └── app.js
│   ├── .env.example
│   └── package.json
├── database/
│   └── schema.sql
├── PRD.md
├── SRS.md
└── README.md
```

## Menjalankan Frontend React

Jika folder `client` belum ada, buat proyek Vite React dari folder proyek:

```bash
npm create vite@latest client -- --template react
cd client
npm install
npm run dev
```

Buka URL lokal yang dicetak oleh Vite di terminal. Biasanya `http://localhost:5173`, tetapi gunakan alamat yang benar-benar ditampilkan terminal.

Perintah `npm run dev` menjalankan server pengembangan frontend; perintah ini **tidak** otomatis menjalankan backend atau database.

## Menyiapkan Database Lokal dengan XAMPP

1. Buka XAMPP Control Panel.
2. Jalankan layanan MySQL/MariaDB. Apache hanya diperlukan jika ada kebutuhan lain seperti phpMyAdmin berbasis Apache.
3. Buka phpMyAdmin melalui instalasi XAMPP lokal.
4. Buat database, misalnya `web_penjualan_sepatu`.
5. Buat tabel berdasarkan rancangan di `SRS.md` atau impor `database/schema.sql` jika file skema sudah tersedia.
6. Konfigurasikan backend agar terhubung ke database melalui variabel lingkungan.

Nama database di atas hanya contoh. File SQL belum disertakan dalam dokumentasi awal ini.

## Menyiapkan Backend/API

Backend belum dibuat hanya dengan menjalankan perintah frontend. Jika memilih Node.js + Express:
1. Buat proyek terpisah pada folder `server`.
2. Pasang Express, driver MySQL, dan pustaka autentikasi/validasi yang sesuai.
3. Buat endpoint sesuai bagian API pada `SRS.md`.
4. Simpan kredensial database dan secret pada file `.env` lokal yang tidak di-commit.
5. Validasi input, role, harga, stok, dan kepemilikan pesanan di backend.
6. Tambahkan `.env` ke `.gitignore`; bagikan hanya `.env.example` tanpa secret.

Jangan pernah menaruh password database atau secret backend di kode React, karena variabel frontend dapat terlihat oleh pengguna.

## Variabel Lingkungan Contoh

Contoh isi `server/.env.example` (sesuaikan dengan implementasi):

```dotenv
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=web_penjualan_sepatu
DB_USER=root
DB_PASSWORD=
SESSION_SECRET=change-this-in-local-env
```

Nilai di atas adalah contoh konfigurasi lokal, bukan kredensial produksi. Pengaturan `root` tanpa password hanya boleh digunakan jika memang sesuai dengan konfigurasi lokal; jangan gunakan konfigurasi lemah tersebut di server publik.

## Alur Pengembangan

1. Baca `PRD.md` untuk memahami tujuan dan ruang lingkup produk.
2. Baca `SRS.md` untuk kebutuhan fungsional, aturan bisnis, rancangan data, API, dan pengujian.
3. Finalisasi skema database dan backend API.
4. Bangun autentikasi dan pembatasan role.
5. Bangun katalog, detail produk, keranjang, dan checkout.
6. Bangun dashboard admin dan pengelolaan pesanan.
7. Uji semua alur, termasuk stok terakhir dan akses lintas pengguna.
8. Siapkan konfigurasi deployment dan HTTPS sebelum aplikasi dipublikasikan.

## Pengujian Minimum

- Pendaftaran, login, dan logout.
- Pelanggan hanya melihat pesanan miliknya.
- Pelanggan tidak dapat mengakses endpoint admin.
- Produk dengan stok nol tidak dapat dipesan.
- Backend menghitung ulang harga dan total.
- Admin dapat mengelola produk, stok, dan status pesanan.
- Tata letak tetap dapat digunakan pada ponsel dan desktop.

## Keamanan

- Hash kata sandi di backend.
- Terapkan otorisasi pada setiap endpoint yang membutuhkan hak khusus.
- Gunakan query parameterized atau ORM.
- Validasi input pada frontend dan backend.
- Jangan menyimpan secret dalam repositori.
- Gunakan HTTPS, backup, dan pengaturan database yang aman untuk produksi.

## Dokumen

- [`PRD.md`](./PRD.md) — kebutuhan dan tujuan produk.
- [`SRS.md`](./SRS.md) — spesifikasi kebutuhan perangkat lunak.

## Status Proyek

Dokumen kebutuhan sudah disiapkan sebagai titik awal. Implementasi frontend, backend, skema SQL, pengujian, dan deployment dilakukan pada tahap pengembangan berikutnya.
