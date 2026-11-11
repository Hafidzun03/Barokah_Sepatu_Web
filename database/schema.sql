-- ============================================================
-- BAROKAH SHOES E-COMMERCE — Supabase PostgreSQL Schema
-- Version: 1.0
-- Database: Supabase (PostgreSQL 15+)
-- 
-- Panduan:
-- 1. Buka Supabase Dashboard → SQL Editor
-- 2. Copy-paste seluruh file ini
-- 3. Klik "Run" untuk mengeksekusi
-- ============================================================

-- ============================================================
-- BAGIAN 1: EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- BAGIAN 2: CUSTOM TYPES (ENUM)
-- ============================================================
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('customer', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'menunggu_pembayaran',
    'menunggu_konfirmasi',
    'diproses',
    'dikirim',
    'selesai',
    'dibatalkan'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM (
    'belum_dibayar',
    'menunggu_verifikasi',
    'lunas',
    'gagal',
    'dikembalikan'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM (
    'transfer_bank',
    'ewallet',
    'cod'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- BAGIAN 3: HELPER FUNCTIONS
-- ============================================================

-- Fungsi untuk auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fungsi untuk generate order number: ORD-YYYYMMDD-XXXXX
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  today_date TEXT;
  seq_num INT;
  new_order_number TEXT;
BEGIN
  today_date := TO_CHAR(NOW(), 'YYYYMMDD');
  
  SELECT COUNT(*) + 1 INTO seq_num
  FROM orders
  WHERE created_at::DATE = CURRENT_DATE;
  
  new_order_number := 'ORD-' || today_date || '-' || LPAD(seq_num::TEXT, 5, '0');
  
  RETURN new_order_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- BAGIAN 4: TABEL UTAMA
-- ============================================================

-- 4.1 PROFILES (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'customer',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE profiles IS 'Profil pengguna, extends auth.users Supabase';

-- 4.2 CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(120) NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE categories IS 'Kategori produk sepatu';

-- 4.3 PRODUCTS
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(280) NOT NULL UNIQUE,
  description TEXT,
  base_price BIGINT NOT NULL CHECK (base_price >= 0),
  discount_price BIGINT CHECK (discount_price IS NULL OR discount_price >= 0),
  brand VARCHAR(100),
  material VARCHAR(100),
  weight_grams INT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  total_sold INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_is_featured ON products(is_featured);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_name_search ON products USING GIN (to_tsvector('indonesian', name || ' ' || COALESCE(description, '')));

COMMENT ON TABLE products IS 'Produk sepatu utama';
COMMENT ON COLUMN products.base_price IS 'Harga dalam Rupiah (tanpa desimal)';
COMMENT ON COLUMN products.discount_price IS 'Harga diskon, NULL jika tidak diskon';

-- 4.4 PRODUCT VARIANTS (ukuran + stok)
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku VARCHAR(50) NOT NULL UNIQUE,
  size VARCHAR(10) NOT NULL,
  color VARCHAR(50),
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  price_override BIGINT CHECK (price_override IS NULL OR price_override >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(product_id, size, color)
);

CREATE TRIGGER set_product_variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_variants_sku ON product_variants(sku);

COMMENT ON TABLE product_variants IS 'Variasi produk per ukuran/warna dengan stok masing-masing';

-- 4.5 PRODUCT IMAGES
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text VARCHAR(255),
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_images_product ON product_images(product_id);

COMMENT ON TABLE product_images IS 'Galeri foto produk';

-- 4.6 ADDRESSES
CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label VARCHAR(50) DEFAULT 'Rumah',
  recipient_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address_line TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  province VARCHAR(100) NOT NULL,
  postal_code VARCHAR(10) NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_addresses_updated_at
  BEFORE UPDATE ON addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_addresses_user ON addresses(user_id);

COMMENT ON TABLE addresses IS 'Alamat pengiriman pelanggan';

-- 4.7 CART (server-side cart untuk user yang login)
CREATE TABLE IF NOT EXISTS carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_carts_updated_at
  BEFORE UPDATE ON carts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4.8 CART ITEMS
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(cart_id, product_variant_id)
);

CREATE TRIGGER set_cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);

-- 4.9 ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(30) NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  
  -- Snapshot alamat (tidak berubah walau alamat profil diupdate)
  recipient_name VARCHAR(100) NOT NULL,
  recipient_phone VARCHAR(20) NOT NULL,
  shipping_address TEXT NOT NULL,
  shipping_city VARCHAR(100) NOT NULL,
  shipping_province VARCHAR(100) NOT NULL,
  shipping_postal_code VARCHAR(10) NOT NULL,
  
  -- Finansial (dalam Rupiah, tanpa desimal)
  subtotal BIGINT NOT NULL CHECK (subtotal >= 0),
  shipping_cost BIGINT NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
  discount_amount BIGINT NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  total BIGINT NOT NULL CHECK (total >= 0),
  
  -- Status
  order_status order_status NOT NULL DEFAULT 'menunggu_pembayaran',
  payment_status payment_status NOT NULL DEFAULT 'belum_dibayar',
  payment_method payment_method,
  
  -- Catatan
  customer_notes TEXT,
  admin_notes TEXT,
  
  -- Timestamps
  paid_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_orders_payment ON orders(payment_status);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

COMMENT ON TABLE orders IS 'Pesanan pelanggan dengan snapshot alamat';

-- 4.10 ORDER ITEMS
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  
  -- Snapshot data produk saat transaksi (tidak berubah)
  product_name VARCHAR(255) NOT NULL,
  product_image_url TEXT,
  size VARCHAR(10) NOT NULL,
  color VARCHAR(50),
  sku VARCHAR(50),
  
  -- Finansial
  unit_price BIGINT NOT NULL CHECK (unit_price >= 0),
  quantity INT NOT NULL CHECK (quantity > 0),
  line_total BIGINT NOT NULL CHECK (line_total >= 0),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

COMMENT ON TABLE order_items IS 'Item dalam pesanan dengan snapshot harga dan produk';

-- 4.11 PAYMENTS (bukti pembayaran)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  method payment_method NOT NULL,
  amount BIGINT NOT NULL CHECK (amount >= 0),
  status payment_status NOT NULL DEFAULT 'menunggu_verifikasi',
  
  -- Detail pembayaran
  bank_name VARCHAR(50),
  account_number VARCHAR(30),
  account_holder VARCHAR(100),
  transfer_proof_url TEXT,
  reference_number VARCHAR(100),
  
  -- Verifikasi admin
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);

COMMENT ON TABLE payments IS 'Catatan pembayaran dan bukti transfer';

-- 4.12 ORDER STATUS LOG (audit trail)
CREATE TABLE IF NOT EXISTS order_status_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  previous_status order_status,
  new_status order_status NOT NULL,
  changed_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_status_logs_order ON order_status_logs(order_id);

COMMENT ON TABLE order_status_logs IS 'Log perubahan status pesanan untuk audit';

-- 4.13 WISHLIST
CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_wishlists_user ON wishlists(user_id);

COMMENT ON TABLE wishlists IS 'Wishlist produk pelanggan';

-- 4.14 NEWSLETTER SUBSCRIBERS
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ
);

