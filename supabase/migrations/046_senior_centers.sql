-- Migration 046: Senior Center Portal
-- Adds senior_centers, center_dropins, center_activities, activity_registrations, room_bookings, congregate_meals
-- Adds senior_center_admin role and senior_center_id FK on family_members

-- Add senior_center_admin to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'senior_center_admin';

-- Senior Centers table
CREATE TABLE IF NOT EXISTS senior_centers (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       timestamptz DEFAULT now() NOT NULL,
  center_name      text NOT NULL,
  address          text NOT NULL,
  city             text NOT NULL,
  state            text NOT NULL,
  zip              text,
  phone            text,
  email            text,
  operating_hours  text NOT NULL DEFAULT 'Monday–Friday 8am–5pm',
  capacity         int NOT NULL DEFAULT 100,
  is_active        boolean NOT NULL DEFAULT true
);
ALTER TABLE senior_centers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "senior_center_admin_own" ON senior_centers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.supabase_auth_id = auth.uid()
      AND fm.senior_center_id = senior_centers.id
    )
  );
CREATE POLICY "admin_all_senior_centers" ON senior_centers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.supabase_auth_id = auth.uid()
      AND fm.role = 'admin'
    )
  );
CREATE POLICY "authenticated_read_senior_centers" ON senior_centers FOR SELECT TO authenticated USING (true);

-- Add senior_center_id FK to family_members
ALTER TABLE family_members
  ADD COLUMN IF NOT EXISTS senior_center_id uuid REFERENCES senior_centers(id) ON DELETE SET NULL;

-- Drop-in attendance tracking
CREATE TABLE IF NOT EXISTS center_dropins (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      timestamptz DEFAULT now() NOT NULL,
  center_id       uuid NOT NULL REFERENCES senior_centers(id) ON DELETE CASCADE,
  member_id       uuid REFERENCES members(id) ON DELETE SET NULL,
  visitor_name    text NOT NULL,
  visitor_type    text NOT NULL DEFAULT 'member',
  -- member, guest, volunteer, staff
  check_in_at     timestamptz NOT NULL DEFAULT now(),
  check_out_at    timestamptz,
  notes           text
);
ALTER TABLE center_dropins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "center_admin_own_dropins" ON center_dropins FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.supabase_auth_id = auth.uid()
      AND (fm.senior_center_id = center_dropins.center_id OR fm.role = 'admin')
    )
  );

-- Activity calendar
CREATE TABLE IF NOT EXISTS center_activities (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       timestamptz DEFAULT now() NOT NULL,
  center_id        uuid NOT NULL REFERENCES senior_centers(id) ON DELETE CASCADE,
  title            text NOT NULL,
  description      text,
  activity_type    text NOT NULL DEFAULT 'class',
  -- class, social, exercise, arts, educational, health, trip, volunteer, other
  room             text,
  instructor_name  text,
  scheduled_at     timestamptz NOT NULL,
  duration_minutes int NOT NULL DEFAULT 60,
  max_capacity     int,
  registration_count int NOT NULL DEFAULT 0,
  is_recurring     boolean NOT NULL DEFAULT false,
  recurrence_rule  text,
  status           text NOT NULL DEFAULT 'scheduled'
  -- scheduled, in_progress, completed, cancelled
);
ALTER TABLE center_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "center_admin_activities" ON center_activities FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.supabase_auth_id = auth.uid()
      AND (fm.senior_center_id = center_activities.center_id OR fm.role = 'admin')
    )
  );
CREATE POLICY "authenticated_read_center_activities" ON center_activities FOR SELECT TO authenticated USING (true);

-- Activity registrations
CREATE TABLE IF NOT EXISTS activity_registrations (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at    timestamptz DEFAULT now() NOT NULL,
  activity_id   uuid NOT NULL REFERENCES center_activities(id) ON DELETE CASCADE,
  center_id     uuid NOT NULL REFERENCES senior_centers(id) ON DELETE CASCADE,
  member_id     uuid REFERENCES members(id) ON DELETE SET NULL,
  visitor_name  text NOT NULL,
  registered_at timestamptz NOT NULL DEFAULT now(),
  attended      boolean NOT NULL DEFAULT false,
  UNIQUE(activity_id, visitor_name)
);
ALTER TABLE activity_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "center_admin_registrations" ON activity_registrations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.supabase_auth_id = auth.uid()
      AND (fm.senior_center_id = activity_registrations.center_id OR fm.role = 'admin')
    )
  );

-- Room bookings
CREATE TABLE IF NOT EXISTS room_bookings (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at    timestamptz DEFAULT now() NOT NULL,
  center_id     uuid NOT NULL REFERENCES senior_centers(id) ON DELETE CASCADE,
  room          text NOT NULL,
  booking_title text NOT NULL,
  booked_by     text,
  start_time    timestamptz NOT NULL,
  end_time      timestamptz NOT NULL,
  notes         text,
  status        text NOT NULL DEFAULT 'confirmed'
  -- confirmed, cancelled
);
ALTER TABLE room_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "center_admin_room_bookings" ON room_bookings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.supabase_auth_id = auth.uid()
      AND (fm.senior_center_id = room_bookings.center_id OR fm.role = 'admin')
    )
  );

-- Congregate meal tracking (federal OAA Title III-C1/C2 reporting)
CREATE TABLE IF NOT EXISTS congregate_meals (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       timestamptz DEFAULT now() NOT NULL,
  center_id        uuid NOT NULL REFERENCES senior_centers(id) ON DELETE CASCADE,
  meal_date        date NOT NULL,
  meal_type        text NOT NULL DEFAULT 'lunch',
  -- breakfast, lunch, dinner, snack
  attendee_count   int NOT NULL DEFAULT 0,
  menu_description text,
  notes            text,
  UNIQUE(center_id, meal_date, meal_type)
);
ALTER TABLE congregate_meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "center_admin_meals" ON congregate_meals FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.supabase_auth_id = auth.uid()
      AND (fm.senior_center_id = congregate_meals.center_id OR fm.role = 'admin')
    )
  );

-- Seed: San Francisco Senior Center
INSERT INTO senior_centers (center_name, address, city, state, zip, phone, operating_hours, capacity)
VALUES (
  'San Francisco Senior Center',
  '481 O''Farrell Street',
  'San Francisco',
  'CA',
  '94102',
  '(415) 474-0600',
  'Monday–Friday 8:00 AM – 5:00 PM',
  150
);
