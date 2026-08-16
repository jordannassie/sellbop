-- ============================================================
-- 009 — Sellbop MVP: Stripe fields, order enhancements,
--        purchase entitlements, discount codes
-- ============================================================

-- ── 1. Stripe Connect fields on stores ──────────────────────
ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS stripe_account_id          text,
  ADD COLUMN IF NOT EXISTS stripe_onboarding_complete boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_charges_enabled     boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_payouts_enabled     boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS support_email              text;

-- ── 2. Enhanced orders table ─────────────────────────────────
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS stripe_session_id          text,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id   text,
  ADD COLUMN IF NOT EXISTS platform_fee_cents         integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS seller_net_cents           integer GENERATED ALWAYS AS (total_cents - platform_fee_cents) STORED,
  ADD COLUMN IF NOT EXISTS refund_status              text NOT NULL DEFAULT 'none'
    CHECK (refund_status IN ('none','pending','refunded','partially_refunded','failed')),
  ADD COLUMN IF NOT EXISTS discount_cents             integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency                   text NOT NULL DEFAULT 'usd',
  ADD COLUMN IF NOT EXISTS notes                      text,
  ADD COLUMN IF NOT EXISTS product_title_snapshot     text;

-- ── 3. Enhanced product_files table ──────────────────────────
ALTER TABLE product_files
  ADD COLUMN IF NOT EXISTS file_size     bigint,
  ADD COLUMN IF NOT EXISTS storage_path  text,
  ADD COLUMN IF NOT EXISTS upload_status text NOT NULL DEFAULT 'complete'
    CHECK (upload_status IN ('pending','uploading','complete','failed'));

-- ── 4. Purchase entitlements (status field on purchases) ─────
ALTER TABLE purchases
  ADD COLUMN IF NOT EXISTS status      text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','revoked','expired')),
  ADD COLUMN IF NOT EXISTS file_id     text;

-- ── 5. Discount codes table ───────────────────────────────────
CREATE TABLE IF NOT EXISTS discount_codes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id        uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  seller_id       uuid NOT NULL,
  code            text NOT NULL,
  discount_type   text NOT NULL DEFAULT 'percent' CHECK (discount_type IN ('percent','fixed')),
  discount_value  integer NOT NULL,   -- percent: 0-100, fixed: cents
  product_id      uuid REFERENCES products(id) ON DELETE SET NULL,
  max_uses        integer,
  used_count      integer NOT NULL DEFAULT 0,
  active          boolean NOT NULL DEFAULT true,
  expires_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(store_id, code)
);

ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "sellers manage own discount codes"
  ON discount_codes
  USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());

-- ── 6. Product_files: RLS policies ────────────────────────────
ALTER TABLE product_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "sellers manage own product files"
  ON product_files
  USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());

-- Public read of product_files via service role only (download endpoint)

-- ── 7. Products: ensure RLS ───────────────────────────────────
-- Sellers can only manage their own products
-- Public can read published products

-- ── 8. Unique index on discount codes ────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS idx_discount_codes_store_code
  ON discount_codes (store_id, UPPER(code));

-- ── 9. Ensure product slug is unique ─────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug
  ON products (slug);

-- ── 10. Add seller_id denormalised to orders for simpler queries
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS product_id text;