COMMENT ON TABLE newsletter_subscribers IS 'Subscriber newsletter';

-- 4.15 BANK ACCOUNTS (untuk transfer manual)
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bank_name VARCHAR(50) NOT NULL,
  account_number VARCHAR(30) NOT NULL,
  account_holder VARCHAR(100) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE bank_accounts IS 'Rekening bank toko untuk pembayaran transfer';

-- ============================================================
-- BAGIAN 5: DATABASE FUNCTIONS
-- ============================================================

-- Fungsi: Buat profil otomatis saat user Supabase Auth mendaftar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.email,
    'customer'
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    name = COALESCE(EXCLUDED.name, public.profiles.name),
    email = EXCLUDED.email;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Mencegah "Database error saving new user" jika terjadi kendala pada profiles
  RAISE WARNING 'handle_new_user warning: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Trigger: Auto-create profile on auth signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fungsi: Validasi stok sebelum order
CREATE OR REPLACE FUNCTION validate_and_reduce_stock(
  p_variant_id UUID,
  p_quantity INT
)
RETURNS BOOLEAN AS $$
DECLARE
  current_stock INT;
BEGIN
  -- Lock row untuk mencegah race condition
  SELECT stock INTO current_stock
  FROM product_variants
  WHERE id = p_variant_id
  FOR UPDATE;
  
  IF current_stock IS NULL THEN
    RAISE EXCEPTION 'Varian produk tidak ditemukan';
  END IF;
  
  IF current_stock < p_quantity THEN
    RAISE EXCEPTION 'Stok tidak mencukupi. Tersedia: %, Diminta: %', current_stock, p_quantity;
  END IF;
  
  -- Kurangi stok
  UPDATE product_variants
  SET stock = stock - p_quantity
  WHERE id = p_variant_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fungsi: Kembalikan stok saat pesanan dibatalkan
