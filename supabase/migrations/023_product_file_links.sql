-- Ensure product_files supports website links (Notion, Google Docs, etc.)
-- Safe to re-run in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS product_files (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  seller_id       uuid NOT NULL,
  file_name       text NOT NULL,
  file_url        text NOT NULL DEFAULT '',
  file_type       text NOT NULL DEFAULT 'other',
  visibility      text NOT NULL DEFAULT 'buyers',
  sort_order      integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE product_files
  ADD COLUMN IF NOT EXISTS file_size     bigint,
  ADD COLUMN IF NOT EXISTS storage_path  text,
  ADD COLUMN IF NOT EXISTS upload_status text DEFAULT 'complete';

UPDATE product_files SET upload_status = 'complete' WHERE upload_status IS NULL;

ALTER TABLE product_files ALTER COLUMN storage_path DROP NOT NULL;

ALTER TABLE product_files ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'product_files'
      AND policyname = 'sellers manage own product files'
  ) THEN
    CREATE POLICY "sellers manage own product files"
      ON product_files
      FOR ALL
      TO authenticated
      USING (seller_id = auth.uid())
      WITH CHECK (seller_id = auth.uid());
  END IF;
END $$;
