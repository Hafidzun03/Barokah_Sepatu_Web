# DESIGN.md — Desain UI/UX Web Penjualan Sepatu

**Versi:** 1.0  
**Status:** Panduan desain awal  
**Referensi visual:** Gambar referensi STRIDE Sneakers yang diberikan pengguna  
**Frontend:** React.js, HTML, CSS, JavaScript

---

## 1. Tujuan Desain

Membangun web penjualan sepatu dengan tampilan e-commerce modern, premium, bersih, dan berorientasi pada produk. Desain mengambil inspirasi dari struktur gambar referensi: promosi tipis di bagian paling atas, navigasi putih, hero besar dengan foto sepatu, informasi layanan, kategori, produk terlaris, promosi tambahan, newsletter, dan footer gelap.

Referensi digunakan sebagai arah visual, bukan untuk menyalin merek STRIDE, logo, teks promosi, atau aset produknya secara persis. Gunakan identitas merek dan foto produk milik proyek sendiri.

## 2. Prinsip Visual

- **Product-first:** foto sepatu menjadi fokus utama.
- **Minimalis dan editorial:** ruang kosong cukup, hierarki teks jelas, elemen dekoratif tidak berlebihan.
- **Kontras kuat:** teks hitam/abu gelap di latar putih atau krem.
- **Aksen lime:** hijau lime dipakai terbatas untuk kata penting, label promo, titik aktif, dan tautan CTA.
- **Navigasi sederhana:** kategori dan tindakan penting mudah ditemukan.
- **Responsif:** layout beradaptasi dengan desktop, tablet, dan ponsel.

## 3. Design Tokens

### 3.1 Warna

| Token | Nilai | Kegunaan |
|---|---|---|
| `--color-black` | `#080808` | Header promosi, footer, tombol utama |
| `--color-ink` | `#171717` | Teks utama |
| `--color-muted` | `#686868` | Deskripsi dan teks sekunder |
| `--color-white` | `#FFFFFF` | Latar utama dan kartu |
| `--color-cream` | `#F3F0EB` | Latar hero |
| `--color-soft-gray` | `#F2F2F2` | Latar foto/kartu produk |
| `--color-border` | `#E4E4E4` | Garis pemisah dan border |
| `--color-lime` | `#B7D600` | Aksen, CTA sekunder, teks penekanan |
| `--color-success` | `#267344` | Indikator stok tersedia |
| `--color-error` | `#B42318` | Pesan kesalahan |

### 3.2 Tipografi

- Gunakan sans-serif modern seperti `Inter`, `Manrope`, atau font sistem.
- Heading hero: tebal, kapital, rapat, dengan ukuran responsif.
- Judul bagian: tebal, kapital atau title case, jelas dan ringkas.
- Nama produk dan harga: ukuran kecil-menengah, mudah dipindai.
- Deskripsi: kalimat singkat, kontras cukup, line-height nyaman.
- Hindari terlalu banyak variasi font dan ukuran.

### 3.3 Bentuk dan Spasi

- Radius kartu kategori: 8–12 px.
- Radius kartu produk: 6–10 px.
- Tombol: radius 2–5 px untuk gaya tegas dan modern.
- Gunakan sistem spasi konsisten berbasis kelipatan 4 atau 8 px.
- Konten desktop menggunakan lebar maksimum sekitar 1440 px dengan padding horizontal yang nyaman.
- Hindari bayangan berat; gunakan border tipis dan pemisahan ruang.

## 4. Struktur Halaman Beranda

Urutan bagian halaman desktop:

1. Announcement bar / promo bar.
2. Header dan navigasi utama.
3. Hero banner.
4. Service benefits.
5. Shop by category.
6. Best sellers.
7. Promo banner dan membership/club banner.
8. Newsletter subscription.
9. Footer.

### 4.1 Announcement Bar

- Latar hitam, teks putih berukuran kecil.
- Tampilkan maksimal tiga informasi ringkas, misalnya gratis ongkir, promo pengguna baru, dan tautan bantuan/pelacakan pesanan.
- Pada layar sempit, tampilkan satu pesan prioritas atau carousel pesan; jangan membuat teks bertumpuk.

