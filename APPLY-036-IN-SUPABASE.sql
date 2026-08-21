-- Apply in Supabase SQL Editor (migration 036)
-- Saved product research ideas for Product Ideas dashboard.

CREATE TABLE IF NOT EXISTS public.product_ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id uuid NULL REFERENCES public.stores(id) ON DELETE SET NULL,
  title text NOT NULL,
  hook text,
  description text,
  target_audience text,
  category text,
  product_type text,
  suggested_price_min_cents integer,
  suggested_price_max_cents integer,
  primary_keyword text,
  supporting_keywords jsonb NOT NULL DEFAULT '[]'::jsonb,
  estimated_monthly_searches integer,
  cpc numeric,
  search_competition numeric,
  trend text,
  trend_percent numeric,
  opportunity_score integer,
  source text NOT NULL DEFAULT 'ai_estimate',
  why_it_could_sell text,
  product_contents jsonb NOT NULL DEFAULT '[]'::jsonb,
  source_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_ideas_user_created_idx
  ON public.product_ideas(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS product_ideas_store_idx
  ON public.product_ideas(store_id);

ALTER TABLE public.product_ideas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS product_ideas_own_rows ON public.product_ideas;
CREATE POLICY product_ideas_own_rows ON public.product_ideas
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

NOTIFY pgrst, 'reload schema';
