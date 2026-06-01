-- Migration 026: Add volunteer_id to service_bookings + seed test volunteers
-- Phase 45 ISSUE fix — volunteer assignment picker in navigator dispatch panel

-- Add volunteer_id column to link a specific volunteer to a service booking
ALTER TABLE service_bookings
  ADD COLUMN IF NOT EXISTS volunteer_id uuid REFERENCES volunteers(id) ON DELETE SET NULL;

-- Seed 3 active test volunteers with different service_types for picker testing
INSERT INTO volunteers (
  full_name, email, phone, city, state,
  languages, availability_days, hours_per_week,
  service_types, interests, why_volunteer,
  status, rating_average
) VALUES
(
  'Sarah Chen',
  'sarah.chen.volunteer@thriveathome.dev',
  '555-234-5678',
  'Chicago', 'IL',
  ARRAY['english', 'mandarin'],
  ARRAY['Monday', 'Wednesday', 'Friday'],
  '5-10',
  ARRAY['tech_help', 'phone_call']::visit_type[],
  ARRAY['technology', 'education'],
  'I love helping seniors navigate technology and stay connected with family.',
  'active',
  4.9
),
(
  'James Rivera',
  'james.rivera.volunteer@thriveathome.dev',
  '555-345-6789',
  'Chicago', 'IL',
  ARRAY['english', 'spanish'],
  ARRAY['Saturday', 'Sunday'],
  '3-5',
  ARRAY['walking_companion', 'in_person_visit', 'grocery_help']::visit_type[],
  ARRAY['fitness', 'cooking'],
  'I want to give back by helping seniors stay active and independent.',
  'active',
  4.7
),
(
  'Maria Santos',
  'maria.santos.volunteer@thriveathome.dev',
  '555-456-7890',
  'Chicago', 'IL',
  ARRAY['english', 'spanish', 'tagalog'],
  ARRAY['Tuesday', 'Thursday'],
  '3-5',
  ARRAY['grocery_help', 'phone_call', 'in_person_visit']::visit_type[],
  ARRAY['cooking', 'gardening'],
  'Helping seniors with meals and daily tasks honors my own grandparents.',
  'active',
  4.8
)
ON CONFLICT (email) DO NOTHING;
