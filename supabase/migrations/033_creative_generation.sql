-- 033_creative_generation.sql
-- Claude E-Com V1.1 Creative Factory: usage tracking

CREATE TABLE IF NOT EXISTS public.creative_generation_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id uuid NULL REFERENCES public.agent_connections(id) ON DELETE SET NULL,
  store_id uuid NULL REFERENCES public.stores(id) ON DELETE SET NULL,
  product_id uuid NULL REFERENCES public.products(id) ON DELETE SET NULL,
  generation_type text NOT NULL,
  provider text NULL,
  model text NULL,
  status text NOT NULL CHECK (status IN ('ok', 'error')),
  error_code text NULL,
  metadata jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS creative_generation_usage_user_created_idx
  ON public.creative_generation_usage(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS creative_generation_usage_store_idx
  ON public.creative_generation_usage(store_id);

ALTER TABLE public.creative_generation_usage ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
