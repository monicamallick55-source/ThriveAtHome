-- Phase 32: Student Volunteer Portal
-- Adds student_volunteers table, student role enum, and student_visits table

-- Add student role to user_role enum (if not already done)
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'student';

-- Student volunteers table
CREATE TABLE IF NOT EXISTS student_volunteers (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at          timestamptz DEFAULT now() NOT NULL,
  supabase_auth_id    uuid UNIQUE,
  full_name           text NOT NULL,
  email               text NOT NULL,
  university_name     text,
  major               text,
  graduation_year     int,
  interests           text[] DEFAULT '{}',
  languages           text[] DEFAULT '{}',
  total_hours_logged  numeric DEFAULT 0,
  status              text NOT NULL DEFAULT 'pending'
);
ALTER TABLE student_volunteers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_own_record" ON student_volunteers FOR ALL
USING (auth.uid() = supabase_auth_id);

-- Dedicated student visits table (students visit community members generally, not tracked members)
CREATE TABLE IF NOT EXISTS student_visits (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at          timestamptz DEFAULT now() NOT NULL,
  student_id          uuid NOT NULL REFERENCES student_volunteers(id) ON DELETE CASCADE,
  visit_date          date NOT NULL,
  duration_minutes    int NOT NULL,
  visit_type          text NOT NULL DEFAULT 'phone_call',
  reflection          text NOT NULL,
  notes               text,
  verified            boolean NOT NULL DEFAULT false
);
ALTER TABLE student_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_own_visits" ON student_visits FOR ALL
USING (EXISTS (
  SELECT 1 FROM student_volunteers sv
  WHERE sv.id = student_visits.student_id AND sv.supabase_auth_id = auth.uid()
));
