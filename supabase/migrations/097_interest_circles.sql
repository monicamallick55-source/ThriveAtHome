-- Migration 097: Interest Circles (G5.6)

CREATE TABLE IF NOT EXISTS interest_circles (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   timestamptz DEFAULT now() NOT NULL,
  name         text NOT NULL,
  slug         text NOT NULL UNIQUE,
  description  text,
  category     text NOT NULL DEFAULT 'general', -- 'hobbies'|'health'|'faith'|'culture'|'general'
  is_active    boolean NOT NULL DEFAULT true,
  member_count int NOT NULL DEFAULT 0,
  cover_emoji  text NOT NULL DEFAULT '💬'
);

CREATE TABLE IF NOT EXISTS circle_memberships (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  circle_id  uuid NOT NULL REFERENCES interest_circles(id) ON DELETE CASCADE,
  member_id  uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  joined_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(circle_id, member_id)
);
CREATE INDEX IF NOT EXISTS idx_circle_memberships_member ON circle_memberships (member_id);
CREATE INDEX IF NOT EXISTS idx_circle_memberships_circle ON circle_memberships (circle_id);

CREATE TABLE IF NOT EXISTS circle_posts (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  circle_id  uuid NOT NULL REFERENCES interest_circles(id) ON DELETE CASCADE,
  author_id  uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  body       text NOT NULL CHECK (char_length(body) <= 1000),
  is_pinned  boolean NOT NULL DEFAULT false,
  reply_to   uuid REFERENCES circle_posts(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_circle_posts_circle ON circle_posts (circle_id, created_at DESC);

-- Trigger: keep member_count current
CREATE OR REPLACE FUNCTION update_circle_member_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE interest_circles SET member_count = member_count + 1 WHERE id = NEW.circle_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE interest_circles SET member_count = GREATEST(member_count - 1, 0) WHERE id = OLD.circle_id;
  END IF;
  RETURN NULL;
END;
$$;
DROP TRIGGER IF EXISTS trg_circle_member_count ON circle_memberships;
CREATE TRIGGER trg_circle_member_count
  AFTER INSERT OR DELETE ON circle_memberships
  FOR EACH ROW EXECUTE FUNCTION update_circle_member_count();

-- Seed starter circles
INSERT INTO interest_circles (name, slug, description, category, cover_emoji) VALUES
('Gardening & Nature',    'gardening',       'Share tips, photos, and joy from your garden',                  'hobbies',  '🌱'),
('Book Club',             'book-club',       'Monthly reads and literary conversation',                       'hobbies',  '📚'),
('Travel Memories',       'travel-memories', 'Stories and photos from your favourite places',                 'culture',  '✈️'),
('Faith & Spirituality',  'faith',           'Interfaith space for reflection and community',                 'faith',    '🕊️'),
('Music & Song',          'music',           'Share music you love — artists, memories, live streams',        'hobbies',  '🎵'),
('Cooking & Recipes',     'cooking',         'Swap recipes, cooking tips, and food memories',                 'hobbies',  '🍳'),
('Health & Wellness',     'health-wellness', 'Tips for staying active and well — gentle exercise, nutrition', 'health',   '💪'),
('Family Stories',        'family-stories',  'Share family history, traditions, and memories',                'culture',  '👨‍👩‍👧‍👦'),
('Arts & Crafts',         'arts-crafts',     'Knitting, painting, woodworking — show your creations',         'hobbies',  '🎨'),
('Current Events',        'current-events',  'Thoughtful conversation about the world',                       'general',  '🗞️')
ON CONFLICT (slug) DO NOTHING;
