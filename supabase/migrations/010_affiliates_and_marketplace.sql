-- ============================================================
-- 010 — Affiliates (Sellbop Share) + Marketplace
-- ============================================================
-- Run this in the Supabase SQL Editor for production.
-- All ALTER TABLE statements use IF NOT EXISTS — safe to re-run.

-- ── 1. Product marketplace + affiliate fields ─────────────────
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS category                    text,
  ADD COLUMN IF NOT EXISTS marketplace_listing         boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS affiliate_enabled           boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS affiliate_commission_percent integer  -- 0-100
    CHECK (affiliate_commission_percent IS NULL OR (affiliate_commission_percent >= 0 AND affiliate_commission_percent <= 100)),
  ADD COLUMN IF NOT EXISTS affiliate_updated_at        timestamptz;

-- ── 2. Affiliate relationships ───────────────────────────────
CREATE TABLE IF NOT EXISTS affiliate_relationships (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id uuid        NOT NULL,  -- Supabase auth user id
  product_id        uuid        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  seller_id         uuid        NOT NULL,  -- owner_user_id of the store
  referral_code     text        NOT NULL,
  source            text        NOT NULL DEFAULT 'manual_join'
    CHECK (source IN ('purchase', 'manual_join')),
  status            text        NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'disabled')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (affiliate_user_id, product_id),
  UNIQUE (referral_code)
);

ALTER TABLE affiliate_relationships ENABLE ROW LEVEL SECURITY;

-- Affiliate can see their own relationships
CREATE POLICY IF NOT EXISTS "affiliates see own relationships"
  ON affiliate_relationships FOR SELECT
  USING (affiliate_user_id = auth.uid());

-- Seller can see relationships for their products
CREATE POLICY IF NOT EXISTS "sellers see product relationships"
  ON affiliate_relationships FOR SELECT
  USING (seller_id = auth.uid());

-- Authenticated users can insert (joining as affiliate)
CREATE POLICY IF NOT EXISTS "authenticated insert affiliate relationship"
  ON affiliate_relationships FOR INSERT
  WITH CHECK (affiliate_user_id = auth.uid());

-- Seller can disable relationships for their products
CREATE POLICY IF NOT EXISTS "sellers update affiliate relationships"
  ON affiliate_relationships FOR UPDATE
  USING (seller_id = auth.uid());

-- ── 3. Affiliate clicks ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id  uuid        NOT NULL REFERENCES affiliate_relationships(id) ON DELETE CASCADE,
  affiliate_user_id uuid       NOT NULL,
  product_id       uuid        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  seller_id        uuid        NOT NULL,
  referral_code    text        NOT NULL,
  landing_url      text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;

-- Affiliate can see clicks on their relationships
CREATE POLICY IF NOT EXISTS "affiliates see own clicks"
  ON affiliate_clicks FOR SELECT
  USING (affiliate_user_id = auth.uid());

-- Seller can see clicks on their products
CREATE POLICY IF NOT EXISTS "sellers see product clicks"
  ON affiliate_clicks FOR SELECT
  USING (seller_id = auth.uid());

-- Service role inserts clicks (via API route using admin client)
-- No anon INSERT policy — click recording is server-side only

-- ── 4. Affiliate commissions ─────────────────────────────────
CREATE TABLE IF NOT EXISTS affiliate_commissions (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id      uuid        NOT NULL REFERENCES affiliate_relationships(id) ON DELETE RESTRICT,
  affiliate_user_id    uuid        NOT NULL,
  seller_id            uuid        NOT NULL,
  product_id           uuid        NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  order_id             uuid        NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  gross_sale_cents     integer     NOT NULL,
  commission_percent   integer     NOT NULL,  -- snapshot at time of sale
  commission_cents     integer     NOT NULL,
  currency             text        NOT NULL DEFAULT 'usd',
  status               text        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'available', 'paid', 'reversed')),
  available_at         timestamptz,            -- when hold period expires
  paid_at              timestamptz,
  reversed_at          timestamptz,
  reversal_reason      text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id)   -- one commission per order max
);

ALTER TABLE affiliate_commissions ENABLE ROW LEVEL SECURITY;

-- Affiliate can see own commissions
CREATE POLICY IF NOT EXISTS "affiliates see own commissions"
  ON affiliate_commissions FOR SELECT
  USING (affiliate_user_id = auth.uid());

-- Seller can see commissions for their products
CREATE POLICY IF NOT EXISTS "sellers see product commissions"
  ON affiliate_commissions FOR SELECT
  USING (seller_id = auth.uid());

-- ── 5. Attribution cookies / sessions (server-managed) ───────
-- We store attribution server-side via a lightweight table.
-- Client never directly reads/writes this table.
CREATE TABLE IF NOT EXISTS affiliate_attribution (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token   text        NOT NULL UNIQUE,  -- opaque token stored in cookie
  referral_code   text        NOT NULL,
  relationship_id uuid        NOT NULL REFERENCES affiliate_relationships(id) ON DELETE CASCADE,
  product_id      uuid        NOT NULL,
  expires_at      timestamptz NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE affiliate_attribution ENABLE ROW LEVEL SECURITY;
-- No public access — admin client only

-- ── 6. Orders: add affiliate attribution fields ──────────────
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS affiliate_relationship_id uuid REFERENCES affiliate_relationships(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS affiliate_commission_id   uuid;  -- set after commission is created

-- ── 7. Purchases: add affiliate relationship link ─────────────
ALTER TABLE purchases
  ADD COLUMN IF NOT EXISTS affiliate_relationship_id uuid REFERENCES affiliate_relationships(id) ON DELETE SET NULL;

-- ── 8. Index for performance ─────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_affiliate_relationships_product   ON affiliate_relationships(product_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_relationships_affiliate ON affiliate_relationships(affiliate_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_relationships_seller    ON affiliate_relationships(seller_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_relationships_code      ON affiliate_relationships(referral_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_relationship     ON affiliate_clicks(relationship_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_product          ON affiliate_clicks(product_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate   ON affiliate_commissions(affiliate_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_order       ON affiliate_commissions(order_id);
CREATE INDEX IF NOT EXISTS idx_products_marketplace              ON products(marketplace_listing, is_live);
CREATE INDEX IF NOT EXISTS idx_products_category                 ON products(category);
CREATE INDEX IF NOT EXISTS idx_affiliate_attribution_code        ON affiliate_attribution(referral_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_attribution_session     ON affiliate_attribution(session_token);
