-- 102_circle_content_feed.sql
-- G5.6 — Cultural Content Feed
-- Adds circle_content_items: curated articles, videos, recipes, spotlights
-- posted by navigators/staff into circle feeds.

CREATE TABLE IF NOT EXISTS circle_content_items (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      timestamptz DEFAULT now() NOT NULL,
  updated_at      timestamptz DEFAULT now() NOT NULL,
  circle_id       uuid NOT NULL REFERENCES cultural_circles(id) ON DELETE CASCADE,
  posted_by       uuid REFERENCES family_members(id) ON DELETE SET NULL,
  content_type    text NOT NULL DEFAULT 'article'
                    CHECK (content_type IN ('article','video','recipe','spotlight','announcement','event_recap')),
  title           text NOT NULL,
  body            text,
  url             text,
  image_url       text,
  source_name     text,
  tags            text[] NOT NULL DEFAULT '{}',
  is_pinned       boolean NOT NULL DEFAULT false,
  is_published    boolean NOT NULL DEFAULT true,
  published_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS circle_content_circle_idx ON circle_content_items(circle_id, published_at DESC);
CREATE INDEX IF NOT EXISTS circle_content_pinned_idx ON circle_content_items(circle_id, is_pinned) WHERE is_pinned = true;

ALTER TABLE circle_content_items ENABLE ROW LEVEL SECURITY;

-- Members can read published content for circles they belong to
-- Uses circle_memberships join through cultural_circles to avoid direct table ref issues
DROP POLICY IF EXISTS "members read circle content" ON circle_content_items;
CREATE POLICY "members read circle content"
  ON circle_content_items FOR SELECT
  USING (
    is_published AND (
      EXISTS (
        SELECT 1 FROM circle_memberships cm
        WHERE cm.circle_id = circle_content_items.circle_id
          AND cm.member_id = ANY(acting_member_ids())
      )
      OR EXISTS (
        SELECT 1 FROM cultural_circles cc
        WHERE cc.id = circle_content_items.circle_id
          AND cc.membership_visibility = 'open'
      )
    )
  );

-- Staff manage all content
DROP POLICY IF EXISTS "staff manages circle content" ON circle_content_items;
CREATE POLICY "staff manages circle content"
  ON circle_content_items FOR ALL
  USING (is_staff());

-- updated_at trigger
CREATE OR REPLACE FUNCTION touch_circle_content()
  RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS circle_content_updated ON circle_content_items;
CREATE TRIGGER circle_content_updated
  BEFORE UPDATE ON circle_content_items
  FOR EACH ROW EXECUTE FUNCTION touch_circle_content();
