-- Apply in Supabase SQL Editor (migration 035)
-- Optional YouTube value video per shop.

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS value_video_url text;
