-- ThriveAtHome — Volunteer Network (Migration 005)
-- Run this in Supabase SQL Editor after 004_billing_constraints.sql

-- ── ENUMS ──────────────────────────────────────────────────────────────────

CREATE TYPE volunteer_status AS ENUM ('pending','background_check','active','inactive','suspended');
CREATE TYPE visit_type AS ENUM ('phone_call','in_person_visit','virtual_event','grocery_help','walking_companion','reading_aloud','tech_help');

-- ── TABLES ─────────────────────────────────────────────────────────────────

CREATE TABLE volunteers (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at            timestamptz DEFAULT now() NOT NULL,
  supabase_auth_id      uuid UNIQUE,
  full_name             text NOT NULL,
  email                 text NOT NULL,
  phone                 text,
  city                  text,
  state                 text,
  languages             text[] DEFAULT '{}',
  availability_days     text[] DEFAULT '{}',
  hours_per_week        text,
  service_types         visit_type[] DEFAULT '{}',
  interests             text[] DEFAULT '{}',
  why_volunteer         text,
  prior_experience      text,
  status                volunteer_status NOT NULL DEFAULT 'pending',
  background_check_id   text,
  background_check_status text,
  total_hours_logged    numeric DEFAULT 0,
  total_seniors_helped  int DEFAULT 0,
  rating_average        numeric,
  notes                 text
);
ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;

CREATE TABLE volunteer_visits (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        timestamptz DEFAULT now() NOT NULL,
  volunteer_id      uuid NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
  member_id         uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  visit_date        date NOT NULL,
  duration_minutes  int NOT NULL,
  visit_type        visit_type NOT NULL,
  volunteer_notes   text,
  volunteer_rating  int CHECK (volunteer_rating BETWEEN 1 AND 5),
  member_rating     int CHECK (member_rating BETWEEN 1 AND 5),
  verified          boolean NOT NULL DEFAULT false
);
ALTER TABLE volunteer_visits ENABLE ROW LEVEL SECURITY;

CREATE TABLE volunteer_matches (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       timestamptz DEFAULT now() NOT NULL,
  member_id        uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  volunteer_id     uuid NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
  match_score      int NOT NULL DEFAULT 0,
  match_reasons    jsonb NOT NULL DEFAULT '[]',
  status           text NOT NULL DEFAULT 'pending',
  matched_at       timestamptz,
  intro_sent_at    timestamptz
);
ALTER TABLE volunteer_matches ENABLE ROW LEVEL SECURITY;
