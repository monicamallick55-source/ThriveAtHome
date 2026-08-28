-- Migration 066 — M25 Cultural Programming Depth (Phases 102–107)
-- Adds: cultural_festivals (102), cultural_potlucks + potluck_signups (103),
--       cultural_story_sessions + cultural_story_contributions (104),
--       heritage_projects (105),
--       cultural_classes + class_registrations (106),
--       oral_history_recordings (107)
-- Safe to re-run: IF NOT EXISTS guards + policy DO blocks.

-- ─────────────────────────────────────────────────────────────────────────────
-- PHASE 102 — Cultural Festival Calendar
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cultural_festivals (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        timestamptz DEFAULT now() NOT NULL,
  festival_name     text NOT NULL,
  culture_label     text NOT NULL,
  circle_name       text,
  festival_date     date NOT NULL,
  end_date          date,
  is_multi_day      boolean NOT NULL DEFAULT false,
  description       text NOT NULL,
  typical_greeting  text,
  traditions        text,
  primary_language  text NOT NULL DEFAULT 'english',
  is_active         boolean NOT NULL DEFAULT true
);
ALTER TABLE cultural_festivals ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "anyone_can_read_festivals" ON cultural_festivals FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "admin_can_manage_festivals" ON cultural_festivals FOR ALL
    USING (EXISTS (SELECT 1 FROM family_members fm
      WHERE fm.supabase_auth_id = auth.uid() AND fm.role IN ('admin','navigator')));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- PHASE 103 — Community Potluck Coordination
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cultural_potlucks (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        timestamptz DEFAULT now() NOT NULL,
  host_member_id    uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  circle_id         uuid REFERENCES cultural_circles(id) ON DELETE SET NULL,
  title             text NOT NULL,
  festival_tag      text,
  potluck_date      date NOT NULL,
  potluck_time      time,
  location_name     text,
  location_address  text NOT NULL,
  city              text,
  state             text,
  capacity          int NOT NULL DEFAULT 20,
  description       text,
  status            text NOT NULL DEFAULT 'open'
);
ALTER TABLE cultural_potlucks ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "authenticated_read_potlucks" ON cultural_potlucks FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "family_manage_own_potlucks" ON cultural_potlucks FOR ALL
    USING (EXISTS (SELECT 1 FROM family_members fm
      WHERE fm.member_id = cultural_potlucks.host_member_id AND fm.supabase_auth_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS potluck_signups (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        timestamptz DEFAULT now() NOT NULL,
  potluck_id        uuid NOT NULL REFERENCES cultural_potlucks(id) ON DELETE CASCADE,
  member_id         uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  dish_name         text,
  dish_category     text NOT NULL DEFAULT 'main',
  attendee_count    int NOT NULL DEFAULT 1,
  notes             text,
  UNIQUE(potluck_id, member_id)
);
ALTER TABLE potluck_signups ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "authenticated_read_potluck_signups" ON potluck_signups FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "family_manage_own_potluck_signups" ON potluck_signups FOR ALL
    USING (EXISTS (SELECT 1 FROM family_members fm
      WHERE fm.member_id = potluck_signups.member_id AND fm.supabase_auth_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- PHASE 104 — Cultural Story Circle (recorded to life story archive)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cultural_story_sessions (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        timestamptz DEFAULT now() NOT NULL,
  title             text NOT NULL,
  circle_id         uuid REFERENCES cultural_circles(id) ON DELETE SET NULL,
  theme             text,
  session_date      date NOT NULL,
  session_time      time,
  format            text NOT NULL DEFAULT 'phone',
  dial_in_number    text,
  dial_in_code      text,
  video_link        text,
  facilitator_name  text,
  status            text NOT NULL DEFAULT 'upcoming'
);
ALTER TABLE cultural_story_sessions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "authenticated_read_story_sessions" ON cultural_story_sessions FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "admin_manage_story_sessions" ON cultural_story_sessions FOR ALL
    USING (EXISTS (SELECT 1 FROM family_members fm
      WHERE fm.supabase_auth_id = auth.uid() AND fm.role IN ('admin','navigator')));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS cultural_story_contributions (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at            timestamptz DEFAULT now() NOT NULL,
  session_id            uuid REFERENCES cultural_story_sessions(id) ON DELETE SET NULL,
  member_id            uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  festival_name         text,
  homeland              text,
  story_text            text NOT NULL,
  saved_to_life_story   boolean NOT NULL DEFAULT false,
  life_story_entry_id   uuid REFERENCES life_story_entries(id) ON DELETE SET NULL
);
ALTER TABLE cultural_story_contributions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "family_manage_own_story_contributions" ON cultural_story_contributions FOR ALL
    USING (EXISTS (SELECT 1 FROM family_members fm
      WHERE fm.member_id = cultural_story_contributions.member_id AND fm.supabase_auth_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- PHASE 105 — Intergenerational Heritage Event
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS heritage_projects (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at            timestamptz DEFAULT now() NOT NULL,
  member_id            uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  student_volunteer_id  uuid REFERENCES student_volunteers(id) ON DELETE SET NULL,
  tradition_topic       text NOT NULL,
  school_name           text,
  project_description   text,
  status                text NOT NULL DEFAULT 'open',
  scheduled_at          timestamptz,
  format                text NOT NULL DEFAULT 'phone',
  student_reflection    text,
  elder_notes           text,
  saved_to_life_story   boolean NOT NULL DEFAULT false,
  life_story_entry_id   uuid REFERENCES life_story_entries(id) ON DELETE SET NULL
);
ALTER TABLE heritage_projects ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "authenticated_read_heritage_projects" ON heritage_projects FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "family_manage_own_heritage_projects" ON heritage_projects FOR ALL
    USING (EXISTS (SELECT 1 FROM family_members fm
      WHERE fm.member_id = heritage_projects.member_id AND fm.supabase_auth_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- PHASE 106 — Cultural Craft & Cooking Class
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cultural_classes (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at            timestamptz DEFAULT now() NOT NULL,
  title                 text NOT NULL,
  class_type            text NOT NULL DEFAULT 'craft',
  festival_tag          text,
  instructor_member_id  uuid REFERENCES members(id) ON DELETE SET NULL,
  instructor_name       text,
  class_date            date NOT NULL,
  class_time            time,
  format                text NOT NULL DEFAULT 'video_or_phone',
  dial_in_number        text,
  video_link            text,
  materials_list        text,
  skill_level           text NOT NULL DEFAULT 'all',
  max_participants      int NOT NULL DEFAULT 12,
  registration_count    int NOT NULL DEFAULT 0,
  description           text NOT NULL,
  status                text NOT NULL DEFAULT 'upcoming'
);
ALTER TABLE cultural_classes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "authenticated_read_cultural_classes" ON cultural_classes FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "admin_manage_cultural_classes" ON cultural_classes FOR ALL
    USING (EXISTS (SELECT 1 FROM family_members fm
      WHERE fm.supabase_auth_id = auth.uid() AND fm.role IN ('admin','navigator')));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS class_registrations (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at            timestamptz DEFAULT now() NOT NULL,
  class_id              uuid NOT NULL REFERENCES cultural_classes(id) ON DELETE CASCADE,
  member_id            uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  needs_materials_kit   boolean NOT NULL DEFAULT false,
  notes                 text,
  UNIQUE(class_id, member_id)
);
ALTER TABLE class_registrations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "authenticated_read_class_registrations" ON class_registrations FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "family_manage_own_class_registrations" ON class_registrations FOR ALL
    USING (EXISTS (SELECT 1 FROM family_members fm
      WHERE fm.member_id = class_registrations.member_id AND fm.supabase_auth_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- PHASE 107 — Oral History Archive (native languages)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS oral_history_recordings (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at            timestamptz DEFAULT now() NOT NULL,
  member_id            uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  recorded_by           uuid REFERENCES family_members(id) ON DELETE SET NULL,
  title                 text NOT NULL,
  language              text NOT NULL DEFAULT 'english',
  topic                 text,
  era                   text,
  description           text,
  transcript            text,
  translation_en        text,
  audio_path            text,
  duration_seconds      int,
  consent_given         boolean NOT NULL DEFAULT false,
  visibility            text NOT NULL DEFAULT 'family',
  saved_to_life_story   boolean NOT NULL DEFAULT false,
  life_story_entry_id   uuid REFERENCES life_story_entries(id) ON DELETE SET NULL
);
ALTER TABLE oral_history_recordings ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "family_manage_own_oral_history" ON oral_history_recordings FOR ALL
    USING (EXISTS (SELECT 1 FROM family_members fm
      WHERE fm.member_id = oral_history_recordings.member_id AND fm.supabase_auth_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "navigator_read_oral_history" ON oral_history_recordings FOR SELECT
    USING (EXISTS (SELECT 1 FROM family_members fm
      WHERE fm.supabase_auth_id = auth.uid() AND fm.role IN ('admin','navigator')));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- SEED — major cultural festivals (approximate observed dates for 2026; refresh yearly)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO cultural_festivals (festival_name, culture_label, circle_name, festival_date, end_date, is_multi_day, description, typical_greeting, traditions, primary_language)
SELECT * FROM (VALUES
  ('Lunar New Year', 'Chinese, Vietnamese (Tết), Korean (Seollal)', 'Chinese-American Community', DATE '2026-02-17', DATE '2026-02-23', true,
   'The most important holiday across much of East Asia — a fresh start marked by family reunion dinners, red envelopes, and honouring ancestors.', 'Gong Xi Fa Cai / Chúc Mừng Năm Mới', 'Reunion dinner, red envelopes (hóngbāo / lì xì), lion dances, cleaning the home for good luck.', 'mandarin'),
  ('Tết (Vietnamese New Year)', 'Vietnamese', 'Vietnamese-American Community', DATE '2026-02-17', DATE '2026-02-19', true,
   'Vietnam''s New Year — a time for family, gratitude to ancestors, and hopes for the year ahead.', 'Chúc Mừng Năm Mới', 'Bánh chưng cakes, kumquat trees, first-visitor tradition (xông đất), lì xì envelopes.', 'vietnamese'),
  ('Seollal (Korean New Year)', 'Korean', 'Korean-American Community', DATE '2026-02-17', DATE '2026-02-18', true,
   'Korean Lunar New Year — deep bows to elders, ancestral rites, and tteokguk soup that adds a year of age.', 'Saehae bok mani badeuseyo', 'Sebae (New Year bow), tteokguk rice-cake soup, hanbok dress, yut nori game.', 'korean'),
  ('Nowruz (Persian New Year)', 'Persian, Afghan, Kurdish, Central Asian', 'Arab & Middle Eastern Community', DATE '2026-03-20', NULL, false,
   'The spring equinox New Year celebrated for over 3,000 years across the Persian cultural world.', 'Nowruz Mobarak', 'Haft-sin table of seven symbolic items, spring cleaning, visiting elders, Sizdah Bedar picnic.', 'arabic'),
  ('Holi', 'South Asian (Hindu)', 'South Asian Community', DATE '2026-03-04', NULL, false,
   'The festival of colours welcoming spring and the triumph of good over evil.', 'Happy Holi', 'Throwing coloured powder (gulal), bonfires (Holika Dahan), sweets like gujiya.', 'hindi'),
  ('Ramadan (begins)', 'Muslim', 'Arab & Middle Eastern Community', DATE '2026-02-18', DATE '2026-03-19', true,
   'The holy month of fasting from dawn to sunset, prayer, reflection, and community.', 'Ramadan Mubarak', 'Suhoor and iftar meals, extra night prayers (taraweeh), increased charity (zakat).', 'arabic'),
  ('Eid al-Fitr', 'Muslim', 'Arab & Middle Eastern Community', DATE '2026-03-20', DATE '2026-03-21', true,
   'The joyful feast marking the end of Ramadan.', 'Eid Mubarak', 'Morning Eid prayer, new clothes, festive meals, gifts and money for children (Eidi).', 'arabic'),
  ('Passover (Pesach)', 'Jewish', 'Jewish-American Community', DATE '2026-04-01', DATE '2026-04-09', true,
   'An eight-day festival recalling the Exodus from slavery in Egypt.', 'Chag Pesach Sameach', 'Seder meal, reading the Haggadah, matzah instead of leavened bread, the Four Questions.', 'english'),
  ('Vaisakhi', 'Sikh, Punjabi', 'South Asian Community', DATE '2026-04-14', NULL, false,
   'The Punjabi spring harvest festival and the founding of the Khalsa in 1699.', 'Happy Vaisakhi', 'Nagar Kirtan processions, visits to the gurdwara, bhangra and gidda dancing, langar meal.', 'hindi'),
  ('Eid al-Adha', 'Muslim', 'Arab & Middle Eastern Community', DATE '2026-05-26', DATE '2026-05-29', true,
   'The Feast of Sacrifice honouring Ibrahim''s devotion, coinciding with the Hajj pilgrimage.', 'Eid Mubarak', 'Eid prayer, sharing meat with family, neighbours, and those in need.', 'arabic'),
  ('Juneteenth', 'African-American', 'African-American Community', DATE '2026-06-19', NULL, false,
   'Commemorates June 19, 1865, when the last enslaved people in Texas learned they were free.', 'Happy Juneteenth', 'Cookouts, red foods and drinks, readings of the Emancipation Proclamation, music and reflection.', 'english'),
  ('Obon', 'Japanese', NULL, DATE '2026-08-13', DATE '2026-08-15', true,
   'A Buddhist observance welcoming the spirits of ancestors home for a few days each summer.', 'Happy Obon', 'Bon Odori folk dancing, lanterns to guide spirits, visiting and cleaning family graves.', 'english'),
  ('Chuseok (Korean Thanksgiving)', 'Korean', 'Korean-American Community', DATE '2026-09-24', DATE '2026-09-26', true,
   'The autumn harvest festival — gratitude for the year''s bounty and honouring ancestors.', 'Chuseok jal bonaeseyo', 'Songpyeon rice cakes, charye ancestral rites, visiting family graves (seongmyo).', 'korean'),
  ('Mid-Autumn Festival', 'Chinese, Vietnamese', 'Chinese-American Community', DATE '2026-09-25', NULL, false,
   'A harvest-moon festival of reunion, gratitude, and mooncakes under the fullest moon of the year.', 'Zhōngqiū jié kuàilè', 'Mooncakes, lanterns, tea, moon-gazing with family.', 'mandarin'),
  ('Rosh Hashanah', 'Jewish', 'Jewish-American Community', DATE '2026-09-11', DATE '2026-09-13', true,
   'The Jewish New Year — a time of reflection, renewal, and sweetness for the year ahead.', 'Shanah Tovah', 'Apples and honey, round challah, hearing the shofar, tashlich by flowing water.', 'english'),
  ('Yom Kippur', 'Jewish', 'Jewish-American Community', DATE '2026-09-20', DATE '2026-09-21', true,
   'The Day of Atonement — the holiest day of the Jewish year, marked by fasting and prayer.', 'G''mar Chatimah Tovah', 'A 25-hour fast, Kol Nidre service, wearing white, breaking the fast together.', 'english'),
  ('Navratri & Durga Puja', 'South Asian (Hindu)', 'South Asian Community', DATE '2026-10-11', DATE '2026-10-19', true,
   'Nine nights honouring the goddess Durga, ending with Dussehra''s victory of good over evil.', 'Happy Navratri', 'Garba and dandiya dancing, fasting, pandal visits, Durga idols and immersion.', 'hindi'),
  ('Día de los Muertos', 'Latino, Mexican', 'Latino & Hispanic Community', DATE '2026-11-01', DATE '2026-11-02', true,
   'Day of the Dead — a loving remembrance of family members who have passed.', 'Feliz Día de los Muertos', 'Ofrenda altars, marigolds (cempasúchil), pan de muerto, sugar skulls, graveside gatherings.', 'spanish'),
  ('Diwali', 'South Asian (Hindu, Sikh, Jain)', 'South Asian Community', DATE '2026-11-08', NULL, false,
   'The festival of lights — the victory of light over darkness and knowledge over ignorance.', 'Happy Diwali / Shubh Deepavali', 'Diyas and rangoli, Lakshmi puja, sweets and gifts, fireworks, new beginnings.', 'hindi'),
  ('Hanukkah', 'Jewish', 'Jewish-American Community', DATE '2026-12-04', DATE '2026-12-12', true,
   'The eight-day Festival of Lights recalling the rededication of the Temple in Jerusalem.', 'Chag Urim Sameach / Happy Hanukkah', 'Lighting the menorah, spinning the dreidel, latkes and sufganiyot, gelt for children.', 'english'),
  ('Las Posadas', 'Latino, Mexican', 'Latino & Hispanic Community', DATE '2026-12-16', DATE '2026-12-24', true,
   'Nine nights re-enacting Mary and Joseph''s search for shelter before Christmas.', 'Feliz Posada', 'Candlelit processions, call-and-response singing, piñatas, tamales and ponche.', 'spanish'),
  ('Kwanzaa', 'African-American', 'African-American Community', DATE '2026-12-26', DATE '2027-01-01', true,
   'A seven-day celebration of African-American heritage and the seven principles (Nguzo Saba).', 'Habari Gani', 'Lighting the kinara, unity cup, homemade gifts, the Karamu feast, reflection on each principle.', 'english'),
  ('Three Kings Day (Día de Reyes)', 'Latino, Caribbean', 'Latino & Hispanic Community', DATE '2027-01-06', NULL, false,
   'Epiphany — when the Three Wise Men brought gifts, and children receive theirs.', 'Feliz Día de Reyes', 'Rosca de reyes bread with a hidden figurine, gifts for children, parades.', 'spanish')
) AS v(festival_name, culture_label, circle_name, festival_date, end_date, is_multi_day, description, typical_greeting, traditions, primary_language)
WHERE NOT EXISTS (SELECT 1 FROM cultural_festivals cf WHERE cf.festival_name = v.festival_name AND cf.festival_date = v.festival_date);

-- ─────────────────────────────────────────────────────────────────────────────
-- SEED — a couple of upcoming story-circle sessions and cultural classes so the
--        pages are not empty on first load (admins add more via Supabase).
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO cultural_story_sessions (title, theme, session_date, session_time, format, dial_in_number, dial_in_code, facilitator_name, status)
SELECT 'Homeland Festival Memories — Autumn', 'Share a festival you remember from childhood', CURRENT_DATE + 14, TIME '14:00', 'phone', '(888) 555-0142', '774411', 'ThriveAtHome Story Circle', 'upcoming'
WHERE NOT EXISTS (SELECT 1 FROM cultural_story_sessions WHERE title = 'Homeland Festival Memories — Autumn');

INSERT INTO cultural_classes (title, class_type, festival_tag, instructor_name, class_date, class_time, format, materials_list, skill_level, max_participants, description, status)
SELECT 'Dumpling Folding for Lunar New Year', 'cooking', 'Lunar New Year', 'ThriveAtHome Kitchen', CURRENT_DATE + 21, TIME '11:00', 'video_or_phone',
       'Flour, water, ground pork or finely chopped cabbage, a rolling pin, a clean work surface.', 'all', 12,
       'A gentle, step-by-step class on folding jiaozi dumplings — join by video to follow along, or by phone and we will talk you through each fold.', 'upcoming'
WHERE NOT EXISTS (SELECT 1 FROM cultural_classes WHERE title = 'Dumpling Folding for Lunar New Year');

INSERT INTO cultural_classes (title, class_type, festival_tag, instructor_name, class_date, class_time, format, materials_list, skill_level, max_participants, description, status)
SELECT 'Diya Painting for Diwali', 'craft', 'Diwali', 'ThriveAtHome Craft Circle', CURRENT_DATE + 30, TIME '15:00', 'video_or_phone',
       'Plain clay or terracotta diyas (we can mail a kit), acrylic paints, small brushes, newspaper to protect the table.', 'all', 12,
       'Decorate small clay lamps for Diwali. Request a free materials kit and we will post it to you before class.', 'upcoming'
WHERE NOT EXISTS (SELECT 1 FROM cultural_classes WHERE title = 'Diya Painting for Diwali');
