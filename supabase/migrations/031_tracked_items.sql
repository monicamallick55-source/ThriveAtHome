-- Migration 031: Important Dates & Renewals (Phase 50j)
-- Tracked items: prescriptions, insurance, driver's license, car registration,
-- AAA membership, passport, gym memberships, appointments, and any other date-based item.

CREATE TABLE tracked_items (
  id                              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at                      timestamptz DEFAULT now() NOT NULL,
  member_id                       uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  item_type                       text NOT NULL DEFAULT 'other',
  -- prescription, home_insurance, car_insurance, health_insurance, drivers_license,
  -- car_registration, aaa_membership, passport, gym_membership, appointment, other
  category                        text NOT NULL DEFAULT 'renewal',
  -- 'renewal' or 'appointment'
  item_name                       text NOT NULL,
  expiration_or_appointment_date  date NOT NULL,
  reminder_lead_days              int NOT NULL DEFAULT 30,
  recurrence_cycle_days           int,
  is_recurring                    boolean NOT NULL DEFAULT true,
  renewal_contact_info            text,
  attachments                     text[] DEFAULT '{}',
  status                          text NOT NULL DEFAULT 'active',
  -- active, snoozed, completed, cancelled
  last_reminded_at                timestamptz,
  snoozed_until                   date,
  notes                           text,
  created_by                      uuid REFERENCES family_members(id) ON DELETE SET NULL
);

ALTER TABLE tracked_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "family_all_own_tracked_items" ON tracked_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.member_id = tracked_items.member_id
    AND fm.supabase_auth_id = auth.uid()
  ));

-- Navigators and admins can read all tracked items
CREATE POLICY "navigator_read_tracked_items" ON tracked_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.supabase_auth_id = auth.uid()
    AND fm.role IN ('navigator', 'admin')
  ));

-- Navigators can update tracked items (e.g. mark complete after helping)
CREATE POLICY "navigator_update_tracked_items" ON tracked_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.supabase_auth_id = auth.uid()
    AND fm.role IN ('navigator', 'admin')
  ));
