-- G4.2: SMS opt-out + contact preference
ALTER TABLE members ADD COLUMN IF NOT EXISTS sms_opt_out boolean NOT NULL DEFAULT false;
ALTER TABLE members ADD COLUMN IF NOT EXISTS sms_opt_out_at timestamptz;
ALTER TABLE members ADD COLUMN IF NOT EXISTS preferred_contact_method text NOT NULL DEFAULT 'email'
  CHECK (preferred_contact_method IN ('email','sms','both'));

CREATE TABLE IF NOT EXISTS org_email_log (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  org_id     uuid REFERENCES community_orgs(id) ON DELETE CASCADE,
  sent_by    uuid REFERENCES family_members(id),
  subject    text,
  body       text,
  recipients int,
  channel    text NOT NULL DEFAULT 'email' CHECK (channel IN ('email','sms','both'))
);
ALTER TABLE org_email_log ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'email'
  CHECK (channel IN ('email','sms','both'));

-- G4.3: Geocoding columns
ALTER TABLE members           ADD COLUMN IF NOT EXISTS lat double precision;
ALTER TABLE members           ADD COLUMN IF NOT EXISTS lng double precision;
ALTER TABLE members           ADD COLUMN IF NOT EXISTS geocoded_at timestamptz;
ALTER TABLE volunteers        ADD COLUMN IF NOT EXISTS lat double precision;
ALTER TABLE volunteers        ADD COLUMN IF NOT EXISTS lng double precision;
ALTER TABLE volunteers        ADD COLUMN IF NOT EXISTS geocoded_at timestamptz;
ALTER TABLE service_providers ADD COLUMN IF NOT EXISTS lat double precision;
ALTER TABLE service_providers ADD COLUMN IF NOT EXISTS lng double precision;
ALTER TABLE service_providers ADD COLUMN IF NOT EXISTS geocoded_at timestamptz;
ALTER TABLE community_orgs    ADD COLUMN IF NOT EXISTS lat double precision;
ALTER TABLE community_orgs    ADD COLUMN IF NOT EXISTS lng double precision;
ALTER TABLE community_orgs    ADD COLUMN IF NOT EXISTS geocoded_at timestamptz;

-- G4.5b: Device tokens
CREATE TABLE IF NOT EXISTS device_tokens (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      timestamptz DEFAULT now() NOT NULL,
  member_id       uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  token_hash      text UNIQUE,
  label           text NOT NULL DEFAULT 'Thrive Device',
  created_by      uuid REFERENCES family_members(id),
  last_seen_at    timestamptz,
  app_version     text,
  battery_pct     int CHECK (battery_pct BETWEEN 0 AND 100),
  revoked_at      timestamptz,
  pairing_code    text,
  pairing_expires timestamptz
);
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "navigator_device_tokens" ON device_tokens;
CREATE POLICY "navigator_device_tokens" ON device_tokens
  USING (EXISTS (SELECT 1 FROM members m WHERE m.id = device_tokens.member_id));

-- G4.7: Training modules
CREATE TABLE IF NOT EXISTS training_modules (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  title      text NOT NULL,
  role_scope text NOT NULL DEFAULT 'volunteer'
    CHECK (role_scope IN ('volunteer','buddy','driver','student')),
  content_md text NOT NULL DEFAULT '',
  video_url  text,
  quiz       jsonb,
  required   boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS training_completions (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   timestamptz DEFAULT now() NOT NULL,
  volunteer_id uuid NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
  module_id    uuid NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
  score        int,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (volunteer_id, module_id)
);
ALTER TABLE training_modules    ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_completions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_training_modules" ON training_modules;
CREATE POLICY "read_training_modules" ON training_modules FOR SELECT USING (true);
DROP POLICY IF EXISTS "volunteer_own_completions" ON training_completions;
CREATE POLICY "volunteer_own_completions" ON training_completions
  USING (volunteer_id IN (SELECT id FROM volunteers WHERE supabase_auth_id = auth.uid()));

INSERT INTO training_modules (title, role_scope, content_md, required, sort_order) VALUES
  ('Welcome & Boundaries','volunteer','## Welcome\n\nCovers your role and boundaries.\n\n- Do not accept money or gifts\n- Never share personal contact info\n- If unsure, ask your navigator',true,1),
  ('Recognising Concerns & Escalating','volunteer','## Log, never act alone\n\nIf you notice a concern, log it immediately and contact your navigator.',true,2),
  ('Scam Awareness','volunteer','## Protecting Members\n\nNever help a member purchase gift cards for a third party. Alert your navigator if you suspect a scam.',true,3),
  ('Dementia-Friendly Communication','volunteer','## Key principles\n\n- Use simple short sentences\n- Do not correct — redirect instead\n- Be patient with repetition',true,4),
  ('Privacy & HIPAA Basics','volunteer','## Your obligations\n\n- Never share member info outside the care team\n- Do not post about members on social media\n- When in doubt, ask your navigator',true,5)
ON CONFLICT DO NOTHING;
