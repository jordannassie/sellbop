-- 027_partner_applications.sql
-- SellBop Partner inquiry / application submissions

CREATE TABLE IF NOT EXISTS public.partner_applications (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  name          text        NOT NULL,
  email         text        NOT NULL,
  phone         text,
  social_links  text        NOT NULL DEFAULT '',
  audience_size text        NOT NULL,
  message       text        NOT NULL DEFAULT '',
  status        text        NOT NULL DEFAULT 'new'
                CHECK (status IN ('new', 'contacted', 'reviewing', 'approved', 'declined')),
  admin_notes   text        NOT NULL DEFAULT '',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partner_applications_status
  ON public.partner_applications(status);

CREATE INDEX IF NOT EXISTS idx_partner_applications_created_at
  ON public.partner_applications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_partner_applications_audience_size
  ON public.partner_applications(audience_size);

ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert partner applications" ON public.partner_applications;
CREATE POLICY "Anyone can insert partner applications"
  ON public.partner_applications FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manage partner applications" ON public.partner_applications;
CREATE POLICY "Service role manage partner applications"
  ON public.partner_applications FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

NOTIFY pgrst, 'reload schema';
