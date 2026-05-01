-- ============================================================
-- 008 — AI image tools: bucket + optional schema columns
-- ============================================================

-- 1. AI-generated-images storage bucket (public read, server-write only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ai-generated-images',
  'ai-generated-images',
  true,
  10485760,
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Ensure stores.image_url column exists (avatar / profile image field)
ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS image_url text;

-- 3. Ensure stores.banner_url exists (was added in 006, guard here for safety)
ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS banner_url text;

-- 4. Ensure products.cover_image_url exists
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS cover_image_url text;

-- 5. Optional: ai_assets table for tracking generated images
CREATE TABLE IF NOT EXISTS ai_assets (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url    text NOT NULL,
  storage_path text,
  image_type   text,
  prompt       text,
  source       text DEFAULT 'generated',
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- RLS for ai_assets
ALTER TABLE ai_assets ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_assets' AND policyname = 'ai_assets_owner_all'
  ) THEN
    CREATE POLICY ai_assets_owner_all ON ai_assets
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 6. RLS policies for ai-generated-images bucket
-- Public read (already set by public=true on the bucket)
-- Server-only write: only the service role can insert (no anon insert policy)
-- The generate-image and edit-image API routes use the admin/service-role client.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'ai_generated_images_public_select'
  ) THEN
    CREATE POLICY ai_generated_images_public_select
      ON storage.objects FOR SELECT
      USING (bucket_id = 'ai-generated-images');
  END IF;
END $$;
