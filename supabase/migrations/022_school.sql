-- SellBop School: curated YouTube lessons + saved list

CREATE TABLE IF NOT EXISTS school_lessons (
  id                    text PRIMARY KEY,
  title                 text NOT NULL,
  original_video_title  text NOT NULL,
  creator               text NOT NULL,
  youtube_url           text NOT NULL,
  youtube_video_id      text NOT NULL,
  thumbnail_url         text,
  duration              text,
  categories            text[] NOT NULL DEFAULT '{}',
  description           text NOT NULL DEFAULT '',
  why_recommend         text NOT NULL DEFAULT '',
  featured              boolean NOT NULL DEFAULT false,
  sort_order            int NOT NULL DEFAULT 0,
  published             boolean NOT NULL DEFAULT true,
  section_id            text NOT NULL DEFAULT 'start-here',
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS school_lessons_sort_idx ON school_lessons (sort_order);
CREATE INDEX IF NOT EXISTS school_lessons_published_idx ON school_lessons (published);

CREATE TABLE IF NOT EXISTS school_saved_lessons (
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id   text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS school_saved_lessons_user_idx ON school_saved_lessons (user_id, created_at DESC);

ALTER TABLE school_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_saved_lessons ENABLE ROW LEVEL SECURITY;

-- Public read for published lessons (anon + authenticated)
CREATE POLICY school_lessons_public_read ON school_lessons
  FOR SELECT TO anon, authenticated
  USING (published = true);

-- Users manage their own saved lessons
CREATE POLICY school_saved_lessons_own ON school_saved_lessons
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
