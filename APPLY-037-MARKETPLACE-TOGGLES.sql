-- Apply in Supabase SQL Editor (migration 037)
-- REQUIRED for the dashboard "Sell on Marketplace" sidebar toggle.
--
-- Adds shop-level master toggle:
--   stores.marketplace_enabled  (NEW — this migration)
--
-- Product-level visibility already uses the existing column:
--   products.marketplace_listing  (added in migration 010 — DO NOT add marketplace_enabled)
--
-- Public Marketplace shows a product only when ALL are true:
--   stores.marketplace_enabled = true
--   products.marketplace_listing = true
--   products.is_live = true

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS marketplace_enabled boolean NOT NULL DEFAULT true;

-- Backfill existing shops so current Marketplace listings stay visible
UPDATE public.stores
SET marketplace_enabled = true
WHERE marketplace_enabled IS DISTINCT FROM true;

NOTIFY pgrst, 'reload schema';
