-- ============================================================
-- 006 — Store branding mode + storage bucket declarations
-- ============================================================

-- 1. Store branding settings
ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS branding_mode text NOT NULL DEFAULT 'minimal'
    CHECK (branding_mode IN ('minimal', 'powered_by', 'full_header'));

-- 2. Declare storage buckets (idempotent — insert only if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('store-images',   'store-images',   true,  5242880,  ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('store-banners',  'store-banners',  true,  10485760, ARRAY['image/jpeg','image/png','image/webp']),
  ('product-images', 'product-images', true,  5242880,  ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('product-files',  'product-files',  false, 104857600, NULL)
ON CONFLICT (id) DO NOTHING;

-- 3. RLS policies for storage buckets

-- store-images: anyone can read, authenticated owners can upload
CREATE POLICY IF NOT EXISTS "store-images read" ON storage.objects
  FOR SELECT USING (bucket_id = 'store-images');

CREATE POLICY IF NOT EXISTS "store-images upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'store-images' AND auth.role() = 'authenticated');

-- store-banners
CREATE POLICY IF NOT EXISTS "store-banners read" ON storage.objects
  FOR SELECT USING (bucket_id = 'store-banners');

CREATE POLICY IF NOT EXISTS "store-banners upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'store-banners' AND auth.role() = 'authenticated');

-- product-images
CREATE POLICY IF NOT EXISTS "product-images read" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY IF NOT EXISTS "product-images upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- product-files: authenticated users can upload; downloads via signed URLs only
CREATE POLICY IF NOT EXISTS "product-files upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-files' AND auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "product-files owner read" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-files' AND auth.role() = 'authenticated');