CREATE OR REPLACE FUNCTION restore_stock_on_cancel()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_status = 'dibatalkan' AND OLD.order_status != 'dibatalkan' THEN
    UPDATE product_variants pv
    SET stock = pv.stock + oi.quantity
    FROM order_items oi
    WHERE oi.order_id = NEW.id
      AND oi.product_variant_id = pv.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_restore_stock_on_cancel
  AFTER UPDATE OF order_status ON orders
  FOR EACH ROW EXECUTE FUNCTION restore_stock_on_cancel();

-- Fungsi: Log perubahan status pesanan
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.order_status IS DISTINCT FROM NEW.order_status THEN
    INSERT INTO order_status_logs (order_id, previous_status, new_status)
    VALUES (NEW.id, OLD.order_status, NEW.order_status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_order_status
  AFTER UPDATE OF order_status ON orders
  FOR EACH ROW EXECUTE FUNCTION log_order_status_change();

-- Fungsi: Update total_sold di products saat order selesai
CREATE OR REPLACE FUNCTION update_total_sold()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_status = 'selesai' AND OLD.order_status != 'selesai' THEN
    UPDATE products p
    SET total_sold = p.total_sold + oi.quantity
    FROM order_items oi
    WHERE oi.order_id = NEW.id
      AND oi.product_variant_id IN (
        SELECT pv.id FROM product_variants pv WHERE pv.product_id = p.id
      );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_total_sold
  AFTER UPDATE OF order_status ON orders
  FOR EACH ROW EXECUTE FUNCTION update_total_sold();

-- ============================================================
-- BAGIAN 6: ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS pada semua tabel
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

-- Helper: cek apakah user adalah admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- --- PROFILES ---
CREATE POLICY "Profiles: users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Profiles: users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Profiles: users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Profiles: admin can view all"
  ON profiles FOR SELECT
  USING (is_admin());

CREATE POLICY "Profiles: admin can update all"
  ON profiles FOR UPDATE
  USING (is_admin());

-- --- CATEGORIES ---
CREATE POLICY "Categories: public read active"
  ON categories FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Categories: admin read all"
  ON categories FOR SELECT
  USING (is_admin());

CREATE POLICY "Categories: admin insert"
  ON categories FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Categories: admin update"
  ON categories FOR UPDATE
  USING (is_admin());

CREATE POLICY "Categories: admin delete"
  ON categories FOR DELETE
  USING (is_admin());

-- --- PRODUCTS ---
CREATE POLICY "Products: public read active"
  ON products FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Products: admin read all"
  ON products FOR SELECT
  USING (is_admin());

CREATE POLICY "Products: admin insert"
  ON products FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Products: admin update"
  ON products FOR UPDATE
  USING (is_admin());

CREATE POLICY "Products: admin delete"
  ON products FOR DELETE
  USING (is_admin());

-- --- PRODUCT VARIANTS ---
CREATE POLICY "Variants: public read"
  ON product_variants FOR SELECT
  USING (TRUE);

CREATE POLICY "Variants: admin insert"
  ON product_variants FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Variants: admin update"
  ON product_variants FOR UPDATE
  USING (is_admin());

CREATE POLICY "Variants: admin delete"
  ON product_variants FOR DELETE
  USING (is_admin());

-- --- PRODUCT IMAGES ---
CREATE POLICY "Images: public read"
  ON product_images FOR SELECT
  USING (TRUE);

CREATE POLICY "Images: admin insert"
  ON product_images FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Images: admin update"
  ON product_images FOR UPDATE
  USING (is_admin());

CREATE POLICY "Images: admin delete"
  ON product_images FOR DELETE
  USING (is_admin());

-- --- ADDRESSES ---
CREATE POLICY "Addresses: user read own"
  ON addresses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Addresses: user insert own"
  ON addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Addresses: user update own"
  ON addresses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Addresses: user delete own"
  ON addresses FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Addresses: admin read all"
  ON addresses FOR SELECT
  USING (is_admin());

-- --- CARTS ---
CREATE POLICY "Carts: user read own"
  ON carts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Carts: user insert own"
  ON carts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Carts: user update own"
  ON carts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Carts: user delete own"
  ON carts FOR DELETE
  USING (auth.uid() = user_id);

-- --- CART ITEMS ---
CREATE POLICY "Cart items: user read own"
  ON cart_items FOR SELECT
  USING (cart_id IN (SELECT id FROM carts WHERE user_id = auth.uid()));

CREATE POLICY "Cart items: user insert own"
  ON cart_items FOR INSERT
  WITH CHECK (cart_id IN (SELECT id FROM carts WHERE user_id = auth.uid()));

CREATE POLICY "Cart items: user update own"
  ON cart_items FOR UPDATE
  USING (cart_id IN (SELECT id FROM carts WHERE user_id = auth.uid()));

CREATE POLICY "Cart items: user delete own"
  ON cart_items FOR DELETE
  USING (cart_id IN (SELECT id FROM carts WHERE user_id = auth.uid()));

-- --- ORDERS ---
CREATE POLICY "Orders: user own read"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Orders: user create"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Orders: admin read all"
  ON orders FOR SELECT
  USING (is_admin());

CREATE POLICY "Orders: admin update"
  ON orders FOR UPDATE
  USING (is_admin());

-- --- ORDER ITEMS ---
CREATE POLICY "Order items: user own read"
  ON order_items FOR SELECT
  USING (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()));

