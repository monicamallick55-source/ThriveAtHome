-- M22: Device & Smart Home Integration Layer
-- Phases 87-92: Companion Device, Voice Assistants, Smart Home, Wearables,
-- Fall Detection + No-Motion Anomaly, HL7 FHIR / EHR connectors.
--
-- All external integrations (Alexa, Google Assistant, Fitbit, Garmin, Apple HealthKit,
-- Epic, Cerner) run through stub providers until real credentials are configured.
-- These tables store the platform-side state: what is linked, last sync, signals, and
-- the fall / anomaly protocol audit trail.

-- ─── Phase 87: Companion Device + linked device registry ──────────────────────
CREATE TABLE IF NOT EXISTS member_devices (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        timestamptz DEFAULT now() NOT NULL,
  member_id         uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  device_category   text NOT NULL DEFAULT 'companion_tablet',
  -- companion_tablet, voice_assistant, smart_home, wearable
  device_type       text NOT NULL,
  -- thrive_tablet, alexa, google_assistant, echo_show, nest_hub, ring_doorbell,
  -- adt_hub, philips_hue, grandpad, motion_sensor, apple_watch, fitbit, garmin
  device_name       text,
  provider          text,
  -- amazon, google, ring, adt, signify, grandpad, apple, fitbit, garmin, thriveathome
  status            text NOT NULL DEFAULT 'pending',
  -- pending, active, disconnected, error
  billing_option    text NOT NULL DEFAULT 'none',
  -- none, one_time_99, monthly_15, free_with_commitment
  external_account_id text,
  last_sync_at      timestamptz,
  settings          jsonb NOT NULL DEFAULT '{}',
  notes             text
);
ALTER TABLE member_devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_all_own_member_devices" ON member_devices FOR ALL
  USING (EXISTS (SELECT 1 FROM family_members fm
    WHERE fm.member_id = member_devices.member_id
    AND fm.supabase_auth_id = auth.uid()));

-- ─── Phase 89: Smart-home + voice signals (motion, door, button, voice command) ─
CREATE TABLE IF NOT EXISTS device_signals (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   timestamptz DEFAULT now() NOT NULL,
  member_id    uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  device_id    uuid REFERENCES member_devices(id) ON DELETE SET NULL,
  signal_type  text NOT NULL,
  -- motion, no_motion, door_open, door_close, button_press, voice_command,
  -- light_on, light_off, alarm_armed, alarm_disarmed
  signal_value jsonb NOT NULL DEFAULT '{}',
  occurred_at  timestamptz NOT NULL DEFAULT now(),
  processed    boolean NOT NULL DEFAULT false
);
ALTER TABLE device_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_read_own_device_signals" ON device_signals FOR SELECT
  USING (EXISTS (SELECT 1 FROM family_members fm
    WHERE fm.member_id = device_signals.member_id
    AND fm.supabase_auth_id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_device_signals_member_time
  ON device_signals (member_id, occurred_at DESC);

-- ─── Phase 90: Wearable connections + daily readings ──────────────────────────
CREATE TABLE IF NOT EXISTS wearable_connections (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       timestamptz DEFAULT now() NOT NULL,
  member_id        uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  platform         text NOT NULL,
  -- apple_healthkit, google_fit, fitbit, garmin
  external_user_id text,
  scopes           text[] DEFAULT '{}',
  status           text NOT NULL DEFAULT 'pending',
  -- pending, active, revoked, error
  connected_at     timestamptz,
  last_sync_at     timestamptz,
  UNIQUE(member_id, platform)
);
ALTER TABLE wearable_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_all_own_wearable_connections" ON wearable_connections FOR ALL
  USING (EXISTS (SELECT 1 FROM family_members fm
    WHERE fm.member_id = wearable_connections.member_id
    AND fm.supabase_auth_id = auth.uid()));

CREATE TABLE IF NOT EXISTS wearable_readings (
  id                 uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at         timestamptz DEFAULT now() NOT NULL,
  member_id          uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  connection_id      uuid REFERENCES wearable_connections(id) ON DELETE SET NULL,
  reading_date       date NOT NULL,
  steps              int,
  resting_heart_rate int,
  sleep_hours        numeric,
  active_minutes     int,
  fall_detected      boolean NOT NULL DEFAULT false,
  source_platform    text,
  UNIQUE(member_id, reading_date, source_platform)
);
ALTER TABLE wearable_readings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_read_own_wearable_readings" ON wearable_readings FOR SELECT
  USING (EXISTS (SELECT 1 FROM family_members fm
    WHERE fm.member_id = wearable_readings.member_id
    AND fm.supabase_auth_id = auth.uid()));

-- ─── Phase 91: Fall event audit trail (feeds the emergency protocol) ──────────
CREATE TABLE IF NOT EXISTS fall_events (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        timestamptz DEFAULT now() NOT NULL,
  member_id         uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  device_id         uuid REFERENCES member_devices(id) ON DELETE SET NULL,
  source            text NOT NULL DEFAULT 'wearable',
  -- wearable, smart_home_no_motion, manual, voice_assistant
  confidence        numeric,
  detected_at       timestamptz NOT NULL DEFAULT now(),
  resolved          boolean NOT NULL DEFAULT false,
  resolved_at       timestamptz,
  resolution_note   text,
  alert_id          uuid REFERENCES alerts(id) ON DELETE SET NULL,
  navigator_task_id uuid REFERENCES navigator_tasks(id) ON DELETE SET NULL,
  raw               jsonb NOT NULL DEFAULT '{}'
);
ALTER TABLE fall_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_read_own_fall_events" ON fall_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM family_members fm
    WHERE fm.member_id = fall_events.member_id
    AND fm.supabase_auth_id = auth.uid()));

-- ─── Phase 92: HL7 FHIR / EHR connectors ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS ehr_connections (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        timestamptz DEFAULT now() NOT NULL,
  member_id         uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  ehr_system        text NOT NULL DEFAULT 'generic_fhir',
  -- epic, cerner, athenahealth, generic_fhir
  fhir_base_url     text,
  patient_fhir_id   text,
  status            text NOT NULL DEFAULT 'pending',
  -- pending, active, revoked, error
  consent_granted_at timestamptz,
  last_export_at    timestamptz,
  scopes            text[] DEFAULT '{}',
  UNIQUE(member_id, ehr_system)
);
ALTER TABLE ehr_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_all_own_ehr_connections" ON ehr_connections FOR ALL
  USING (EXISTS (SELECT 1 FROM family_members fm
    WHERE fm.member_id = ehr_connections.member_id
    AND fm.supabase_auth_id = auth.uid()));

CREATE TABLE IF NOT EXISTS fhir_export_log (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      timestamptz DEFAULT now() NOT NULL,
  member_id       uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  connection_id   uuid REFERENCES ehr_connections(id) ON DELETE SET NULL,
  resource_type   text NOT NULL,
  -- Observation, Condition, Encounter
  resource_count  int NOT NULL DEFAULT 0,
  export_status   text NOT NULL DEFAULT 'stub',
  -- stub, success, error
  payload_summary text
);
ALTER TABLE fhir_export_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_read_own_fhir_export_log" ON fhir_export_log FOR SELECT
  USING (EXISTS (SELECT 1 FROM family_members fm
    WHERE fm.member_id = fhir_export_log.member_id
    AND fm.supabase_auth_id = auth.uid()));

-- ─── Member-level consent flag for device data collection ─────────────────────
ALTER TABLE members ADD COLUMN IF NOT EXISTS device_integration_consent boolean NOT NULL DEFAULT false;
