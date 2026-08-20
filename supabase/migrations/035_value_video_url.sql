-- Optional YouTube value/training video per shop (Dashboard → Settings).

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS value_video_url text;