CREATE POLICY "Order items: user create"
  ON order_items FOR INSERT
  WITH CHECK (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()));

CREATE POLICY "Order items: admin read all"
  ON order_items FOR SELECT
  USING (is_admin());

-- --- PAYMENTS ---
CREATE POLICY "Payments: user own read"
  ON payments FOR SELECT
  USING (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()));

CREATE POLICY "Payments: user create"
  ON payments FOR INSERT
  WITH CHECK (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()));

CREATE POLICY "Payments: admin read all"
  ON payments FOR SELECT
  USING (is_admin());

CREATE POLICY "Payments: admin update"
  ON payments FOR UPDATE
  USING (is_admin());

-- --- ORDER STATUS LOGS ---
CREATE POLICY "Status logs: user own read"
  ON order_status_logs FOR SELECT
  USING (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()));

CREATE POLICY "Status logs: admin read all"
  ON order_status_logs FOR SELECT
  USING (is_admin());

-- --- WISHLISTS ---
CREATE POLICY "Wishlists: user read own"
  ON wishlists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Wishlists: user insert own"
  ON wishlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Wishlists: user delete own"
  ON wishlists FOR DELETE
  USING (auth.uid() = user_id);

-- --- NEWSLETTER ---
CREATE POLICY "Newsletter: anyone can subscribe"
  ON newsletter_subscribers FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Newsletter: admin read"
  ON newsletter_subscribers FOR SELECT
  USING (is_admin());

CREATE POLICY "Newsletter: admin manage"
  ON newsletter_subscribers FOR UPDATE
  USING (is_admin());

-- --- BANK ACCOUNTS ---
CREATE POLICY "Bank accounts: public read active"
  ON bank_accounts FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Bank accounts: admin insert"
  ON bank_accounts FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Bank accounts: admin update"
  ON bank_accounts FOR UPDATE
  USING (is_admin());

CREATE POLICY "Bank accounts: admin delete"
  ON bank_accounts FOR DELETE
  USING (is_admin());

-- ============================================================
-- BAGIAN 7: STORAGE BUCKETS
-- ============================================================

-- Bucket untuk foto produk
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  TRUE,
  5242880, -- 5MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket untuk bukti transfer
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-proofs',
  'payment-proofs',
  FALSE,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket untuk avatar user
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  TRUE,
  2097152, -- 2MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: product images (public read, admin write)
CREATE POLICY "Product images: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Product images: admin upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND is_admin());

