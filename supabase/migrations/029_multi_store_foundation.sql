-- 029_multi_store_foundation.sql
-- Multi-shop foundation: store_members table + backfill existing owners

CREATE TABLE IF NOT EXISTS public.store_members (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id   uuid        NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text        NOT NULL CHECK (role IN ('owner', 'admin', 'manager')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, user_id)
);

CREATE INDEX IF NOT EXISTS store_members_user_id_idx ON public.store_members(user_id);
CREATE INDEX IF NOT EXISTS store_members_store_id_idx ON public.store_members(store_id);

ALTER TABLE public.store_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own store memberships" ON public.store_members;
CREATE POLICY "Users read own store memberships"
  ON public.store_members FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role manage store members" ON public.store_members;
CREATE POLICY "Service role manage store members"
  ON public.store_members FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Backfill: every existing store owner becomes an owner member
INSERT INTO public.store_members (store_id, user_id, role)
SELECT id, owner_user_id, 'owner'
FROM public.stores
WHERE owner_user_id IS NOT NULL
ON CONFLICT (store_id, user_id) DO NOTHING;

NOTIFY pgrst, 'reload schema';
