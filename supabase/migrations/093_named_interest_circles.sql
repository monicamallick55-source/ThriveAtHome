-- Migration 093: G5.6 Named interest circles

ALTER TABLE cultural_circles ADD COLUMN IF NOT EXISTS membership_visibility text NOT NULL DEFAULT 'public'
  CHECK (membership_visibility IN ('public','members_only','hidden'));

CREATE TABLE IF NOT EXISTS circle_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id uuid NOT NULL REFERENCES cultural_circles(id) ON DELETE CASCADE,
  content_type text NOT NULL CHECK (content_type IN ('article','video','event_recap','resource','announcement')),
  title text NOT NULL,
  body text,
  url text,
  author_id uuid REFERENCES members(id),
  published_at timestamptz DEFAULT now(),
  is_pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE circle_content ENABLE ROW LEVEL SECURITY;
