-- ============================================================
-- 037 — Shop-level Marketplace master toggle
-- ============================================================
-- Product-level visibility remains on products.marketplace_listing.
-- Public Marketplace requires store.marketplace_enabled AND
-- product.marketplace_listing AND product.is_live.

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS marketplace_enabled boolean NOT NULL DEFAULT true;

-- Backfill existing shops (safe if column already existed with NULLs)
UPDATE public.stores
SET marketplace_enabled = true
WHERE marketplace_enabled IS DISTINCT FROM true;

NOTIFY pgrst, 'reload schema';
