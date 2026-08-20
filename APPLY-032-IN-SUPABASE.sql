-- =============================================================================
-- APPLY MIGRATION 032 — SellBop Production
-- =============================================================================
--
-- Supabase project: qsvmgzdaashfsavmfjuz
-- Dashboard: https://supabase.com/dashboard/project/qsvmgzdaashfsavmfjuz
--
-- WHAT THIS ADDS:
--   • agent_connections.access_mode  — lets Claude connect to one shop or all shops
--   • agent_activity_log.store_id    — tracks which shop Claude changed
--
-- HOW TO RUN:
--   1. Open Supabase SQL Editor (link above → SQL → New query)
--   2. Select ALL text in this file (Command+A), copy, paste into the editor
--   3. Click RUN
--
-- SAFE TO RE-RUN: Yes — uses IF NOT EXISTS / idempotent statements
-- DESTRUCTIVE: No — only adds columns and an index
--
-- =============================================================================

-- 032_agent_shop_access.sql
-- Claude E-Com V1: multi-shop agent access mode + activity log shop tracking

ALTER TABLE public.agent_connections
  ADD COLUMN IF NOT EXISTS access_mode text NOT NULL DEFAULT 'single_shop'
    CHECK (access_mode IN ('single_shop', 'all_managed_shops'));

-- Existing connections with null store_id behave as all_managed_shops
UPDATE public.agent_connections
SET access_mode = 'all_managed_shops'
WHERE store_id IS NULL AND access_mode = 'single_shop';

ALTER TABLE public.agent_activity_log
  ADD COLUMN IF NOT EXISTS store_id uuid NULL REFERENCES public.stores(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS agent_activity_log_store_idx
  ON public.agent_activity_log(store_id);

NOTIFY pgrst, 'reload schema';
