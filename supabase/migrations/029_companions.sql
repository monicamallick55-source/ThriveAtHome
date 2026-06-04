-- Phase 48: Paid Companion Marketplace
-- Companions are vetted paid professionals, distinct from free volunteers

CREATE TABLE companions (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        timestamptz DEFAULT now() NOT NULL,
  supabase_auth_id  uuid UNIQUE,
  full_name         text NOT NULL,
  email             text NOT NULL,
  bio               text,
  hourly_rate       numeric NOT NULL DEFAULT 20,
  service_types     text[] DEFAULT '{}',
  languages         text[] DEFAULT '{}',
  city              text,
  state             text,
  stripe_account_id text,
  is_active         boolean NOT NULL DEFAULT false,
  rating_average    numeric,
  total_sessions    int NOT NULL DEFAULT 0
);
ALTER TABLE companions ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read active companions
CREATE POLICY "authenticated_can_read_active_companions"
  ON companions FOR SELECT TO authenticated
  USING (is_active = true);

-- Service role can manage all companions
CREATE POLICY "service_role_manage_companions"
  ON companions FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Seed 3 test companions (Chicago area)
INSERT INTO companions (full_name, email, bio, hourly_rate, service_types, languages, city, state, is_active, rating_average, total_sessions)
VALUES
  (
    'Linda Park',
    'linda.park@test.thriveathome.dev',
    'Warm and patient companion with 8 years of experience supporting seniors. Former social worker who loves conversation, gentle walks, and listening to life stories.',
    22,
    ARRAY['in_person_visit', 'phone_call', 'walking_companion', 'reading_aloud'],
    ARRAY['english', 'korean'],
    'Chicago',
    'IL',
    true,
    4.9,
    47
  ),
  (
    'Robert Vasquez',
    'robert.vasquez@test.thriveathome.dev',
    'Bilingual companion fluent in English and Spanish. Retired nurse who brings medical awareness and genuine warmth to every visit. Enjoys cooking, music, and card games.',
    20,
    ARRAY['in_person_visit', 'phone_call', 'grocery_help'],
    ARRAY['english', 'spanish'],
    'Chicago',
    'IL',
    true,
    4.7,
    32
  ),
  (
    'Grace Thompson',
    'grace.thompson@test.thriveathome.dev',
    'Compassionate companion specialising in dementia-friendly care. Trained in music therapy and reminiscence activities. Available weekdays and some weekends.',
    25,
    ARRAY['in_person_visit', 'phone_call', 'reading_aloud', 'walking_companion'],
    ARRAY['english'],
    'Evanston',
    'IL',
    true,
    5.0,
    18
  );