### 4.2 Header dan Navigasi

- Latar putih, logo teks di sisi kiri.
- Menu utama di tengah: Produk Baru, Pria, Wanita, Anak, Merek, Rilis, Sale (sesuaikan dengan katalog aktual).
- Ikon sisi kanan: pencarian, akun, wishlist, keranjang.
- Tampilkan indikator jumlah item pada ikon keranjang.
- Header dapat sticky saat halaman digulir, tetapi tidak boleh menutupi konten.
- Pada mobile, ganti menu menjadi tombol hamburger dan pertahankan akses pencarian serta keranjang.

### 4.3 Hero Banner

- Area lebar dengan latar krem/abu hangat.
- Layout desktop dua kolom: copywriting di kiri, foto sepatu utama berukuran besar di kanan.
- Gunakan heading besar 2–3 baris. Sebagian frasa dapat memakai aksen lime.
- Sediakan deskripsi singkat dan dua CTA: tombol utama hitam dan tombol sekunder outline.
- Tambahkan label koleksi atau informasi produk pada sisi kanan bawah bila ruang memungkinkan.
- Gunakan foto sepatu berkualitas tinggi dengan latar bersih dan crop editorial.
- Jangan menempatkan teks di area foto yang membuat keterbacaan rendah.
- Pada mobile, susun copy dan gambar secara vertikal; tombol dapat menjadi full-width.

Contoh copy sementara:
- Eyebrow: `KOLEKSI TERBARU`
- Heading: `LANGKAH BARU. GAYA TANPA BATAS.`
- Deskripsi: `Temukan sepatu yang cocok untuk setiap langkahmu.`
- CTA utama: `BELANJA SEKARANG`
- CTA sekunder: `JELAJAHI KOLEKSI`

Copy ini boleh diganti sesuai identitas merek.

### 4.4 Service Benefits

Tampilkan empat benefit dalam satu baris pada desktop dengan ikon outline sederhana:
- Pengiriman
- Pengembalian
- Pembayaran aman
- Bantuan pelanggan

Setiap benefit memiliki judul tebal dan deskripsi satu baris. Pada tablet/mobile, susun menjadi dua kolom atau carousel yang mudah diakses.

### 4.5 Shop by Category

- Judul bagian di kiri, tautan `Lihat Semua` di kanan.
- Tampilkan enam kartu kategori berbasis gambar, misalnya Pria, Wanita, Anak, Running, Casual, dan Sandal.
- Kartu menggunakan gambar sepatu/lifestyle sebagai latar penuh.
- Tambahkan overlay gelap ringan di bagian bawah agar label putih terbaca.
- Label kategori dan CTA kecil diletakkan di bawah kartu.
- Desktop: enam kolom jika lebar cukup; tablet: tiga kolom; mobile: dua kolom atau carousel horizontal.

### 4.6 Best Sellers / Produk Terlaris

- Grid enam produk pada desktop untuk meniru kepadatan visual referensi.
- Setiap kartu produk mencakup:
  - Foto produk dengan rasio konsisten, disarankan 1:1.
  - Tombol wishlist/ikon hati.
  - Nama produk.
  - Harga dalam Rupiah (`Rp`).
  - Pilihan warna berbentuk swatch jika produk memiliki varian warna.
  - Label stok atau diskon bila relevan.
- Foto produk harus memiliki background netral dan ukuran visual seragam.
- Kartu tidak perlu memiliki bayangan tebal.
- Klik kartu membuka halaman detail produk; tombol wishlist harus memiliki aksi yang terpisah.
- Pada mobile gunakan dua kolom agar gambar tetap jelas.

### 4.7 Dua Banner Promosi

Gunakan dua banner berdampingan pada desktop:

**Banner kiri — koleksi terbatas**
- Latar gelap.
- Foto sepatu yang kuat secara visual.
- Judul singkat, deskripsi, dan CTA.

**Banner kanan — komunitas/member**
- Latar abu muda.
- Visual kotak sepatu atau foto produk.
- Pesan manfaat keanggotaan, akses awal, atau promo yang benar-benar tersedia.
- CTA untuk bergabung.

