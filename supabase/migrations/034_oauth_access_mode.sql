-- Persist Claude E-Com access mode on OAuth authorization codes so token
-- exchange (server-side, no browser cookies) receives the user's choice.

ALTER TABLE public.oauth_authorization_codes
  ADD COLUMN IF NOT EXISTS access_mode text NOT NULL DEFAULT 'single_shop'
    CHECK (access_mode IN ('single_shop', 'all_managed_shops'));

ALTER TABLE public.oauth_authorization_codes
  ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL;
