-- Migration 012: Add social_links JSONB column to stores
-- Idempotent — safe to run multiple times

ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}'::jsonb;

-- Backfill existing rows with empty object where null
UPDATE stores
  SET social_links = '{}'::jsonb
  WHERE social_links IS NULL;
