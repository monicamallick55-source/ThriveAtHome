-- Migration 095: Birthday arc + milestone programs (G5.4)

-- Opt-out flag on members
ALTER TABLE members ADD COLUMN IF NOT EXISTS celebration_opt_out boolean NOT NULL DEFAULT false;

-- Birthday arc log (idempotency)
CREATE TABLE IF NOT EXISTS birthday_arc_log (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  member_id  uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  year       int NOT NULL,
  step       text NOT NULL, -- 'd_minus_7' | 'd_minus_5' | 'd_minus_3' | 'd_minus_1' | 'd_day' | 'd_plus_1'
  sent_at    timestamptz,
  UNIQUE(member_id, year, step)
);
CREATE INDEX IF NOT EXISTS idx_birthday_arc_member ON birthday_arc_log (member_id, year);

-- Birthday wishes (D-3 through D+1)
CREATE TABLE IF NOT EXISTS birthday_wishes (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   timestamptz DEFAULT now() NOT NULL,
  member_id    uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  year         int NOT NULL,
  author_id    uuid REFERENCES family_members(id) ON DELETE SET NULL,
  author_name  text NOT NULL,
  message      text NOT NULL CHECK (char_length(message) <= 500),
  is_approved  boolean NOT NULL DEFAULT true
);
CREATE INDEX IF NOT EXISTS idx_birthday_wishes_member ON birthday_wishes (member_id, year);

-- Milestone birthday programs config
CREATE TABLE IF NOT EXISTS milestone_birthday_programs (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  age         int NOT NULL UNIQUE,
  title       text NOT NULL,
  description text,
  offering    text NOT NULL, -- 'life_story_prompt' | 'memory_book' | 'recorded_interview' | 'full_celebration'
  auto_create_event boolean NOT NULL DEFAULT false
);

INSERT INTO milestone_birthday_programs (age, title, description, offering, auto_create_event) VALUES
(70, '70th Birthday', 'Life story video prompt — Aria asks about favourite memories', 'life_story_prompt', false),
(75, '75th Birthday', 'Memory book offer + navigator call to plan celebration', 'memory_book', false),
(80, '80th Birthday', 'Recorded phone interview — Joy asks life questions, saved to life story with consent', 'recorded_interview', false),
(85, '85th Birthday', 'Full community celebration — toast event auto-created, greeting letter request', 'full_celebration', true),
(90, '90th Birthday', 'Full community celebration — toast event auto-created, greeting letter request', 'full_celebration', true),
(95, '95th Birthday', 'Full community celebration — toast event auto-created, greeting letter request', 'full_celebration', true),
(100, '100th Birthday', 'Century celebration — community toast, memory book, optional mayor/governor letter facilitation', 'full_celebration', true)
ON CONFLICT (age) DO NOTHING;