CREATE POLICY "Product images: admin delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND is_admin());

-- Storage policies: payment proofs
CREATE POLICY "Payment proofs: user upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'payment-proofs' AND auth.uid() IS NOT NULL);

CREATE POLICY "Payment proofs: admin read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'payment-proofs' AND is_admin());

-- Storage policies: avatars
CREATE POLICY "Avatars: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Avatars: user upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

-- ============================================================
-- BAGIAN 8: VIEWS (untuk kemudahan query)
-- ============================================================

-- View: Produk lengkap dengan kategori dan gambar utama
CREATE OR REPLACE VIEW v_products_catalog AS
SELECT 
  p.id,
  p.name,
  p.slug,
  p.description,
  p.base_price,
  p.discount_price,
  p.brand,
  p.material,
  p.is_active,
  p.is_featured,
  p.total_sold,
  p.created_at,
  c.id AS category_id,
  c.name AS category_name,
  c.slug AS category_slug,
  pi.image_url AS primary_image_url,
  (
    SELECT COALESCE(SUM(pv.stock), 0)
    FROM product_variants pv
    WHERE pv.product_id = p.id AND pv.is_active = TRUE
  ) AS total_stock,
  (
    SELECT json_agg(json_build_object(
      'id', pv.id,
      'size', pv.size,
      'color', pv.color,
      'stock', pv.stock,
      'price_override', pv.price_override,
      'is_active', pv.is_active
    ) ORDER BY pv.size)
    FROM product_variants pv
    WHERE pv.product_id = p.id
  ) AS variants,
  (
    SELECT json_agg(json_build_object(
      'id', img.id,
      'image_url', img.image_url,
      'is_primary', img.is_primary
    ) ORDER BY img.sort_order)
    FROM product_images img
    WHERE img.product_id = p.id
  ) AS images
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = TRUE;

-- View: Ringkasan pesanan untuk admin
CREATE OR REPLACE VIEW v_orders_summary AS
SELECT 
  o.id,
  o.order_number,
  o.created_at,
  o.total,
  o.order_status,
  o.payment_status,
  o.payment_method,
  p.name AS customer_name,
  p.email AS customer_email,
  o.recipient_name,
  o.shipping_city,
  (
    SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id
  ) AS item_count
FROM orders o
LEFT JOIN profiles p ON o.user_id = p.id
ORDER BY o.created_at DESC;

-- ============================================================
-- BAGIAN 9: SEED DATA
-- ============================================================

-- 9.1 Kategori produk
INSERT INTO categories (name, slug, description, sort_order) VALUES
  ('Pria', 'pria', 'Koleksi sepatu pria', 1),
  ('Wanita', 'wanita', 'Koleksi sepatu wanita', 2),
  ('Anak', 'anak', 'Koleksi sepatu anak-anak', 3),
  ('Running', 'running', 'Sepatu lari dan olahraga', 4),
  ('Casual', 'casual', 'Sepatu kasual sehari-hari', 5),
  ('Sandal', 'sandal', 'Koleksi sandal dan slip-on', 6)
ON CONFLICT (slug) DO NOTHING;

