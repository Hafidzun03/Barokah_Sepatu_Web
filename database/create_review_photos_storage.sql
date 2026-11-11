-- ============================================================
-- TOKO BAROKAH: Storage Bucket untuk Foto Ulasan
-- Jalankan di Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Buat bucket 'reviews' (public agar foto bisa ditampilkan tanpa auth)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reviews',
  'reviews',
  true,               -- public bucket: URL foto bisa diakses siapa saja
  10485760,           -- max 10 MB per file
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/gif'];

-- 2. Policy: siapa saja boleh membaca (GET) foto ulasan
DROP POLICY IF EXISTS "Review photos: public read" ON storage.objects;
CREATE POLICY "Review photos: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'reviews');

-- 3. Policy: user yang login boleh upload foto ulasan mereka
DROP POLICY IF EXISTS "Review photos: authenticated upload" ON storage.objects;
CREATE POLICY "Review photos: authenticated upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'reviews' AND auth.role() = 'authenticated');

-- 4. (Opsional) Policy: user boleh hapus foto mereka sendiri
DROP POLICY IF EXISTS "Review photos: owner delete" ON storage.objects;
CREATE POLICY "Review photos: owner delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'reviews' AND auth.uid()::text = (storage.foldername(name))[1]);
