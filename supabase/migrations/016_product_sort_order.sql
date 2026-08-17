-- ============================================================
-- 016 — Manual product display order
-- ============================================================
-- Adds a seller-controlled sort_order to products so sellers can
-- reorder how products appear in their dashboard list and on
-- their public storefront, independent of creation date.
--
-- Idempotent — safe to re-run.
-- ============================================================

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- Backfill: give existing products a stable initial order per store,
-- newest first (matches the previous default "created_at desc" sort),
-- without disturbing rows that already have a non-zero sort_order.
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY store_id ORDER BY created_at DESC
  ) AS rn
  FROM products
  WHERE sort_order = 0
)
UPDATE products
SET sort_order = ranked.rn
FROM ranked
WHERE products.id = ranked.id;

CREATE INDEX IF NOT EXISTS products_store_sort_idx ON products(store_id, sort_order);
