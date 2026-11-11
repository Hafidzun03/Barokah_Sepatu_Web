-- ============================================================
-- TOKO BAROKAH: TABEL VOUCHER LOYALITAS PELANGGAN (USER VOUCHERS)
-- Versi: 1.0 (Database Real Supabase)
-- 
-- Voucher otomatis didapatkan jika pelanggan telah membeli 10 pasang sepatu.
-- Setiap pelanggan mendapatkan kode voucher unik yang berbeda dan hanya sekali pakai (Diskon 30%).
-- 
-- Panduan:
-- 1. Buka Supabase Dashboard -> SQL Editor -> New Query
-- 2. Paste seluruh skrip ini dan klik "Run"
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_email VARCHAR(255),
  user_name VARCHAR(150),
  voucher_code VARCHAR(50) UNIQUE NOT NULL,
  discount_percent INT NOT NULL DEFAULT 30,
  description TEXT DEFAULT 'Voucher Loyalitas 10 Sepatu (Diskon 30% Semua Produk)',
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  used_order_number VARCHAR(100),
  shoes_purchased_count INT NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexing untuk pencarian cepat berdasarkan user dan kode
CREATE INDEX IF NOT EXISTS idx_user_vouchers_user_id ON public.user_vouchers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_vouchers_email ON public.user_vouchers(user_email);
CREATE INDEX IF NOT EXISTS idx_user_vouchers_code ON public.user_vouchers(voucher_code);
CREATE INDEX IF NOT EXISTS idx_user_vouchers_is_used ON public.user_vouchers(is_used);

-- Aktifkan Row Level Security (RLS)
ALTER TABLE public.user_vouchers ENABLE ROW LEVEL SECURITY;

-- Kebijakan RLS:
DROP POLICY IF EXISTS "User vouchers: allow read" ON public.user_vouchers;
DROP POLICY IF EXISTS "User vouchers: allow insert" ON public.user_vouchers;
DROP POLICY IF EXISTS "User vouchers: allow update" ON public.user_vouchers;
DROP POLICY IF EXISTS "User vouchers: allow delete" ON public.user_vouchers;

-- Read: Pelanggan & Admin dapat membaca voucher
CREATE POLICY "User vouchers: allow read"
  ON public.user_vouchers FOR SELECT
  USING (true);

-- Insert: Sistem / Pelanggan dapat membuat voucher loyalitas
CREATE POLICY "User vouchers: allow insert"
  ON public.user_vouchers FOR INSERT
  WITH CHECK (true);

-- Update: Menandai voucher sebagai sudah terpakai (is_used = true) saat checkout
CREATE POLICY "User vouchers: allow update"
  ON public.user_vouchers FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Delete: Admin dapat mengelola voucher
CREATE POLICY "User vouchers: allow delete"
  ON public.user_vouchers FOR DELETE
  USING (true);
