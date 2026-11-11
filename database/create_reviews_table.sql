-- ============================================================
-- TOKO BAROKAH: SKEMA TABEL ULASAN PELANGGAN (REVIEWS)
-- Versi: 1.0 (Database Real Supabase)
-- 
-- Panduan Eksekusi:
-- 1. Buka Supabase Dashboard (https://supabase.com/dashboard)
-- 2. Pilih Project Toko Barokah Anda
-- 3. Masuk ke menu "SQL Editor" -> Klik "New query"
-- 4. Copy-paste seluruh isi skrip ini, lalu klik "Run"
-- ============================================================

-- 1. Buat Tabel reviews jika belum ada
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  order_number VARCHAR(100),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name VARCHAR(150) NOT NULL,
  user_city VARCHAR(100) DEFAULT 'Indonesia',
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  product_slug VARCHAR(280),
  product_image TEXT,
  size VARCHAR(20),
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  photo_url TEXT,
  featured_on_home BOOLEAN NOT NULL DEFAULT FALSE,
  is_verified BOOLEAN NOT NULL DEFAULT TRUE,
  helpful_count INT NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Index untuk pencarian dan pemuatan cepat
CREATE INDEX IF NOT EXISTS idx_reviews_featured ON public.reviews(featured_on_home);
CREATE INDEX IF NOT EXISTS idx_reviews_product_slug ON public.reviews(product_slug);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order_number ON public.reviews(order_number);

-- 3. Aktifkan Row Level Security (RLS)
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 4. Kebijakan RLS (Public Read, Insert & Update untuk Admin & Customer)
DROP POLICY IF EXISTS "Reviews: allow read" ON public.reviews;
DROP POLICY IF EXISTS "Reviews: allow insert" ON public.reviews;
DROP POLICY IF EXISTS "Reviews: allow update" ON public.reviews;
DROP POLICY IF EXISTS "Reviews: allow delete" ON public.reviews;

-- Read: Siapapun (pengunjung beranda, pembeli di detail produk, admin di dashboard) dapat membaca ulasan
CREATE POLICY "Reviews: allow read"
  ON public.reviews FOR SELECT
  USING (true);

-- Insert: Customer terdaftar maupun tamu dapat mengirimkan ulasan setelah membeli
CREATE POLICY "Reviews: allow insert"
  ON public.reviews FOR INSERT
  WITH CHECK (true);

-- Update: Admin dapat mengatur featured_on_home (maks 3 ulasan beranda), dan customer dapat memberikan like
CREATE POLICY "Reviews: allow update"
  ON public.reviews FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Delete: Admin dapat menghapus ulasan yang spam/tidak pantas
CREATE POLICY "Reviews: allow delete"
  ON public.reviews FOR DELETE
  USING (true);

-- 5. Data Awal (Opsional / Starter Data jika tabel masih kosong)
-- Jika tabel kosong, masukkan 3 ulasan awal berstatus tampil di beranda
INSERT INTO public.reviews (
  user_name,
  user_city,
  product_name,
  product_slug,
  size,
  rating,
  comment,
  photo_url,
  featured_on_home,
  is_verified,
  helpful_count
)
SELECT 
  'Muhammad Rizky Pratama',
  'Jakarta Selatan',
  'Barokah Air Legacy Pro',
  'barokah-air-legacy-pro',
  'EU 42',
  5,
  'Gila sih ini kualitasnya! Material sol beneran empuk mirip bantal, dipakai seharian jalan kaki di mall dan ngantor nggak bikin pegel sama sekali. Jahitan rapi presisi, packaging double box tebal dan aman. Rekomendasi banget!',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80',
  TRUE,
  TRUE,
  38
WHERE NOT EXISTS (SELECT 1 FROM public.reviews);

INSERT INTO public.reviews (
  user_name,
  user_city,
  product_name,
  product_slug,
  size,
  rating,
  comment,
  photo_url,
  featured_on_home,
  is_verified,
  helpful_count
)
SELECT 
  'Bagas Arya Wicaksono',
  'Bandung',
  'Highland Leather Boots',
  'highland-leather-boots',
  'EU 43',
  5,
  'Kulit sapinya asli berasa solid dan premium abis, warna tan-nya maskulin banget. Dipakai riding motor touring langsung tahan banting dan grip solnya kuat nggak licin. Pelayanan CS Toko Barokah juga responsif waktu konsultasi size.',
  'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=400&q=80',
  TRUE,
  TRUE,
  29
WHERE (SELECT COUNT(*) FROM public.reviews) = 1;

INSERT INTO public.reviews (
  user_name,
  user_city,
  product_name,
  product_slug,
  size,
  rating,
  comment,
  photo_url,
  featured_on_home,
  is_verified,
  helpful_count
)
SELECT 
  'Hendro Kusumo',
  'Surabaya',
  'Royal Oxford Formal Classic',
  'royal-oxford-formal-classic',
  'EU 41',
  5,
  'Buat acara pernikahan dan meeting direksi bener-bener stand out! Finishing kilapnya mewah, sol Goodyear welted kokoh. Dapat garansi tukar ukuran juga bikin tenang pas checkout online. Beneran setiap langkah ada barokah!',
  'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=400&q=80',
  TRUE,
  TRUE,
  41
WHERE (SELECT COUNT(*) FROM public.reviews) = 2;