Pada mobile, tumpuk banner secara vertikal. Jangan menyampaikan klaim diskon atau benefit yang belum diterapkan di sistem.

### 4.8 Newsletter

- Latar lime sangat muda.
- Ikon amplop, judul, dan deskripsi singkat di kiri.
- Form email dan tombol subscribe di kanan pada desktop.
- Mobile: form tersusun vertikal.
- Validasi format email dan tampilkan status sukses/gagal yang dapat dipahami.
- Jangan menampilkan pesan sukses jika alamat email belum benar-benar diproses atau disimpan.

### 4.9 Footer

- Latar hitam, teks putih/abu.
- Kolom merek, Shop, Help, Company, dan metode pembayaran jika relevan.
- Tampilkan tautan media sosial hanya jika akun benar-benar tersedia.
- Baris copyright di bagian bawah.
- Pada mobile, kolom menjadi accordion atau susunan vertikal yang ringkas.

## 5. Halaman Lain

### 5.1 Katalog Produk
- Breadcrumb sederhana.
- Judul katalog dan jumlah hasil.
- Filter kategori, ukuran, harga, warna, dan ketersediaan stok sesuai data yang tersedia.
- Sorting: rekomendasi, terbaru, harga terendah, harga tertinggi.
- Grid produk konsisten dengan beranda.
- Sediakan state loading, kosong, dan error.

### 5.2 Detail Produk
- Galeri gambar di kiri dan informasi produk di kanan pada desktop.
- Nama, harga, deskripsi, pilihan ukuran, pilihan warna bila tersedia, informasi stok, kuantitas, dan tombol `Tambah ke Keranjang`.
- Ukuran yang stoknya habis harus terlihat nonaktif dan tidak dapat dipilih.
- Tampilkan panduan ukuran bila data tersedia.
- Mobile: galeri di atas informasi produk.

### 5.3 Keranjang
- Daftar item dengan foto, nama, ukuran/warna, harga, dan jumlah.
- Tombol tambah/kurangi jumlah dan hapus item.
- Ringkasan subtotal dan CTA ke checkout.
- Tampilkan keadaan keranjang kosong.

### 5.4 Checkout
- Form alamat penerima dan kontak.
- Metode pengiriman/pembayaran sesuai fitur yang benar-benar tersedia.
- Ringkasan pesanan dan total.
- Validasi input serta konfirmasi sebelum pesanan dibuat.
- Jangan meminta data kartu pembayaran jika tidak ada integrasi pembayaran tepercaya.

### 5.5 Login dan Registrasi
- Layout bersih, form ringkas, label jelas, dan pesan error dekat input.
- Sediakan tautan berpindah antara login dan registrasi.
- Jangan menyediakan pendaftaran admin terbuka melalui halaman registrasi pelanggan.

### 5.6 Akun Pelanggan
- Ringkasan profil.
- Daftar dan detail pesanan.
- Status pesanan yang mudah dimengerti.
- Aksi keluar akun.

### 5.7 Dashboard Admin
- Sidebar atau navigasi admin yang berbeda dari navigasi pelanggan.
- Ringkasan pesanan, jumlah produk, dan stok rendah.
- Tabel produk dan pesanan dengan pencarian, filter, pagination bila diperlukan.
- Form tambah/edit produk dengan validasi.
- Pengelolaan stok per ukuran/varian.
- Konfirmasi sebelum tindakan yang berdampak, misalnya menonaktifkan produk.
- Tampilan tabel harus tetap dapat digunakan di layar kecil.

## 6. Komponen React yang Disarankan

Komponen umum:
- `AnnouncementBar`
- `SiteHeader`
- `MobileNavigation`
- `HeroBanner`
- `ServiceBenefits`
- `CategoryCard`
- `CategorySection`
- `ProductCard`
- `ProductGrid`
- `PromoBanner`
- `NewsletterForm`
- `SiteFooter`
- `SearchBar`
- `PriceFilter`
- `SizeSelector`
- `QuantitySelector`
- `CartItem`
- `OrderSummary`
- `FormField`
- `StatusBadge`
- `AdminSidebar`
- `AdminDataTable`
- `ConfirmDialog`
- `LoadingState`
- `EmptyState`
- `ErrorState`

