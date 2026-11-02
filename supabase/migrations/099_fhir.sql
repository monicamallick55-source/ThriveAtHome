-- Migration 099: FHIR health data + comparison page config (G5.9)

-- FHIR connection per member (one per health system)
CREATE TABLE IF NOT EXISTS fhir_connections (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      timestamptz DEFAULT now() NOT NULL,
  member_id       uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  fhir_server_url text NOT NULL,
  patient_id      text NOT NULL,
  access_token    text,
  refresh_token   text,
  token_expires_at timestamptz,
  last_synced_at  timestamptz,
  status          text NOT NULL DEFAULT 'active', -- 'active'|'error'|'revoked'
  error_message   text,
  UNIQUE(member_id, fhir_server_url)
);
CREATE INDEX IF NOT EXISTS idx_fhir_connections_member ON fhir_connections (member_id);

-- Cached FHIR resources (conditions, medications, observations)
CREATE TABLE IF NOT EXISTS fhir_resources (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      timestamptz DEFAULT now() NOT NULL,
  connection_id   uuid NOT NULL REFERENCES fhir_connections(id) ON DELETE CASCADE,
  member_id       uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  resource_type   text NOT NULL, -- 'Condition'|'MedicationRequest'|'Observation'|'AllergyIntolerance'
  resource_id     text NOT NULL, -- FHIR resource id
  resource_data   jsonb NOT NULL DEFAULT '{}',
  recorded_at     timestamptz,
  UNIQUE(connection_id, resource_type, resource_id)
);
CREATE INDEX IF NOT EXISTS idx_fhir_resources_member ON fhir_resources (member_id, resource_type);

-- Plan comparison config (static, managed by staff)
CREATE TABLE IF NOT EXISTS plan_comparison_features (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  feature     text NOT NULL,
  category    text NOT NULL DEFAULT 'general',
  basic       text NOT NULL DEFAULT '',
  complete    text NOT NULL DEFAULT '',
  premier     text NOT NULL DEFAULT '',
  sort_order  int NOT NULL DEFAULT 0
);

INSERT INTO plan_comparison_features (feature, category, basic, complete, premier, sort_order) VALUES
('Monthly price',          'pricing',    '$39/mo',           '$79/mo',              '$199/mo',                  1),
('Annual price',           'pricing',    '$421/yr',          '$853/yr',             '$2,149/yr',                2),
('Aria AI check-in calls', 'ai',         '3x/week',          'Daily',               'Daily + on-demand',        3),
('Navigator minutes/month','navigator',  '30 min',           '60 min',              '180 min',                  4),
('Family dashboard',       'family',     '✓',                '✓',                   '✓',                        5),
('Family SMS summaries',   'family',     'Weekly',           'Daily',               'Daily',                    6),
('Interest circles',       'community',  '✓',                '✓',                   '✓',                        7),
('Local chapter events',   'community',  '✓',                '✓',                   '✓ Priority RSVP',          8),
('Life transition support','care',       'Resources only',   'Navigator-guided',    'Dedicated navigator',      9),
('Birthday arc',           'care',       '✓',                '✓',                   '✓ + milestone concierge', 10),
('Ride coordination',      'care',       'Self-book',        '✓ Navigator-assisted','✓ Full concierge',        11),
('Medication reminders',   'care',       '✓',                '✓',                   '✓',                       12),
('FHIR health sync',       'health',     '—',                '✓',                   '✓',                       13),
('Fraud monitoring alerts','safety',     '✓',                '✓',                   '✓ + call review',         14),
('Emergency contacts',     'safety',     '✓',                '✓',                   '✓',                       15),
('Volunteer companion',    'community',  '—',                '✓',                   '✓ Priority match',        16)
ON CONFLICT DO NOTHING;
