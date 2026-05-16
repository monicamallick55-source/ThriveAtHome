-- ThriveAtHome — Initial Schema (Migration 001)
-- Run this in Supabase SQL Editor BEFORE running 002_audit.sql
-- All enums first, then tables, then indexes, then RLS policies.

-- ── ENUMS ──────────────────────────────────────────────────────────────────

CREATE TYPE plan_tier          AS ENUM ('basics','connect','complete','premier');
CREATE TYPE member_status      AS ENUM ('active','inactive','paused');
CREATE TYPE user_role          AS ENUM ('family','navigator','admin');
CREATE TYPE call_status        AS ENUM ('scheduled','in_progress','completed','missed','failed');
CREATE TYPE call_type          AS ENUM ('check_in','concierge','navigator');
CREATE TYPE alert_type         AS ENUM ('missed_call','mood_drop','medication_miss','wellness_drift','fall','crisis','emergency');
CREATE TYPE alert_severity     AS ENUM ('informational','concern','urgent','emergency');
CREATE TYPE task_priority      AS ENUM ('low','medium','high','critical');
CREATE TYPE notif_type         AS ENUM ('new_alert','call_completed','call_summary_ready','medication_reminder','system_message','service_booking_update','grief_support_assigned','family_nudge','celebration_upcoming','volunteer_matched');
CREATE TYPE notif_severity     AS ENUM ('info','concern','urgent','emergency');
CREATE TYPE notif_channel      AS ENUM ('realtime','sms','email');
CREATE TYPE notif_status       AS ENUM ('sent','failed','stub');
CREATE TYPE check_in_frequency AS ENUM ('daily','every_other_day','weekly');

-- ── TABLES ─────────────────────────────────────────────────────────────────

CREATE TABLE members (
  id                        uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at                timestamptz DEFAULT now() NOT NULL,
  full_name                 text NOT NULL,
  preferred_name            text NOT NULL,
  date_of_birth             date NOT NULL,
  phone_number              text NOT NULL,
  preferred_language        text NOT NULL DEFAULT 'english',
  preferred_call_time       text,
  timezone                  text NOT NULL DEFAULT 'America/New_York',
  check_in_frequency        check_in_frequency NOT NULL DEFAULT 'daily',
  topics_enjoy              text[] DEFAULT '{}',
  topics_avoid              text,
  lives_alone               boolean,
  mobility_devices          text[] DEFAULT '{}',
  health_conditions         text,
  medications               text,
  plan_tier                 plan_tier NOT NULL DEFAULT 'basics',
  status                    member_status NOT NULL DEFAULT 'active',
  address                   text,
  emergency_contact_1_name  text,
  emergency_contact_1_phone text,
  emergency_contact_1_rel   text,
  emergency_contact_2_name  text,
  emergency_contact_2_phone text,
  emergency_contact_2_rel   text,
  doctor_name               text,
  doctor_phone              text
);
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

CREATE TABLE family_members (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        timestamptz DEFAULT now() NOT NULL,
  member_id         uuid REFERENCES members(id) ON DELETE CASCADE,
  supabase_auth_id  uuid NOT NULL UNIQUE,
  full_name         text NOT NULL,
  email             text NOT NULL,
  phone             text,
  relationship      text,
  notification_prefs jsonb NOT NULL DEFAULT '{"sms":true,"email":true,"realtime":true}',
  alert_level       text NOT NULL DEFAULT 'all',
  role              user_role NOT NULL DEFAULT 'family',
  last_login_at     timestamptz
);
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE check_in_calls (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       timestamptz DEFAULT now() NOT NULL,
  member_id        uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  call_type        call_type NOT NULL DEFAULT 'check_in',
  scheduled_at     timestamptz,
  started_at       timestamptz,
  ended_at         timestamptz,
  duration_seconds int,
  status           call_status NOT NULL DEFAULT 'scheduled',
  mood_score       int CHECK (mood_score BETWEEN 1 AND 10),
  energy_score     int CHECK (energy_score BETWEEN 1 AND 10),
  pain_score       int CHECK (pain_score BETWEEN 1 AND 10),
  medication_taken boolean,
  transcript       text,
  ai_summary       text,
  alert_flags      jsonb NOT NULL DEFAULT '[]',
  recording_url    text,
  retell_call_id   text
);
ALTER TABLE check_in_calls ENABLE ROW LEVEL SECURITY;

CREATE TABLE alerts (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      timestamptz DEFAULT now() NOT NULL,
  member_id       uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  alert_type      alert_type NOT NULL,
  severity        alert_severity NOT NULL,
  message         text NOT NULL,
  acknowledged    boolean NOT NULL DEFAULT false,
  acknowledged_by uuid REFERENCES family_members(id) ON DELETE SET NULL,
  acknowledged_at timestamptz
);
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE TABLE care_navigators (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       timestamptz DEFAULT now() NOT NULL,
  supabase_auth_id uuid UNIQUE,
  full_name        text NOT NULL,
  email            text NOT NULL,
  phone            text,
  certifications   text[] DEFAULT '{}',
  caseload_limit   int NOT NULL DEFAULT 150,
  is_active        boolean NOT NULL DEFAULT true
);
ALTER TABLE care_navigators ENABLE ROW LEVEL SECURITY;

