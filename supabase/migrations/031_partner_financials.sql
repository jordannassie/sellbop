-- 031_partner_financials.sql
-- Partnership revenue share, financial snapshots, ledger, transfers, webhook idempotency
-- REQUIRES: 030_partner_shops.sql

-- Immutable financial terms versions per partnership
CREATE TABLE IF NOT EXISTS public.partnership_financial_terms (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  partnership_id      uuid        NOT NULL REFERENCES public.store_partnerships(id) ON DELETE CASCADE,
  version             integer     NOT NULL,
  partner_share_bps     integer     NOT NULL CHECK (partner_share_bps >= 0 AND partner_share_bps <= 10000),
  financial_model       text        NOT NULL DEFAULT 'net_split_v1',
  split_basis           text        NOT NULL DEFAULT 'after_affiliate_and_processing',
  created_by_user_id  uuid        NOT NULL REFERENCES auth.users(id),
  created_at          timestamptz NOT NULL DEFAULT now(),
  effective_at        timestamptz NOT NULL DEFAULT now(),
  accepted_by_user_id uuid        NULL REFERENCES auth.users(id),
  accepted_at         timestamptz NULL,
  superseded_at       timestamptz NULL,
  UNIQUE (partnership_id, version)
);

CREATE INDEX IF NOT EXISTS partnership_financial_terms_partnership_idx
  ON public.partnership_financial_terms(partnership_id);

ALTER TABLE public.store_partnerships
  ADD COLUMN IF NOT EXISTS current_financial_terms_id uuid
    NULL REFERENCES public.partnership_financial_terms(id);

-- Per-order immutable financial snapshot
CREATE TABLE IF NOT EXISTS public.order_financials (
  id                          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id                    uuid        NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  store_id                    uuid        NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  partnership_id              uuid        NOT NULL REFERENCES public.store_partnerships(id) ON DELETE CASCADE,
  financial_terms_id          uuid        NOT NULL REFERENCES public.partnership_financial_terms(id),
  financial_model             text        NOT NULL,
  currency                    text        NOT NULL DEFAULT 'usd',
  sale_subtotal_cents         integer     NOT NULL,
  tax_cents                   integer     NOT NULL DEFAULT 0,
  discount_cents              integer     NOT NULL DEFAULT 0,
  stripe_fee_cents            integer     NULL,
  affiliate_commission_cents  integer     NOT NULL DEFAULT 0,
  net_distributable_cents     integer     NOT NULL,
  partner_share_bps           integer     NOT NULL,
  partner_share_cents         integer     NOT NULL,
  sellbop_share_cents         integer     NOT NULL,
  transfer_group              text        NOT NULL,
  stripe_checkout_session_id  text        NULL,
  stripe_payment_intent_id    text        NULL,
  stripe_charge_id            text        NULL,
  stripe_balance_transaction_id text      NULL,
  settlement_status           text        NOT NULL DEFAULT 'pending'
                              CHECK (settlement_status IN (
                                'pending', 'awaiting_processing_fee', 'ready',
                                'transfer_pending', 'transferred', 'failed',
                                'reconciliation_required', 'refunded', 'partially_refunded'
                              )),
  reconciliation_status       text        NOT NULL DEFAULT 'pending'
                              CHECK (reconciliation_status IN (
                                'pending', 'balanced', 'reconciliation_required'
                              )),
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_financials_store_idx ON public.order_financials(store_id);
CREATE INDEX IF NOT EXISTS order_financials_partnership_idx ON public.order_financials(partnership_id);
CREATE INDEX IF NOT EXISTS order_financials_settlement_status_idx ON public.order_financials(settlement_status);

-- Append-only financial ledger
CREATE TABLE IF NOT EXISTS public.financial_ledger_entries (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            uuid        NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_financial_id  uuid        NULL REFERENCES public.order_financials(id) ON DELETE SET NULL,
  store_id            uuid        NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  partnership_id      uuid        NULL REFERENCES public.store_partnerships(id) ON DELETE SET NULL,
  party_type          text        NOT NULL CHECK (party_type IN ('partner', 'sellbop', 'affiliate', 'stripe')),
  party_user_id       uuid        NULL REFERENCES auth.users(id),
  entry_type          text        NOT NULL,
  amount_cents        integer     NOT NULL,
  currency            text        NOT NULL DEFAULT 'usd',
  status              text        NOT NULL DEFAULT 'recorded',
  stripe_object_id    text        NULL,
  reference           text        NULL,
  metadata            jsonb       NULL,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS financial_ledger_entries_order_idx ON public.financial_ledger_entries(order_id);
CREATE INDEX IF NOT EXISTS financial_ledger_entries_store_idx ON public.financial_ledger_entries(store_id);
CREATE INDEX IF NOT EXISTS financial_ledger_entries_partnership_idx ON public.financial_ledger_entries(partnership_id);

-- Partner Stripe transfer records
CREATE TABLE IF NOT EXISTS public.partner_transfers (
  id                          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_financial_id          uuid        NOT NULL UNIQUE REFERENCES public.order_financials(id) ON DELETE CASCADE,
  partnership_id              uuid        NOT NULL REFERENCES public.store_partnerships(id) ON DELETE CASCADE,
  store_id                    uuid        NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  partner_user_id             uuid        NOT NULL REFERENCES auth.users(id),
  amount_cents                integer     NOT NULL CHECK (amount_cents >= 0),
  currency                    text        NOT NULL DEFAULT 'usd',
  status                      text        NOT NULL DEFAULT 'pending'
                              CHECK (status IN (
                                'pending', 'ready', 'transfer_pending', 'transferred',
                                'reversal_pending', 'partially_reversed', 'reversed',
                                'failed', 'reconciliation_required'
                              )),
  stripe_transfer_id          text        NULL,
  stripe_transfer_reversal_id text        NULL,
  idempotency_key             text        NOT NULL UNIQUE,
  failure_code                text        NULL,
  failure_message             text        NULL,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS partner_transfers_partnership_idx ON public.partner_transfers(partnership_id);
CREATE INDEX IF NOT EXISTS partner_transfers_status_idx ON public.partner_transfers(status);

-- Stripe webhook idempotency
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id text        NOT NULL UNIQUE,
  event_type      text        NOT NULL,
  status          text        NOT NULL DEFAULT 'processing'
                  CHECK (status IN ('processing', 'processed', 'failed')),
  attempt_count   integer     NOT NULL DEFAULT 1,
  processed_at    timestamptz NULL,
  last_error      text        NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- RLS: service role only for financial tables
ALTER TABLE public.partnership_financial_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Partners read accepted terms" ON public.partnership_financial_terms;
CREATE POLICY "Partners read accepted terms"
  ON public.partnership_financial_terms FOR SELECT
  USING (
    accepted_at IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.store_partnerships sp
      WHERE sp.id = partnership_id AND sp.partner_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role manage partnership financial terms" ON public.partnership_financial_terms;
CREATE POLICY "Service role manage partnership financial terms"
  ON public.partnership_financial_terms FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Service role manage order financials" ON public.order_financials;
CREATE POLICY "Service role manage order financials"
  ON public.order_financials FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Service role manage financial ledger" ON public.financial_ledger_entries;
CREATE POLICY "Service role manage financial ledger"
  ON public.financial_ledger_entries FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Service role manage partner transfers" ON public.partner_transfers;
CREATE POLICY "Service role manage partner transfers"
  ON public.partner_transfers FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Service role manage stripe webhook events" ON public.stripe_webhook_events;
CREATE POLICY "Service role manage stripe webhook events"
  ON public.stripe_webhook_events FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

NOTIFY pgrst, 'reload schema';
