-- Migration 010: Cultural Community Circles
-- Creates cultural_circles, circle_memberships, circle_posts, circle_events tables

CREATE TABLE cultural_circles (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       timestamptz DEFAULT now() NOT NULL,
  circle_name      text NOT NULL,
  primary_language text NOT NULL DEFAULT 'english',
  description      text NOT NULL,
  member_count     int NOT NULL DEFAULT 0,
  is_active        boolean NOT NULL DEFAULT true,
  image_placeholder text
);
ALTER TABLE cultural_circles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone_can_read_circles" ON cultural_circles FOR SELECT USING (true);
CREATE POLICY "admin_can_manage_circles" ON cultural_circles FOR ALL
  USING (EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.supabase_auth_id = auth.uid() AND fm.role IN ('admin', 'navigator')
  ));

CREATE TABLE circle_memberships (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  timestamptz DEFAULT now() NOT NULL,
  member_id   uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  circle_id   uuid NOT NULL REFERENCES cultural_circles(id) ON DELETE CASCADE,
  joined_at   timestamptz NOT NULL DEFAULT now(),
  is_ambassador boolean NOT NULL DEFAULT false,
  UNIQUE(member_id, circle_id)
);
ALTER TABLE circle_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_can_manage_own_memberships" ON circle_memberships FOR ALL
  USING (EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.member_id = circle_memberships.member_id AND fm.supabase_auth_id = auth.uid()
  ));
CREATE POLICY "anyone_can_read_circle_memberships" ON circle_memberships FOR SELECT USING (true);

CREATE TABLE circle_posts (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  circle_id  uuid NOT NULL REFERENCES cultural_circles(id) ON DELETE CASCADE,
  member_id  uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  content    text NOT NULL,
  post_type  text NOT NULL DEFAULT 'update'
);
ALTER TABLE circle_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_can_post_to_circles" ON circle_posts FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.member_id = circle_posts.member_id AND fm.supabase_auth_id = auth.uid()
  ));
CREATE POLICY "anyone_can_read_circle_posts" ON circle_posts FOR SELECT USING (true);
CREATE POLICY "family_can_delete_own_posts" ON circle_posts FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.member_id = circle_posts.member_id AND fm.supabase_auth_id = auth.uid()
  ));

CREATE TABLE circle_events (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   timestamptz DEFAULT now() NOT NULL,
  circle_id    uuid NOT NULL REFERENCES cultural_circles(id) ON DELETE CASCADE,
  title        text NOT NULL,
  description  text,
  event_date   date NOT NULL,
  event_time   time,
  format       text NOT NULL DEFAULT 'phone',
  dial_in_number text,
  dial_in_code text,
  video_link   text,
  rsvp_count   int NOT NULL DEFAULT 0,
  is_recurring boolean NOT NULL DEFAULT false
);
ALTER TABLE circle_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone_can_read_circle_events" ON circle_events FOR SELECT USING (true);
CREATE POLICY "admin_can_manage_circle_events" ON circle_events FOR ALL
  USING (EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.supabase_auth_id = auth.uid() AND fm.role IN ('admin', 'navigator')
  ));

CREATE TABLE circle_event_rsvps (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  event_id   uuid NOT NULL REFERENCES circle_events(id) ON DELETE CASCADE,
  member_id  uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  UNIQUE(event_id, member_id)
);
ALTER TABLE circle_event_rsvps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_can_manage_own_rsvps" ON circle_event_rsvps FOR ALL
  USING (EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.member_id = circle_event_rsvps.member_id AND fm.supabase_auth_id = auth.uid()
  ));
CREATE POLICY "anyone_can_read_rsvps" ON circle_event_rsvps FOR SELECT USING (true);

-- Seed all 12 cultural circles
INSERT INTO cultural_circles (circle_name, primary_language, description) VALUES
('Latino & Hispanic Community', 'spanish', 'A welcoming space for Latino and Hispanic seniors to connect, share stories, and celebrate our rich cultural heritage.'),
('Chinese-American Community', 'mandarin', 'Connecting Chinese-American seniors across generations — sharing traditions, language, and community.'),
('Vietnamese-American Community', 'vietnamese', 'A warm community for Vietnamese-American seniors to connect, share memories, and support one another.'),
('Korean-American Community', 'korean', 'Celebrating Korean heritage and building connections among Korean-American seniors.'),
('South Asian Community', 'hindi', 'A welcoming space for seniors from India, Pakistan, Bangladesh, Sri Lanka, and Nepal.'),
('Filipino-American Community', 'tagalog', 'Connecting Filipino-American seniors through shared culture, language, and warm community spirit.'),
('African-American Community', 'english', 'A proud and vibrant space celebrating African-American heritage, history, and community.'),
('Jewish-American Community', 'english', 'Connecting Jewish seniors through shared traditions, holidays, and the richness of Jewish culture.'),
('Arab & Middle Eastern Community', 'arabic', 'A welcoming community for Arab and Middle Eastern seniors to share culture and connection.'),
('Caribbean Community', 'english', 'Celebrating the warmth and vibrancy of Caribbean culture — from Jamaica to Haiti to Trinidad.'),
('Eastern European Community', 'polish', 'Connecting seniors with roots in Poland, Ukraine, Russia, and across Eastern Europe.'),
('Native American & Indigenous Community', 'english', 'Honoring Indigenous heritage and building connections among Native American seniors.');