-- 9.2 Produk sample
INSERT INTO products (name, slug, description, base_price, discount_price, brand, material, is_featured, category_id) VALUES
(
  'Barokah Runner Pro X',
  'barokah-runner-pro-x',
  'Sepatu lari premium dengan teknologi bantalan responsif untuk kenyamanan maksimal. Desain aerodinamis dengan mesh breathable.',
  899000,
  749000,
  'Barokah',
  'Mesh + Rubber Sole',
  TRUE,
  (SELECT id FROM categories WHERE slug = 'running')
),
(
  'Urban Classic Leather',
  'urban-classic-leather',
  'Sepatu kulit kasual yang elegan untuk gaya sehari-hari. Kulit asli berkualitas tinggi dengan sol karet tahan lama.',
  1250000,
  NULL,
  'Barokah',
  'Genuine Leather',
  TRUE,
  (SELECT id FROM categories WHERE slug = 'pria')
),
(
  'Street Flex Canvas',
  'street-flex-canvas',
  'Sneakers kanvas ringan dan fleksibel. Cocok untuk aktivitas sehari-hari dengan gaya streetwear.',
  459000,
  399000,
  'Barokah',
  'Canvas + EVA Sole',
  TRUE,
  (SELECT id FROM categories WHERE slug = 'casual')
),
(
  'Lady Comfort Slip-On',
  'lady-comfort-slip-on',
  'Slip-on wanita dengan bantalan memori foam. Nyaman dipakai seharian tanpa rasa pegal.',
  549000,
  NULL,
  'Barokah',
  'Knit + Memory Foam',
  TRUE,
  (SELECT id FROM categories WHERE slug = 'wanita')
),
(
  'Junior Active Velcro',
  'junior-active-velcro',
  'Sepatu anak dengan penutup velcro yang mudah dipakai sendiri. Ringan, aman, dan tahan lama.',
  349000,
  299000,
  'Barokah',
  'Synthetic + Rubber',
  FALSE,
  (SELECT id FROM categories WHERE slug = 'anak')
),
(
  'Summit Trail Hiker',
  'summit-trail-hiker',
  'Sepatu hiking tangguh untuk medan berat. Waterproof dengan grip luar biasa di segala permukaan.',
  1450000,
  NULL,
  'Barokah',
  'Nubuck Leather + Vibram Sole',
  TRUE,
  (SELECT id FROM categories WHERE slug = 'pria')
)
ON CONFLICT (slug) DO NOTHING;

-- 9.3 Varian produk (ukuran + stok)
DO $$
DECLARE
  prod RECORD;
  sizes TEXT[] := ARRAY['38', '39', '40', '41', '42', '43', '44'];
  kid_sizes TEXT[] := ARRAY['28', '29', '30', '31', '32', '33', '34'];
  s TEXT;
  counter INT := 1;
BEGIN
  FOR prod IN SELECT id, slug FROM products LOOP
    IF prod.slug = 'junior-active-velcro' THEN
      FOREACH s IN ARRAY kid_sizes LOOP
        INSERT INTO product_variants (product_id, sku, size, stock)
        VALUES (
          prod.id,
          'BRK-' || LPAD(counter::TEXT, 4, '0'),
          s,
          FLOOR(RANDOM() * 20 + 5)::INT
        )
        ON CONFLICT (product_id, size, color) DO NOTHING;
        counter := counter + 1;
      END LOOP;
    ELSE
      FOREACH s IN ARRAY sizes LOOP
        INSERT INTO product_variants (product_id, sku, size, stock)
        VALUES (
          prod.id,
          'BRK-' || LPAD(counter::TEXT, 4, '0'),
          s,
          FLOOR(RANDOM() * 20 + 5)::INT
        )
        ON CONFLICT (product_id, size, color) DO NOTHING;
        counter := counter + 1;
      END LOOP;
    END IF;
  END LOOP;
END $$;

-- 9.4 Gambar produk (placeholder URLs — ganti dengan URL Supabase Storage nanti)
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT 
  id,
  'https://placehold.co/800x800/F2F2F2/171717?text=' || REPLACE(name, ' ', '+'),
  name || ' - Tampilan utama',
  TRUE,
  0
FROM products
ON CONFLICT DO NOTHING;

-- 9.5 Seed bank accounts
INSERT INTO bank_accounts (bank_name, account_number, account_holder) VALUES
  ('BCA', '1234567890', 'Toko Barokah Shoes'),
  ('BRI', '0987654321', 'Toko Barokah Shoes'),
  ('Mandiri', '1122334455', 'Toko Barokah Shoes')
ON CONFLICT DO NOTHING;

-- ============================================================
-- SELESAI! 
-- 
-- Langkah selanjutnya setelah menjalankan SQL ini:
--
-- 1. Buat admin pertama:
--    a. Daftar user biasa via Supabase Auth (Dashboard atau API)
--    b. Update role-nya di SQL Editor:
--       UPDATE profiles SET role = 'admin' WHERE email = 'emailadmin@example.com';
--
-- 2. Upload foto produk ke bucket 'product-images' via Supabase Storage
--
-- 3. Update image_url di product_images dengan URL public dari storage:
--    UPDATE product_images 
--    SET image_url = 'https://[PROJECT_REF].supabase.co/storage/v1/object/public/product-images/[filename]'
--    WHERE product_id = '[product_uuid]';
--
-- ============================================================
