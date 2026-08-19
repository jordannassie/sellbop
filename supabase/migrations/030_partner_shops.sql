-- 030_partner_shops.sql
-- Admin Partnership Shops: preview, invite, claim workflow
-- REQUIRES: 029_multi_store_foundation.sql (store_members)

CREATE TABLE IF NOT EXISTS public.store_partnerships (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id            uuid        NOT NULL UNIQUE REFERENCES public.stores(id) ON DELETE CASCADE,
  created_by_user_id  uuid        NOT NULL REFERENCES auth.users(id),
  partner_user_id     uuid        NULL REFERENCES auth.users(id),
  partner_name        text        NULL,
  partner_email       text        NULL,
  status              text        NOT NULL DEFAULT 'draft'
                      CHECK (status IN (
                        'draft', 'preview', 'invited', 'claimed', 'active',
                        'paused', 'declined', 'archived'
                      )),
  internal_notes      text        NULL,
  claimed_at          timestamptz NULL,
  activated_at        timestamptz NULL,
  paused_at           timestamptz NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS store_partnerships_status_idx ON public.store_partnerships(status);
CREATE INDEX IF NOT EXISTS store_partnerships_partner_user_id_idx ON public.store_partnerships(partner_user_id);
CREATE INDEX IF NOT EXISTS store_partnerships_created_by_idx ON public.store_partnerships(created_by_user_id);

CREATE TABLE IF NOT EXISTS public.partner_shop_invites (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  partnership_id      uuid        NOT NULL REFERENCES public.store_partnerships(id) ON DELETE CASCADE,
  email               text        NOT NULL,
  token_hash          text        NOT NULL UNIQUE,
  expires_at          timestamptz NOT NULL,
  accepted_at         timestamptz NULL,
  revoked_at          timestamptz NULL,
  created_by_user_id  uuid        NOT NULL REFERENCES auth.users(id),
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS partner_shop_invites_partnership_idx ON public.partner_shop_invites(partnership_id);

CREATE TABLE IF NOT EXISTS public.partner_shop_preview_tokens (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  partnership_id      uuid        NOT NULL REFERENCES public.store_partnerships(id) ON DELETE CASCADE,
  token_hash          text        NOT NULL UNIQUE,
  expires_at          timestamptz NULL,
  revoked_at          timestamptz NULL,
  created_by_user_id  uuid        NOT NULL REFERENCES auth.users(id),
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS partner_shop_preview_tokens_partnership_idx ON public.partner_shop_preview_tokens(partnership_id);

ALTER TABLE public.store_partnerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_shop_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_shop_preview_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Partners read own partnership" ON public.store_partnerships;
CREATE POLICY "Partners read own partnership"
  ON public.store_partnerships FOR SELECT
  USING (partner_user_id = auth.uid());

DROP POLICY IF EXISTS "Service role manage store partnerships" ON public.store_partnerships;
CREATE POLICY "Service role manage store partnerships"
  ON public.store_partnerships FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Service role manage partner invites" ON public.partner_shop_invites;
CREATE POLICY "Service role manage partner invites"
  ON public.partner_shop_invites FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Service role manage preview tokens" ON public.partner_shop_preview_tokens;
CREATE POLICY "Service role manage preview tokens"
  ON public.partner_shop_preview_tokens FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Atomic Partner Shop creation
CREATE OR REPLACE FUNCTION public.create_partner_shop(
  p_admin_user_id uuid,
  p_shop_name text,
  p_shop_slug text,
  p_partner_name text DEFAULT NULL,
  p_partner_email text DEFAULT NULL,
  p_banner_url text DEFAULT NULL,
  p_avatar_url text DEFAULT NULL
)
RETURNS TABLE (out_store_id uuid, out_partnership_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store_id uuid;
  v_partnership_id uuid;
BEGIN
  INSERT INTO stores (owner_user_id, slug, name, banner_url, avatar_url, support_email)
  VALUES (
    p_admin_user_id,
    p_shop_slug,
    p_shop_name,
    COALESCE(p_banner_url, 'https://qsvmgzdaashfsavmfjuz.supabase.co/storage/v1/object/public/SELL/banners/default-banner.jpg'),
    p_avatar_url,
    p_partner_email
  )
  RETURNING id INTO v_store_id;

  INSERT INTO store_members (store_id, user_id, role)
  VALUES (v_store_id, p_admin_user_id, 'owner')
  ON CONFLICT (store_id, user_id) DO UPDATE SET role = 'owner', updated_at = now();

  INSERT INTO store_partnerships (
    store_id, created_by_user_id, partner_name, partner_email, status
  )
  VALUES (
    v_store_id, p_admin_user_id, NULLIF(trim(p_partner_name), ''), NULLIF(lower(trim(p_partner_email)), ''), 'draft'
  )
  RETURNING id INTO v_partnership_id;

  RETURN QUERY SELECT v_store_id, v_partnership_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_partner_shop(uuid, text, text, text, text, text, text) FROM PUBLIC;

-- Atomic Partner Shop claim
CREATE OR REPLACE FUNCTION public.claim_partner_shop(
  p_token_hash text,
  p_user_id uuid,
  p_user_email text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite partner_shop_invites%ROWTYPE;
  v_partnership store_partnerships%ROWTYPE;
  v_admin_user_id uuid;
  v_store_id uuid;
  v_email text;
BEGIN
  v_email := lower(trim(p_user_email));

  SELECT * INTO v_invite
  FROM partner_shop_invites
  WHERE token_hash = p_token_hash
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invalid invitation.');
  END IF;

  IF v_invite.revoked_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'This invitation has been revoked.');
  END IF;

  IF v_invite.accepted_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'This invitation has already been used.');
  END IF;

  IF v_invite.expires_at < now() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'This invitation has expired.');
  END IF;

  IF lower(trim(v_invite.email)) <> v_email THEN
    RETURN jsonb_build_object('ok', false, 'error', 'This invitation was sent to a different email address.');
  END IF;

  SELECT * INTO v_partnership
  FROM store_partnerships
  WHERE id = v_invite.partnership_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Partnership not found.');
  END IF;

  IF v_partnership.partner_user_id IS NOT NULL OR v_partnership.status IN ('claimed', 'active') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'This Shop has already been claimed.');
  END IF;

  v_store_id := v_partnership.store_id;
  v_admin_user_id := v_partnership.created_by_user_id;

  UPDATE stores
  SET owner_user_id = p_user_id, updated_at = now()
  WHERE id = v_store_id;

  INSERT INTO store_members (store_id, user_id, role)
  VALUES (v_store_id, p_user_id, 'owner')
  ON CONFLICT (store_id, user_id) DO UPDATE SET role = 'owner', updated_at = now();

  IF v_admin_user_id IS NOT NULL AND v_admin_user_id <> p_user_id THEN
    INSERT INTO store_members (store_id, user_id, role)
    VALUES (v_store_id, v_admin_user_id, 'admin')
    ON CONFLICT (store_id, user_id) DO UPDATE SET role = 'admin', updated_at = now();
  END IF;

  UPDATE store_partnerships
  SET
    partner_user_id = p_user_id,
    status = 'claimed',
    claimed_at = now(),
    partner_email = v_invite.email,
    updated_at = now()
  WHERE id = v_partnership.id;

  UPDATE partner_shop_invites
  SET accepted_at = now()
  WHERE id = v_invite.id;

  RETURN jsonb_build_object(
    'ok', true,
    'store_id', v_store_id,
    'partnership_id', v_partnership.id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.claim_partner_shop(text, uuid, text) FROM PUBLIC;

NOTIFY pgrst, 'reload schema';
