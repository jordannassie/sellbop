-- Clear accidental partial School seed (restores full catalog from app defaults)
-- Run in Supabase SQL Editor if School only shows one lesson.

DELETE FROM school_lessons;

-- Optional: remove tables entirely — app will use code defaults when table is missing/empty
-- DROP TABLE IF EXISTS school_saved_lessons;
-- DROP TABLE IF EXISTS school_lessons;
