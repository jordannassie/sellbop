-- Optional product sale pricing (regular price stays in price_cents)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS sale_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sale_price_cents integer,
  ADD COLUMN IF NOT EXISTS sale_ends_at timestamptz;

COMMENT ON COLUMN products.price_cents IS 'Regular/list price in cents';
COMMENT ON COLUMN products.sale_price_cents IS 'Optional sale price in cents when sale_enabled is true';
COMMENT ON COLUMN products.sale_ends_at IS 'Optional sale end timestamp; null means no automatic expiration';
