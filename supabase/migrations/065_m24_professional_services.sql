-- M24 — Professional Services Revenue Layer (Phases 98–101)
-- Phase 98  Trusted Advisor Directory (paid annual listings)
-- Phase 99  VITA / TCE free tax-prep integration
-- Phase 100 988 Suicide & Crisis Lifeline + SAMHSA — platform-wide embedding (engagement log)
-- Phase 101 Essential Documents Vault extension (advance directives, insurance cards, estate documents)
--
-- Run this whole file once in the Supabase SQL Editor. Safe to re-run (guards throughout).

-- ═══════════════════════════════ ENUMS ═══════════════════════════════
DO $$ BEGIN
  CREATE TYPE advisor_type AS ENUM (
    'elder_law_attorney','estate_planning_attorney','financial_advisor',
    'benefits_counselor','tax_professional','insurance_specialist','geriatric_care_manager'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE advisor_listing_tier AS ENUM ('standard','featured','premier');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE advisor_listing_status AS ENUM ('pending','active','expired','suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ═══════════════ PHASE 98 — Trusted Advisor Directory ═══════════════

CREATE TABLE IF NOT EXISTS trusted_advisors (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at          timestamptz DEFAULT now() NOT NULL,
  full_name           text NOT NULL,
  firm_name           text,
  advisor_type        advisor_type NOT NULL,
  bio                 text,
  credentials         text[] NOT NULL DEFAULT '{}',
  languages           text[] NOT NULL DEFAULT '{}',
  service_states      text[] NOT NULL DEFAULT '{}',
  service_metros      text[] NOT NULL DEFAULT '{}',
  city                text,
  state               text,
  phone               text,
  email               text,
  website             text,
  headshot_path       text,
  accepts_new_clients boolean NOT NULL DEFAULT true,
  offers_free_consult boolean NOT NULL DEFAULT false,
  sliding_scale       boolean NOT NULL DEFAULT false,
  listing_tier        advisor_listing_tier NOT NULL DEFAULT 'standard',
  listing_fee_annual  numeric NOT NULL DEFAULT 2400,
  listing_status      advisor_listing_status NOT NULL DEFAULT 'pending',
  listing_started_at  timestamptz,
  listing_expires_at  timestamptz,
  vetted_at           timestamptz,
  vetted_by           uuid REFERENCES family_members(id) ON DELETE SET NULL,
  thrive_verified     boolean NOT NULL DEFAULT false,
  avg_rating          numeric,
  total_reviews       int NOT NULL DEFAULT 0,
  notes               text
);
ALTER TABLE trusted_advisors ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "anyone_reads_active_advisors" ON trusted_advisors
    FOR SELECT USING (listing_status = 'active');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS idx_trusted_advisors_type   ON trusted_advisors(advisor_type);
CREATE INDEX IF NOT EXISTS idx_trusted_advisors_status ON trusted_advisors(listing_status);

CREATE TABLE IF NOT EXISTS advisor_listing_applications (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       timestamptz DEFAULT now() NOT NULL,
  full_name        text NOT NULL,
  firm_name        text,
  advisor_type     advisor_type NOT NULL,
  email            text NOT NULL,
  phone            text,
  credentials      text,
  service_areas    text,
  years_experience text,
  requested_tier   advisor_listing_tier NOT NULL DEFAULT 'standard',
  message          text,
  status           text NOT NULL DEFAULT 'new',       -- new | reviewing | approved | rejected
  reviewed_at      timestamptz,
  reviewed_by      uuid REFERENCES family_members(id) ON DELETE SET NULL,
  review_notes     text
);
ALTER TABLE advisor_listing_applications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "anyone_submits_advisor_application" ON advisor_listing_applications
    FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS advisor_connections (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        timestamptz DEFAULT now() NOT NULL,
  member_id         uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  advisor_id        uuid NOT NULL REFERENCES trusted_advisors(id) ON DELETE CASCADE,
  requested_by      uuid REFERENCES family_members(id) ON DELETE SET NULL,
  status            text NOT NULL DEFAULT 'requested', -- requested | introduced | met | declined | closed
  topic             text,
  member_note       text,
  navigator_id      uuid REFERENCES care_navigators(id) ON DELETE SET NULL,
  navigator_note    text,
  introduced_at     timestamptz,
  navigator_task_id uuid REFERENCES navigator_tasks(id) ON DELETE SET NULL
);
ALTER TABLE advisor_connections ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "family_all_own_advisor_connections" ON advisor_connections FOR ALL
    USING (EXISTS (SELECT 1 FROM family_members fm
      WHERE fm.member_id = advisor_connections.member_id AND fm.supabase_auth_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "navigator_reads_advisor_connections" ON advisor_connections FOR SELECT
    USING (EXISTS (SELECT 1 FROM care_navigators cn WHERE cn.supabase_auth_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS idx_advisor_connections_member ON advisor_connections(member_id);
CREATE INDEX IF NOT EXISTS idx_advisor_connections_status ON advisor_connections(status);

CREATE TABLE IF NOT EXISTS advisor_reviews (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at    timestamptz DEFAULT now() NOT NULL,
  advisor_id    uuid NOT NULL REFERENCES trusted_advisors(id) ON DELETE CASCADE,
  member_id     uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  connection_id uuid REFERENCES advisor_connections(id) ON DELETE SET NULL,
  rating        int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text   text,
  is_published  boolean NOT NULL DEFAULT true,
  UNIQUE(advisor_id, member_id)
);
ALTER TABLE advisor_reviews ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "anyone_reads_published_advisor_reviews" ON advisor_reviews
    FOR SELECT USING (is_published = true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "family_writes_own_advisor_reviews" ON advisor_reviews FOR ALL
    USING (EXISTS (SELECT 1 FROM family_members fm
      WHERE fm.member_id = advisor_reviews.member_id AND fm.supabase_auth_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ═══════════════ PHASE 99 — VITA / TCE tax assistance ═══════════════

CREATE TABLE IF NOT EXISTS vita_sites (
  id                   uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at           timestamptz DEFAULT now() NOT NULL,
  site_name            text NOT NULL,
  host_org             text,
  address              text,
  city                 text,
  state                text,
  zip                  text,
  phone                text,
  languages            text[] NOT NULL DEFAULT '{}',
  appointment_required boolean NOT NULL DEFAULT true,
  drop_off_available   boolean NOT NULL DEFAULT false,
  virtual_available    boolean NOT NULL DEFAULT false,
  hours_note           text,
  season_start         date,
  season_end           date,
  program_type         text NOT NULL DEFAULT 'vita',  -- vita | tce
  is_active            boolean NOT NULL DEFAULT true,
  source               text NOT NULL DEFAULT 'manual',
  external_id          text
);
ALTER TABLE vita_sites ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "authenticated_reads_vita_sites" ON vita_sites
    FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS idx_vita_sites_state ON vita_sites(state);

CREATE TABLE IF NOT EXISTS vita_appointments (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at            timestamptz DEFAULT now() NOT NULL,
  member_id             uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  requested_by          uuid REFERENCES family_members(id) ON DELETE SET NULL,
  vita_site_id          uuid REFERENCES vita_sites(id) ON DELETE SET NULL,
  tax_year              int NOT NULL,
  filing_situation      text,
  estimated_income_band text,
  needs_transport       boolean NOT NULL DEFAULT false,
  needs_language_support text,
  preferred_dates       text,
  status                text NOT NULL DEFAULT 'requested', -- requested | scheduled | completed | cancelled
  scheduled_for         timestamptz,
  navigator_id          uuid REFERENCES care_navigators(id) ON DELETE SET NULL,
  navigator_note        text,
  navigator_task_id     uuid REFERENCES navigator_tasks(id) ON DELETE SET NULL
);
ALTER TABLE vita_appointments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "family_all_own_vita_appointments" ON vita_appointments FOR ALL
    USING (EXISTS (SELECT 1 FROM family_members fm
      WHERE fm.member_id = vita_appointments.member_id AND fm.supabase_auth_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "navigator_reads_vita_appointments" ON vita_appointments FOR SELECT
    USING (EXISTS (SELECT 1 FROM care_navigators cn WHERE cn.supabase_auth_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS idx_vita_appointments_member ON vita_appointments(member_id);

-- ═══════════════ PHASE 100 — Crisis resource engagement log ═══════════════

CREATE TABLE IF NOT EXISTS crisis_resource_views (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at    timestamptz DEFAULT now() NOT NULL,
  member_id     uuid REFERENCES members(id) ON DELETE SET NULL,
  viewer_auth_id uuid,
  resource_key  text NOT NULL,
  surface       text,                         -- dashboard_footer | grief | crisis_page | member_portal
  action        text NOT NULL DEFAULT 'view'  -- view | call_clicked | text_clicked | chat_clicked
);
ALTER TABLE crisis_resource_views ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "authenticated_inserts_crisis_views" ON crisis_resource_views
    FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "family_reads_own_crisis_views" ON crisis_resource_views FOR SELECT
    USING (EXISTS (SELECT 1 FROM family_members fm
      WHERE fm.member_id = crisis_resource_views.member_id AND fm.supabase_auth_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ═══════════════ PHASE 101 — Essential Documents Vault extension ═══════════════

ALTER TABLE document_vault_items ADD COLUMN IF NOT EXISTS doc_category           text NOT NULL DEFAULT 'other';
ALTER TABLE document_vault_items ADD COLUMN IF NOT EXISTS expires_on            date;
ALTER TABLE document_vault_items ADD COLUMN IF NOT EXISTS shared_with_navigator boolean NOT NULL DEFAULT false;
ALTER TABLE document_vault_items ADD COLUMN IF NOT EXISTS issuer                text;
CREATE INDEX IF NOT EXISTS idx_document_vault_category ON document_vault_items(member_id, doc_category);

-- ═══════════════════════════ SEED DATA ═══════════════════════════

-- Sample vetted advisors (active listings — annualised directory revenue is the sum of listing_fee_annual)
INSERT INTO trusted_advisors
  (full_name, firm_name, advisor_type, bio, credentials, languages, service_states, service_metros,
   city, state, phone, email, website, accepts_new_clients, offers_free_consult, sliding_scale,
   listing_tier, listing_fee_annual, listing_status, listing_started_at, listing_expires_at,
   vetted_at, thrive_verified, avg_rating, total_reviews)
SELECT * FROM (VALUES
  ('Patricia Alvarez, Esq.', 'Alvarez Elder Law', 'elder_law_attorney'::advisor_type,
   'Twenty years helping Bay Area families with Medicaid planning, guardianship, and long-term care asset protection. Offers a free 30-minute first consultation.',
   ARRAY['J.D.','Certified Elder Law Attorney (CELA)'], ARRAY['english','spanish'],
   ARRAY['CA'], ARRAY['San Francisco Bay Area'],
   'Oakland','CA','(510) 555-0142','patricia@alvarezelderlaw.example','https://alvarezelderlaw.example',
   true, true, false, 'premier'::advisor_listing_tier, 6000, 'active'::advisor_listing_status,
   now() - interval '40 days', now() + interval '325 days', now() - interval '45 days', true, 4.9, 12),
  ('David Chen, CFP', 'Meridian Retirement Advisors', 'financial_advisor'::advisor_type,
   'Fee-only fiduciary focused on retirement income, Social Security timing, and simplifying finances for older adults and their families.',
   ARRAY['CFP','Fiduciary'], ARRAY['english','mandarin'],
   ARRAY['CA','NV'], ARRAY['San Francisco Bay Area','Sacramento'],
   'San Jose','CA','(408) 555-0178','david@meridianadvisors.example','https://meridianadvisors.example',
   true, true, false, 'featured'::advisor_listing_tier, 4000, 'active'::advisor_listing_status,
   now() - interval '20 days', now() + interval '345 days', now() - interval '25 days', true, 4.7, 8),
  ('Ruth Goldstein', 'Bay Area Benefits Counseling', 'benefits_counselor'::advisor_type,
   'Certified benefits counselor and SHIP volunteer. Helps with Medicare enrollment, Medicare Savings Programs, Medicaid, SNAP, and property-tax relief.',
   ARRAY['SHIP Certified Counselor'], ARRAY['english'],
   ARRAY['CA'], ARRAY['San Francisco Bay Area'],
   'Berkeley','CA','(510) 555-0110','ruth@babenefits.example', NULL,
   true, true, true, 'standard'::advisor_listing_tier, 2400, 'active'::advisor_listing_status,
   now() - interval '60 days', now() + interval '305 days', now() - interval '65 days', true, 5.0, 5),
  ('Marcus Bell, Esq.', 'Bell & Rivera Estate Planning', 'estate_planning_attorney'::advisor_type,
   'Wills, revocable living trusts, powers of attorney, and advance health-care directives. Flat-fee packages; home visits available.',
   ARRAY['J.D.','LL.M. Taxation'], ARRAY['english'],
   ARRAY['CA'], ARRAY['San Francisco Bay Area'],
   'San Francisco','CA','(415) 555-0195','marcus@bellrivera.example','https://bellrivera.example',
   true, false, false, 'featured'::advisor_listing_tier, 4000, 'active'::advisor_listing_status,
   now() - interval '15 days', now() + interval '350 days', now() - interval '18 days', true, 4.8, 6),
  ('Elena Popov, EA', 'Popov Tax Services', 'tax_professional'::advisor_type,
   'Enrolled Agent specialising in retiree tax returns, RMD planning, and IRS notices. Sliding-scale fees for fixed-income households.',
   ARRAY['Enrolled Agent (EA)'], ARRAY['english','russian'],
   ARRAY['CA'], ARRAY['San Francisco Bay Area'],
   'Daly City','CA','(650) 555-0166','elena@popovtax.example', NULL,
   true, true, true, 'standard'::advisor_listing_tier, 2400, 'active'::advisor_listing_status,
   now() - interval '30 days', now() + interval '335 days', now() - interval '33 days', true, 4.6, 4),
  ('Sandra Whitfield', 'Whitfield Care Management', 'geriatric_care_manager'::advisor_type,
   'Aging Life Care Professional. In-home assessments, care planning, and coordination for families managing complex needs from a distance.',
   ARRAY['RN','Aging Life Care Professional'], ARRAY['english'],
   ARRAY['CA'], ARRAY['San Francisco Bay Area'],
   'Walnut Creek','CA','(925) 555-0133','sandra@whitfieldcare.example','https://whitfieldcare.example',
   true, true, false, 'premier'::advisor_listing_tier, 6000, 'active'::advisor_listing_status,
   now() - interval '10 days', now() + interval '355 days', now() - interval '12 days', true, 4.9, 9)
) AS v(full_name, firm_name, advisor_type, bio, credentials, languages, service_states, service_metros,
       city, state, phone, email, website, accepts_new_clients, offers_free_consult, sliding_scale,
       listing_tier, listing_fee_annual, listing_status, listing_started_at, listing_expires_at,
       vetted_at, thrive_verified, avg_rating, total_reviews)
WHERE NOT EXISTS (SELECT 1 FROM trusted_advisors t WHERE t.email = v.email);

-- Sample VITA / TCE sites
INSERT INTO vita_sites
  (site_name, host_org, address, city, state, zip, phone, languages, appointment_required,
   drop_off_available, virtual_available, hours_note, season_start, season_end, program_type, is_active, source)
SELECT * FROM (VALUES
  ('Oakland Public Library — Main', 'United Way Bay Area', '125 14th St', 'Oakland', 'CA', '94612',
   '(510) 555-2100', ARRAY['english','spanish','cantonese'], true, true, false,
   'Tue & Thu 10am–4pm, Sat 10am–2pm during tax season', DATE '2026-01-27', DATE '2026-04-15', 'vita', true, 'manual'),
  ('San Jose Senior Center — TCE', 'AARP Foundation Tax-Aide', '2160 Santa Clara Ave', 'San Jose', 'CA', '95116',
   '(408) 555-2200', ARRAY['english','spanish','vietnamese'], true, false, false,
   'Mon/Wed/Fri 9am–1pm. Priority for taxpayers 60+', DATE '2026-02-01', DATE '2026-04-15', 'tce', true, 'manual'),
  ('Mission District Community Hub', 'MEDA', '2301 Mission St', 'San Francisco', 'CA', '94110',
   '(415) 555-2300', ARRAY['english','spanish'], true, true, true,
   'Appointments and secure drop-off; virtual filing help by phone', DATE '2026-01-27', DATE '2026-04-15', 'vita', true, 'manual'),
  ('GetYourRefund.org (Virtual)', 'Code for America', NULL, NULL, NULL, NULL,
   NULL, ARRAY['english','spanish'], false, false, true,
   'Fully virtual IRS-certified filing help — upload documents from home', DATE '2026-01-27', DATE '2026-10-15', 'vita', true, 'manual')
) AS v(site_name, host_org, address, city, state, zip, phone, languages, appointment_required,
       drop_off_available, virtual_available, hours_note, season_start, season_end, program_type, is_active, source)
WHERE NOT EXISTS (SELECT 1 FROM vita_sites s WHERE s.site_name = v.site_name);