CREATE TABLE navigator_assignments (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   timestamptz DEFAULT now() NOT NULL,
  member_id    uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  navigator_id uuid NOT NULL REFERENCES care_navigators(id) ON DELETE CASCADE,
  assigned_at  timestamptz NOT NULL DEFAULT now(),
  is_primary   boolean NOT NULL DEFAULT true,
  UNIQUE(member_id, navigator_id)
);
ALTER TABLE navigator_assignments ENABLE ROW LEVEL SECURITY;

CREATE TABLE navigator_tasks (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   timestamptz DEFAULT now() NOT NULL,
  member_id    uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  navigator_id uuid REFERENCES care_navigators(id) ON DELETE SET NULL,
  task_type    text NOT NULL,
  description  text NOT NULL,
  priority     task_priority NOT NULL DEFAULT 'medium',
  due_by       timestamptz,
  completed    boolean NOT NULL DEFAULT false,
  completed_at timestamptz
);
ALTER TABLE navigator_tasks ENABLE ROW LEVEL SECURITY;

CREATE TABLE navigator_notes (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   timestamptz DEFAULT now() NOT NULL,
  member_id    uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  navigator_id uuid NOT NULL REFERENCES care_navigators(id) ON DELETE CASCADE,
  note         text NOT NULL
);
ALTER TABLE navigator_notes ENABLE ROW LEVEL SECURITY;

CREATE TABLE subscriptions (
  id                     uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at             timestamptz DEFAULT now() NOT NULL,
  member_id              uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  stripe_customer_id     text,
  stripe_subscription_id text,
  plan_tier              plan_tier NOT NULL DEFAULT 'basics',
  status                 text NOT NULL DEFAULT 'active',
  current_period_start   timestamptz,
  current_period_end     timestamptz,
  monthly_amount_cents   int
);
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE TABLE realtime_notifications (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  member_id  uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  type       notif_type NOT NULL,
  title      text NOT NULL,
  body       text NOT NULL,
  severity   notif_severity NOT NULL DEFAULT 'info',
  call_id    uuid REFERENCES check_in_calls(id) ON DELETE SET NULL,
  alert_id   uuid REFERENCES alerts(id) ON DELETE SET NULL,
  read       boolean NOT NULL DEFAULT false,
  read_at    timestamptz
);
ALTER TABLE realtime_notifications ENABLE ROW LEVEL SECURITY;

CREATE TABLE notification_log (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       timestamptz DEFAULT now() NOT NULL,
  member_id        uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  family_member_id uuid REFERENCES family_members(id) ON DELETE SET NULL,
  channel          notif_channel NOT NULL,
  status           notif_status NOT NULL,
  message_preview  text,
  error_message    text
);
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

