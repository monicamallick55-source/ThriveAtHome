-- Migration 025: Services Marketplace — service_bookings table
-- Phase 45 (M17) — Transport Services hub

CREATE TYPE booking_status AS ENUM ('requested', 'confirmed', 'in_progress', 'completed', 'cancelled');

CREATE TABLE service_bookings (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at          timestamptz DEFAULT now() NOT NULL,
  member_id           uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  service_type        text NOT NULL,
  provider_name       text,
  booking_details     jsonb NOT NULL DEFAULT '{}',
  status              booking_status NOT NULL DEFAULT 'requested',
  requested_for       timestamptz,
  confirmed_at        timestamptz,
  completed_at        timestamptz,
  provider_booking_id text,
  cost_estimate       numeric,
  notes               text
);

ALTER TABLE service_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "family_all_own_bookings" ON service_bookings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.member_id = service_bookings.member_id
        AND fm.supabase_auth_id = auth.uid()
    )
  );

CREATE POLICY "navigator_read_bookings" ON service_bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.supabase_auth_id = auth.uid()
        AND fm.role IN ('navigator', 'admin')
    )
  );
