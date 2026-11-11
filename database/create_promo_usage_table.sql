-- ============================================================
-- TOKO BAROKAH: TABEL PENGGUNAAN KODE PROMO (PROMO USAGE TRACKING)
-- Versi: 1.0 (Database Real Supabase)
-- 
-- Melacak penggunaan kode promo per pengguna agar setiap kode
-- hanya bisa digunakan SEKALI per akun pelanggan.
-- Berlaku untuk: BAROKAH10 dan kode promo lainnya.
-- 
-- Panduan:
-- 1. Buka Supabase Dashboard -> SQL Editor -> New Query
-- 2. Paste seluruh skrip ini dan klik "Run"
-- ============================================================

CREATE TABLE IF NOT EXISTS public.promo_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_email VARCHAR(255) NOT NULL,
  promo_code VARCHAR(50) NOT NULL,
  order_number VARCHAR(100),
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint: satu user hanya bisa pakai satu kode promo sekali
CREATE UNIQUE INDEX IF NOT EXISTS idx_promo_usage_user_code 
  ON public.promo_usage(user_email, promo_code);

-- Indexing untuk pencarian cepat
CREATE INDEX IF NOT EXISTS idx_promo_usage_user_id ON public.promo_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_promo_usage_email ON public.promo_usage(user_email);
CREATE INDEX IF NOT EXISTS idx_promo_usage_code ON public.promo_usage(promo_code);

-- Aktifkan Row Level Security (RLS)
ALTER TABLE public.promo_usage ENABLE ROW LEVEL SECURITY;

-- Kebijakan RLS:
DROP POLICY IF EXISTS "Promo usage: allow read" ON public.promo_usage;
DROP POLICY IF EXISTS "Promo usage: allow insert" ON public.promo_usage;

-- Read: Pelanggan & Admin dapat melihat riwayat pemakaian promo
CREATE POLICY "Promo usage: allow read"
  ON public.promo_usage FOR SELECT
  USING (true);

-- Insert: Sistem dapat mencatat pemakaian promo
CREATE POLICY "Promo usage: allow insert"
  ON public.promo_usage FOR INSERT
  WITH CHECK (true);
