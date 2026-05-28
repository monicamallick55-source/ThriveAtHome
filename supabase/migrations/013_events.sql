-- Phase 35: Virtual Events Platform
-- Creates platform-wide events and RSVPs tables

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_format') THEN
    CREATE TYPE event_format AS ENUM ('phone_only','video_or_phone','in_person');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_status') THEN
    CREATE TYPE event_status AS ENUM ('upcoming','live','completed','cancelled');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS events (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       timestamptz DEFAULT now() NOT NULL,
  title            text NOT NULL,
  description      text,
  event_type       text NOT NULL DEFAULT 'general',
  host_name        text,
  event_date       date NOT NULL,
  event_time       time NOT NULL,
  timezone         text NOT NULL DEFAULT 'America/New_York',
  duration_minutes int NOT NULL DEFAULT 60,
  format           event_format NOT NULL DEFAULT 'phone_only',
  dial_in_number   text,
  dial_in_code     text,
  video_link       text,
  location_address text,
  max_capacity     int,
  is_recurring     boolean NOT NULL DEFAULT false,
  recurrence_pattern text,
  status           event_status NOT NULL DEFAULT 'upcoming',
  rsvp_count       int NOT NULL DEFAULT 0
);
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_can_read_events" ON events FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_nav_can_manage_events" ON events FOR ALL
  USING (EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.supabase_auth_id = auth.uid()
    AND fm.role IN ('admin','navigator')
  ));

CREATE TABLE IF NOT EXISTS event_rsvps (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  event_id   uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  member_id  uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  rsvp_date  timestamptz NOT NULL DEFAULT now(),
  attended   boolean NOT NULL DEFAULT false,
  UNIQUE(event_id, member_id)
);
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_all_own_event_rsvps" ON event_rsvps FOR ALL
  USING (EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.member_id = event_rsvps.member_id
    AND fm.supabase_auth_id = auth.uid()
  ));
CREATE POLICY "admin_nav_can_read_event_rsvps" ON event_rsvps FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.supabase_auth_id = auth.uid()
    AND fm.role IN ('admin','navigator')
  ));