Komponen di atas adalah rekomendasi pembagian UI, bukan daftar file yang sudah dibuat.

## 7. Perilaku dan Interaksi

- Semua tombol dan tautan harus memiliki aksi nyata; hindari kontrol dekoratif yang tidak berfungsi.
- Menu navigasi membuka halaman atau filter yang sesuai.
- Pencarian mengubah hasil katalog.
- Filter dan sorting bekerja bersama tanpa menghapus filter lain secara tidak sengaja.
- Ikon wishlist menambah/menghapus produk dari wishlist jika fitur tersedia.
- Keranjang memperbarui kuantitas dan subtotal; harga final tetap divalidasi backend.
- Pilihan ukuran menampilkan stok yang tersedia.
- Formulir memiliki validasi, loading, sukses, dan error state.
- Gunakan dialog konfirmasi untuk aksi admin yang berisiko.
- Sediakan focus state keyboard dan label aksesibel untuk ikon.

## 8. Responsivitas

### Desktop (≥ 1024 px)
- Navigasi horizontal.
- Hero dua kolom.
- Enam kategori/produk per baris jika lebar memadai.

### Tablet (768–1023 px)
- Menu disederhanakan jika diperlukan.
- Kategori dan produk tiga kolom.
- Banner promosi dua kolom jika masih terbaca.

### Mobile (< 768 px)
- Menu hamburger.
- Hero vertikal.
- Grid produk dua kolom.
- Kategori dua kolom atau carousel horizontal.
- Form checkout satu kolom.
- Tabel admin dapat diganti menjadi kartu atau memiliki scroll horizontal yang terkontrol.
- Target sentuh nyaman, idealnya sekitar 44 × 44 px.

## 9. Aksesibilitas dan Kualitas

- Kontras teks memadai.
- Gambar produk memiliki alt text yang menjelaskan produk.
- Input memiliki label yang terlihat.
- Navigasi dapat digunakan dengan keyboard.
- Jangan menggunakan warna saja untuk menyampaikan status.
- Hormati `prefers-reduced-motion`.
- Optimalkan gambar dan gunakan lazy loading untuk gambar di bawah fold.
- Pastikan tampilan tidak bergantung pada teks yang tertanam dalam gambar.

## 10. Aset dan Konten

- Gunakan logo merek proyek sendiri.
- Gunakan foto sepatu yang dimiliki, berlisensi, atau bebas digunakan sesuai ketentuannya.
- Jangan menyalin logo, nama produk, atau materi promosi merek pada gambar referensi.
- Gunakan harga dan ketersediaan yang bersumber dari data produk.
- Jika memakai data dummy saat desain, tandai sebagai placeholder dan ganti sebelum produksi.

## 11. Kriteria Penerimaan Desain

Desain dinyatakan memenuhi panduan jika:
1. Beranda memiliki urutan bagian sesuai struktur yang ditentukan.
2. Visual menonjolkan produk dengan latar netral dan aksen lime yang terbatas.
3. Semua halaman utama memiliki gaya komponen yang konsisten.
4. Tata letak dapat digunakan pada desktop, tablet, dan mobile.
5. Ada state loading, kosong, validasi, sukses, dan error untuk alur penting.
6. Pelanggan dan admin memiliki navigasi serta hak akses yang jelas.
7. Tombol, ikon, filter, dan formulir yang ditampilkan benar-benar terhubung ke perilaku yang sesuai.
8. Tidak ada klaim promosi, pembayaran, atau layanan yang belum didukung sistem.

## 12. Hubungan dengan Dokumen Lain

- `PRD.md`: menjelaskan tujuan produk dan ruang lingkup.
- `SRS.md`: menjelaskan kebutuhan fungsional, nonfungsional, data, dan API.
- `README.md`: menjelaskan instalasi dan pengembangan proyek.
- `DESIGN.md`: menjelaskan arah visual, struktur halaman, komponen UI, dan perilaku antarmuka.
