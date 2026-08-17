-- Product media gallery (images + video links)

CREATE TABLE IF NOT EXISTS product_media (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  seller_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_type    text NOT NULL CHECK (media_type IN ('image', 'video_link')),
  url           text NOT NULL,
  thumbnail_url text,
  provider      text NOT NULL CHECK (provider IN ('upload', 'youtube', 'loom', 'vimeo', 'wistia')),
  storage_path  text,
  sort_order    integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_media_product_sort_idx
  ON product_media (product_id, sort_order);

ALTER TABLE product_media ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'product_media' AND policyname = 'product_media_seller'
  ) THEN
    CREATE POLICY product_media_seller ON product_media
      FOR ALL TO authenticated
      USING (seller_id = auth.uid())
      WITH CHECK (seller_id = auth.uid());
  END IF;
END $$;
