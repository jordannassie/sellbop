-- Resources Center + seller onboarding progress

CREATE TABLE IF NOT EXISTS resource_pages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text UNIQUE NOT NULL,
  title         text NOT NULL,
  subtitle      text,
  category      text,
  icon          text,
  image_url     text,
  content_json  jsonb NOT NULL DEFAULT '{"blocks":[]}'::jsonb,
  sort_order    int NOT NULL DEFAULT 0,
  is_published  boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS resource_cards (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug     text NOT NULL DEFAULT 'home',
  title         text NOT NULL,
  subtitle      text,
  description   text,
  icon          text,
  image_url     text,
  cta_text      text,
  cta_url       text,
  sort_order    int NOT NULL DEFAULT 0,
  is_published  boolean NOT NULL DEFAULT true,
  metadata      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS resource_cards_page_slug_idx ON resource_cards (page_slug, sort_order);
CREATE INDEX IF NOT EXISTS resource_pages_slug_idx ON resource_pages (slug);

CREATE TABLE IF NOT EXISTS seller_onboarding (
  user_id       uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  dismissed     boolean NOT NULL DEFAULT false,
  manual_steps  jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE resource_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_onboarding ENABLE ROW LEVEL SECURITY;

-- Published resources readable by authenticated users
CREATE POLICY resource_pages_read ON resource_pages
  FOR SELECT TO authenticated
  USING (is_published = true);

CREATE POLICY resource_cards_read ON resource_cards
  FOR SELECT TO authenticated
  USING (is_published = true);

CREATE POLICY seller_onboarding_own ON seller_onboarding
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
