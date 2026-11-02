-- Migration 100: Volunteer Ecosystem (G5.10)

-- Volunteer profiles (linked to family_members or standalone)
CREATE TABLE IF NOT EXISTS volunteers (
  id                        uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at                timestamptz DEFAULT now() NOT NULL,
  family_member_id          uuid REFERENCES family_members(id) ON DELETE SET NULL,
  full_name                 text NOT NULL,
  email                     text,
  phone                     text,
  metro_area_id             uuid REFERENCES metro_areas(id) ON DELETE SET NULL,
  state                     text,
  zip_code                  text,
  skills                    text[] NOT NULL DEFAULT '{}',
  languages                 text[] NOT NULL DEFAULT '{}',
  availability_days         text[] NOT NULL DEFAULT '{}',
  background_check_verified boolean NOT NULL DEFAULT false,
  background_check_date     date,
  training_completed        boolean NOT NULL DEFAULT false,
  training_date             date,
  status                    text NOT NULL DEFAULT 'pending', -- 'pending'|'active'|'inactive'|'suspended'
  active_assignment_count   int NOT NULL DEFAULT 0,
  total_hours               numeric(8,2) NOT NULL DEFAULT 0,
  notes                     text
);
CREATE INDEX IF NOT EXISTS idx_volunteers_metro ON volunteers (metro_area_id, status);
CREATE INDEX IF NOT EXISTS idx_volunteers_status ON volunteers (status);

-- Volunteer assignments (volunteer ↔ member)
CREATE TABLE IF NOT EXISTS volunteer_assignments (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at     timestamptz DEFAULT now() NOT NULL,
  volunteer_id   uuid NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
  member_id      uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  opportunity_id uuid REFERENCES volunteer_opportunities(id) ON DELETE SET NULL,
  status         text NOT NULL DEFAULT 'active', -- 'active'|'completed'|'cancelled'
  started_at     timestamptz NOT NULL DEFAULT now(),
  ended_at       timestamptz,
  notes          text
);
CREATE INDEX IF NOT EXISTS idx_vol_assignments_volunteer ON volunteer_assignments (volunteer_id, status);
CREATE INDEX IF NOT EXISTS idx_vol_assignments_member ON volunteer_assignments (member_id, status);

-- Volunteer hours log
CREATE TABLE IF NOT EXISTS volunteer_hours (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at     timestamptz DEFAULT now() NOT NULL,
  volunteer_id   uuid NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
  assignment_id  uuid REFERENCES volunteer_assignments(id) ON DELETE SET NULL,
  member_id      uuid REFERENCES members(id) ON DELETE SET NULL,
  hours          numeric(5,2) NOT NULL CHECK (hours > 0),
  activity_date  date NOT NULL,
  description    text,
  verified       boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_vol_hours_volunteer ON volunteer_hours (volunteer_id, activity_date DESC);

-- Keep active_assignment_count current
CREATE OR REPLACE FUNCTION update_volunteer_assignment_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    UPDATE volunteers SET active_assignment_count = active_assignment_count + 1 WHERE id = NEW.volunteer_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'active' AND NEW.status != 'active' THEN
    UPDATE volunteers SET active_assignment_count = GREATEST(active_assignment_count - 1, 0) WHERE id = NEW.volunteer_id;
  END IF;
  RETURN NULL;
END;
$$;
DROP TRIGGER IF EXISTS trg_vol_assignment_count ON volunteer_assignments;
CREATE TRIGGER trg_vol_assignment_count
  AFTER INSERT OR UPDATE OF status ON volunteer_assignments
  FOR EACH ROW EXECUTE FUNCTION update_volunteer_assignment_count();

-- Keep total_hours current
CREATE OR REPLACE FUNCTION update_volunteer_total_hours()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE volunteers
    SET total_hours = (SELECT COALESCE(SUM(hours),0) FROM volunteer_hours WHERE volunteer_id = NEW.volunteer_id)
    WHERE id = NEW.volunteer_id;
  RETURN NULL;
END;
$$;
DROP TRIGGER IF EXISTS trg_vol_total_hours ON volunteer_hours;
CREATE TRIGGER trg_vol_total_hours
  AFTER INSERT OR UPDATE OR DELETE ON volunteer_hours
  FOR EACH ROW EXECUTE FUNCTION update_volunteer_total_hours();
