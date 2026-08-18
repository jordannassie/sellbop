-- 024_purchase_delivery_and_email.sql
-- Purchase access tokens, transactional email delivery log, refund tracking

-- ── Purchase access tokens ───────────────────────────────────────────────────
ALTER TABLE purchases
  ADD COLUMN IF NOT EXISTS access_token uuid;

UPDATE purchases
SET access_token = gen_random_uuid()
WHERE access_token IS NULL;

ALTER TABLE purchases
  ALTER COLUMN access_token SET DEFAULT gen_random_uuid();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'purchases_access_token_not_null'
  ) THEN
    ALTER TABLE purchases ALTER COLUMN access_token SET NOT NULL;
  END IF;
EXCEPTION WHEN others THEN
  NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS purchases_access_token_uidx
  ON purchases (access_token);

-- ── Order refund tracking + Stripe session idempotency ───────────────────────
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS refunded_cents integer NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS orders_stripe_session_id_uidx
  ON orders (stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;

-- ── Transactional email deliveries ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactional_email_deliveries (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key           text NOT NULL UNIQUE,
  email_type          text NOT NULL,
  recipient           text NOT NULL,
  order_id            uuid REFERENCES orders(id) ON DELETE SET NULL,
  purchase_id         uuid REFERENCES purchases(id) ON DELETE SET NULL,
  seller_user_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  provider            text NOT NULL DEFAULT 'resend',
  provider_message_id text,
  status              text NOT NULL DEFAULT 'pending',
  attempts            integer NOT NULL DEFAULT 0,
  last_error          text,
  sent_at             timestamptz,
  delivered_at        timestamptz,
  metadata            jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS transactional_email_deliveries_order_id_idx
  ON transactional_email_deliveries (order_id);

CREATE INDEX IF NOT EXISTS transactional_email_deliveries_purchase_id_idx
  ON transactional_email_deliveries (purchase_id);

CREATE INDEX IF NOT EXISTS transactional_email_deliveries_recipient_idx
  ON transactional_email_deliveries (lower(recipient));

CREATE INDEX IF NOT EXISTS transactional_email_deliveries_status_idx
  ON transactional_email_deliveries (status);

CREATE INDEX IF NOT EXISTS transactional_email_deliveries_provider_message_id_idx
  ON transactional_email_deliveries (provider_message_id)
  WHERE provider_message_id IS NOT NULL;

ALTER TABLE transactional_email_deliveries ENABLE ROW LEVEL SECURITY;

-- Internal/service use only — no client policies
