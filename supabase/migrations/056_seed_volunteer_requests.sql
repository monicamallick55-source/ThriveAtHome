-- Migration 056: Seed test service bookings for volunteer open-requests view
-- Phase 103 ISSUE fix — volunteer dashboard shows no open requests (no test data)

-- Insert 3 open service bookings (status='requested', volunteer_id=NULL) linked to the
-- first real member in the DB so the volunteer open-requests tab has data to display.
DO $$
DECLARE
  v_member_id uuid;
BEGIN
  SELECT id INTO v_member_id FROM members ORDER BY created_at LIMIT 1;

  IF v_member_id IS NOT NULL THEN
    INSERT INTO service_bookings (member_id, service_type, status, volunteer_id, requested_for, notes, booking_details)
    VALUES
      (v_member_id, 'phone_call',       'requested', NULL, now() + interval '1 day',  'Friendly check-in call requested', '{"duration_minutes": 30}'),
      (v_member_id, 'grocery_help',     'requested', NULL, now() + interval '2 days', 'Help needed with weekly grocery run', '{"store": "Jewel-Osco"}'),
      (v_member_id, 'in_person_visit',  'requested', NULL, now() + interval '3 days', 'Social visit to reduce isolation',  '{"duration_minutes": 60}')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