CREATE TABLE emergency_log (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       timestamptz DEFAULT now() NOT NULL,
  member_id        uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  call_id          uuid REFERENCES check_in_calls(id) ON DELETE SET NULL,
  alert_type       text NOT NULL,
  triggered_phrase text,
  logged_at        timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE emergency_log ENABLE ROW LEVEL SECURITY;

CREATE TABLE medication_schedules (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   timestamptz DEFAULT now() NOT NULL,
  member_id    uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  reminder_time time NOT NULL,
  days_of_week  text[] NOT NULL DEFAULT
    '{"monday","tuesday","wednesday","thursday","friday","saturday","sunday"}',
  label        text NOT NULL DEFAULT 'Medications',
  is_active    boolean NOT NULL DEFAULT true
);
ALTER TABLE medication_schedules ENABLE ROW LEVEL SECURITY;

CREATE TABLE family_task_items (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   timestamptz DEFAULT now() NOT NULL,
  member_id    uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  created_by   uuid NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  assigned_to  uuid REFERENCES family_members(id) ON DELETE SET NULL,
  title        text NOT NULL,
  task_type    text NOT NULL DEFAULT 'other',
  due_date     date,
  completed    boolean NOT NULL DEFAULT false,
  completed_at timestamptz
);
ALTER TABLE family_task_items ENABLE ROW LEVEL SECURITY;

CREATE TABLE family_messages (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  member_id  uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  sender_id  uuid NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  body       text NOT NULL
);
ALTER TABLE family_messages ENABLE ROW LEVEL SECURITY;

CREATE TABLE document_vault_items (
  id                   uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at           timestamptz DEFAULT now() NOT NULL,
  member_id            uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  uploaded_by          uuid NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  file_name            text NOT NULL,
  file_type            text NOT NULL,
  description          text,
  storage_path         text NOT NULL,
  is_advance_directive boolean NOT NULL DEFAULT false,
  last_reviewed_at     timestamptz
);
ALTER TABLE document_vault_items ENABLE ROW LEVEL SECURITY;

CREATE TABLE audit_log (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at    timestamptz DEFAULT now() NOT NULL,
  user_id       uuid,
  action        text NOT NULL,
  resource_type text NOT NULL,
  resource_id   text
);
-- No user-level RLS on audit_log — written by service role only

-- ── INDEXES ────────────────────────────────────────────────────────────────

CREATE INDEX idx_calls_member_scheduled  ON check_in_calls(member_id, scheduled_at DESC);
CREATE INDEX idx_alerts_member_unacked   ON alerts(member_id, acknowledged) WHERE acknowledged = false;
CREATE INDEX idx_family_auth_id          ON family_members(supabase_auth_id);
CREATE INDEX idx_nav_assignments_nav     ON navigator_assignments(navigator_id);
CREATE INDEX idx_notifs_member_unread    ON realtime_notifications(member_id, read, created_at DESC);
CREATE INDEX idx_tasks_member_incomplete ON family_task_items(member_id, completed) WHERE completed = false;
CREATE INDEX idx_messages_member         ON family_messages(member_id, created_at ASC);

-- ── RLS POLICIES ───────────────────────────────────────────────────────────

-- MEMBERS
CREATE POLICY "family_select_own_member" ON members FOR SELECT
USING (EXISTS (
  SELECT 1 FROM family_members fm
  WHERE fm.member_id = members.id AND fm.supabase_auth_id = auth.uid()
));

CREATE POLICY "navigator_select_assigned_members" ON members FOR SELECT
USING (EXISTS (
  SELECT 1 FROM navigator_assignments na
  JOIN care_navigators cn ON cn.id = na.navigator_id
  WHERE na.member_id = members.id AND cn.supabase_auth_id = auth.uid()
));

-- FAMILY_MEMBERS
CREATE POLICY "family_select_own_row" ON family_members FOR SELECT
USING (supabase_auth_id = auth.uid());

CREATE POLICY "family_select_linked_members" ON family_members FOR SELECT
USING (EXISTS (
  SELECT 1 FROM family_members fm
  WHERE fm.member_id = family_members.member_id AND fm.supabase_auth_id = auth.uid()
));

-- CHECK_IN_CALLS
CREATE POLICY "family_select_own_calls" ON check_in_calls FOR SELECT
USING (EXISTS (
  SELECT 1 FROM family_members fm
  WHERE fm.member_id = check_in_calls.member_id AND fm.supabase_auth_id = auth.uid()
));

-- ALERTS
CREATE POLICY "family_select_own_alerts" ON alerts FOR SELECT
USING (EXISTS (
  SELECT 1 FROM family_members fm
  WHERE fm.member_id = alerts.member_id AND fm.supabase_auth_id = auth.uid()
));

CREATE POLICY "family_update_own_alerts" ON alerts FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM family_members fm
  WHERE fm.member_id = alerts.member_id AND fm.supabase_auth_id = auth.uid()
));

-- REALTIME_NOTIFICATIONS
CREATE POLICY "family_select_own_notifications" ON realtime_notifications FOR SELECT
USING (EXISTS (
  SELECT 1 FROM family_members fm
  WHERE fm.member_id = realtime_notifications.member_id AND fm.supabase_auth_id = auth.uid()
));

CREATE POLICY "family_update_own_notifications" ON realtime_notifications FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM family_members fm
  WHERE fm.member_id = realtime_notifications.member_id AND fm.supabase_auth_id = auth.uid()
));

-- FAMILY_TASK_ITEMS
CREATE POLICY "family_all_own_tasks" ON family_task_items FOR ALL
USING (EXISTS (
  SELECT 1 FROM family_members fm
  WHERE fm.member_id = family_task_items.member_id AND fm.supabase_auth_id = auth.uid()
));

-- FAMILY_MESSAGES
CREATE POLICY "family_all_own_messages" ON family_messages FOR ALL
USING (EXISTS (
  SELECT 1 FROM family_members fm
  WHERE fm.member_id = family_messages.member_id AND fm.supabase_auth_id = auth.uid()
));

-- DOCUMENT_VAULT_ITEMS
CREATE POLICY "family_all_own_documents" ON document_vault_items FOR ALL
USING (EXISTS (
  SELECT 1 FROM family_members fm
  WHERE fm.member_id = document_vault_items.member_id AND fm.supabase_auth_id = auth.uid()
));

-- NAVIGATOR TABLES
CREATE POLICY "navigator_select_assignments" ON navigator_assignments FOR SELECT
USING (EXISTS (
  SELECT 1 FROM care_navigators cn
  WHERE cn.id = navigator_assignments.navigator_id AND cn.supabase_auth_id = auth.uid()
));

CREATE POLICY "navigator_all_tasks" ON navigator_tasks FOR ALL
USING (EXISTS (
  SELECT 1 FROM care_navigators cn
  WHERE cn.id = navigator_tasks.navigator_id AND cn.supabase_auth_id = auth.uid()
));

CREATE POLICY "navigator_all_notes" ON navigator_notes FOR ALL
USING (EXISTS (
  SELECT 1 FROM care_navigators cn
  WHERE cn.id = navigator_notes.navigator_id AND cn.supabase_auth_id = auth.uid()
));
