-- ============================================================
-- 037 — Shop-level Marketplace master toggle
-- ============================================================
-- Product-level visibility uses existing products.marketplace_listing (migration 010).
-- Public Marketplace requires store.marketplace_enabled AND
-- product.marketplace_listing AND product.is_live.
--
-- RLS note: the dashboard API uses the service-role client after
-- userCanManageStore() — existing stores_update_owner policy covers
-- owner direct updates once this column exists.

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS marketplace_enabled boolean NOT NULL DEFAULT true;

-- Backfill existing shops (safe if column already existed with NULLs)
UPDATE public.stores
SET marketplace_enabled = true
WHERE marketplace_enabled IS DISTINCT FROM true;

NOTIFY pgrst, 'reload schema';
