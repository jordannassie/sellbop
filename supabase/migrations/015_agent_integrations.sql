-- ============================================================
-- 015 — AI Agent Integrations
-- ============================================================
-- Adds scoped API-token connections for external AI agents
-- (Claude, Higgsfield, ChatGPT, custom) plus an activity log
-- of everything an agent changes, and closes a pre-existing
-- gap by enabling RLS on `products` (previously unprotected
-- at the database layer — every existing route already
-- enforces ownership in application code via the service-role
-- client, so this is a pure defense-in-depth addition with no
-- behavior change for the current app).
--
-- Run this in the Supabase SQL Editor for production, in order
-- after 012_social_links.sql. Idempotent — safe to re-run.
-- ============================================================

-- ── 1. Agent connections ──────────────────────────────────────
-- One row per "user connected an AI tool". The token itself is
-- never stored — only its SHA-256 hash. `token_prefix` is kept
-- only for display purposes (e.g. "sk_agent_live_ab12…").
CREATE TABLE IF NOT EXISTS agent_connections (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL,
  store_id      uuid        REFERENCES stores(id) ON DELETE CASCADE,
  provider      text        NOT NULL DEFAULT 'custom'
    CHECK (provider IN ('claude', 'higgsfield', 'chatgpt', 'custom')),
  name          text        NOT NULL,
  token_hash    text        NOT NULL UNIQUE,
  token_prefix  text        NOT NULL,
  scopes        text[]      NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now(),
  last_used_at  timestamptz,
  revoked_at    timestamptz
);

CREATE INDEX IF NOT EXISTS idx_agent_connections_token_hash ON agent_connections(token_hash);
CREATE INDEX IF NOT EXISTS idx_agent_connections_user_id ON agent_connections(user_id);

ALTER TABLE agent_connections ENABLE ROW LEVEL SECURITY;

-- Sellers manage their own connections (used by the Settings → AI & Integrations page).
CREATE POLICY IF NOT EXISTS "agent_connections_owner_all"
  ON agent_connections
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── 2. Agent activity log ─────────────────────────────────────
-- Written on every agent-initiated action (success or failure),
-- from the service-role client only — there is intentionally no
-- INSERT policy for regular users, so RLS default-denies direct
-- inserts and only server code (which bypasses RLS) can write.
CREATE TABLE IF NOT EXISTS agent_activity_log (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id  uuid        REFERENCES agent_connections(id) ON DELETE SET NULL,
  user_id        uuid        NOT NULL,
  action         text        NOT NULL,
  target_type    text,
  target_id      text,
  before         jsonb,
  after          jsonb,
  status         text        NOT NULL DEFAULT 'ok' CHECK (status IN ('ok', 'error')),
  error_message  text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_activity_log_user_id ON agent_activity_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_activity_log_connection_id ON agent_activity_log(connection_id, created_at DESC);

ALTER TABLE agent_activity_log ENABLE ROW LEVEL SECURITY;

-- Sellers can read their own activity log (no insert/update/delete policy for users).
CREATE POLICY IF NOT EXISTS "agent_activity_log_owner_select"
  ON agent_activity_log FOR SELECT
  USING (user_id = auth.uid());

-- ── 3. Close the RLS gap on `products` ────────────────────────
-- Previously products had no RLS at all. All existing reads/
-- writes go through the service-role client (which bypasses
-- RLS), so this changes nothing for the current app — it only
-- adds a real database-level backstop for any future direct
-- (non-service-role) access path.
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "products_public_read_live"
  ON products FOR SELECT
  USING (is_live = true);

CREATE POLICY IF NOT EXISTS "products_owner_all"
  ON products
  USING (EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = products.store_id
      AND stores.owner_user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = products.store_id
      AND stores.owner_user_id = auth.uid()
  ));
