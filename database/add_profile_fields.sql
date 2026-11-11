-- ============================================================
-- TAMBAH KOLOM PROFIL & SINKRONISASI DATA CHECKOUT
-- Jalankan script ini di Supabase SQL Editor
-- ============================================================

-- 1. Tambah kolom profil jika belum ada
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS province VARCHAR(100);

-- 2. Update trigger registrasi user baru agar menyimpan data lengkap dari Step 2 pendaftaran
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name TEXT;
  v_phone TEXT;
  v_address TEXT;
  v_postal TEXT;
  v_city TEXT;
  v_province TEXT;
BEGIN
  v_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );
  v_phone := COALESCE(
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'phone_number',
    ''
  );
  v_address := COALESCE(NEW.raw_user_meta_data->>'address', '');
  v_postal := COALESCE(NEW.raw_user_meta_data->>'postal_code', NEW.raw_user_meta_data->>'postalCode', '');
  v_city := COALESCE(NEW.raw_user_meta_data->>'city', '');
  v_province := COALESCE(NEW.raw_user_meta_data->>'province', '');

  INSERT INTO public.profiles (
    id, name, email, phone, phone_number, address, postal_code, city, province, role
  )
  VALUES (
    NEW.id,
    v_name,
    NEW.email,
    v_phone,
    v_phone,
    v_address,
    v_postal,
    v_city,
    v_province,
    'customer'
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(NULLIF(EXCLUDED.name, ''), profiles.name),
    phone = COALESCE(NULLIF(EXCLUDED.phone, ''), profiles.phone),
    phone_number = COALESCE(NULLIF(EXCLUDED.phone_number, ''), profiles.phone_number),
    address = COALESCE(NULLIF(EXCLUDED.address, ''), profiles.address),
    postal_code = COALESCE(NULLIF(EXCLUDED.postal_code, ''), profiles.postal_code),
    city = COALESCE(NULLIF(EXCLUDED.city, ''), profiles.city),
    province = COALESCE(NULLIF(EXCLUDED.province, ''), profiles.province);

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

-- 3. Pasang ulang trigger auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Beri akses update profile untuk user masing-masing (RLS Policy)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'Users can update their own profile'
  ) THEN
    CREATE POLICY "Users can update their own profile"
      ON public.profiles FOR UPDATE
      TO authenticated
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;
