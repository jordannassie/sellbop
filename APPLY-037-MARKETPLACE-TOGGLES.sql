-- Apply in Supabase SQL Editor (migration 037)
-- Shop-level Marketplace master toggle. Product-level uses products.marketplace_listing.

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS marketplace_enabled boolean NOT NULL DEFAULT true;

UPDATE public.stores
SET marketplace_enabled = true
WHERE marketplace_enabled IS DISTINCT FROM true;

NOTIFY pgrst, 'reload schema';
