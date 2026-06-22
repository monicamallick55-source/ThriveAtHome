-- Migration 035: Seed comprehensive test volunteers and service providers
-- Run this to ensure navigator dispatch pickers have data to work with.
-- Idempotent: uses ON CONFLICT DO NOTHING or checks before insert.

-- ─── Additional test volunteers ──────────────────────────────────────────────
-- These supplement the volunteers seeded in migration 026.
-- Each covers a specific service_type so pickers have results.

DO $$
BEGIN
  -- Tech help volunteer (supplements Sarah Chen from migration 026)
  IF NOT EXISTS (SELECT 1 FROM volunteers WHERE email = 'david.kim@thriveathome.dev') THEN
    INSERT INTO volunteers (
      full_name, email, phone, city, state,
      languages, availability_days, hours_per_week,
      service_types, interests, status,
      total_hours_logged, total_seniors_helped, rating_average
    ) VALUES (
      'David Kim', 'david.kim@thriveathome.dev', '(312) 555-0211', 'Chicago', 'IL',
      ARRAY['English','Korean'], ARRAY['Monday','Wednesday','Saturday'], '3-5',
      ARRAY['tech_help','smartphone_help','computer_help']::visit_type[],
      ARRAY['Technology','Family'],
      'active', 12, 4, 4.8
    );
  END IF;

  -- In-person / home services volunteer (supplements Maria Santos from migration 026)
  IF NOT EXISTS (SELECT 1 FROM volunteers WHERE email = 'patricia.wong@thriveathome.dev') THEN
    INSERT INTO volunteers (
      full_name, email, phone, city, state,
      languages, availability_days, hours_per_week,
      service_types, interests, status,
      total_hours_logged, total_seniors_helped, rating_average
    ) VALUES (
      'Patricia Wong', 'patricia.wong@thriveathome.dev', '(312) 555-0312', 'Chicago', 'IL',
      ARRAY['English','Mandarin'], ARRAY['Tuesday','Thursday','Saturday'], '5-10',
      ARRAY['in_person_visit','friendly_visit','reading_companion']::visit_type[],
      ARRAY['Books','Cooking','Music'],
      'active', 38, 9, 4.9
    );
  END IF;

  -- Grocery / meals volunteer
  IF NOT EXISTS (SELECT 1 FROM volunteers WHERE email = 'robert.johnson@thriveathome.dev') THEN
    INSERT INTO volunteers (
      full_name, email, phone, city, state,
      languages, availability_days, hours_per_week,
      service_types, interests, status,
      total_hours_logged, total_seniors_helped, rating_average
    ) VALUES (
      'Robert Johnson', 'robert.johnson@thriveathome.dev', '(312) 555-0413', 'Chicago', 'IL',
      ARRAY['English','Spanish'], ARRAY['Monday','Wednesday','Friday'], '5-10',
      ARRAY['grocery_help','meal_delivery','cooking_assistance']::visit_type[],
      ARRAY['Cooking','Gardening'],
      'active', 55, 14, 4.7
    );
  END IF;

  -- Walking / transport companion volunteer
  IF NOT EXISTS (SELECT 1 FROM volunteers WHERE email = 'karen.lee@thriveathome.dev') THEN
    INSERT INTO volunteers (
      full_name, email, phone, city, state,
      languages, availability_days, hours_per_week,
      service_types, interests, status,
      total_hours_logged, total_seniors_helped, rating_average
    ) VALUES (
      'Karen Lee', 'karen.lee@thriveathome.dev', '(312) 555-0514', 'Chicago', 'IL',
      ARRAY['English','Korean'], ARRAY['Tuesday','Thursday','Sunday'], '3-5',
      ARRAY['walking_companion','event_escort','friendly_visit']::visit_type[],
      ARRAY['Sports','Travel memories'],
      'active', 21, 6, 4.6
    );
  END IF;

  -- Phone companion volunteer (for companionship dispatch)
  IF NOT EXISTS (SELECT 1 FROM volunteers WHERE email = 'helen.garcia@thriveathome.dev') THEN
    INSERT INTO volunteers (
      full_name, email, phone, city, state,
      languages, availability_days, hours_per_week,
      service_types, interests, status,
      total_hours_logged, total_seniors_helped, rating_average
    ) VALUES (
      'Helen Garcia', 'helen.garcia@thriveathome.dev', '(312) 555-0615', 'Chicago', 'IL',
      ARRAY['English','Spanish'], ARRAY['Monday','Tuesday','Wednesday','Thursday','Friday'], '10+',
      ARRAY['phone_call','virtual_event','reading_aloud']::visit_type[],
      ARRAY['Books','Music','Faith & spirituality'],
      'active', 72, 18, 5.0
    );
  END IF;

  -- Travel companion volunteer
  IF NOT EXISTS (SELECT 1 FROM volunteers WHERE email = 'michael.chen@thriveathome.dev') THEN
    INSERT INTO volunteers (
      full_name, email, phone, city, state,
      languages, availability_days, hours_per_week,
      service_types, interests, status,
      total_hours_logged, total_seniors_helped, rating_average
    ) VALUES (
      'Michael Chen', 'michael.chen@thriveathome.dev', '(312) 555-0716', 'Chicago', 'IL',
      ARRAY['English','Mandarin','Cantonese'], ARRAY['Saturday','Sunday'], '3-5',
      ARRAY['travel_companion','travel_coordination','walking_companion']::visit_type[],
      ARRAY['Travel memories','Family'],
      'active', 16, 5, 4.8
    );
  END IF;

END $$;

-- ─── Additional service providers ────────────────────────────────────────────
-- These supplement the providers seeded in migrations 027 and 032.

DO $$
BEGIN
  -- Telehealth / health services provider
  IF NOT EXISTS (SELECT 1 FROM service_providers WHERE email = 'teladoc@thriveathome.dev') THEN
    INSERT INTO service_providers (
      full_name, company_name, email, phone, city, state,
      service_types, rating_average, is_active
    ) VALUES (
      'Teladoc Health', 'Teladoc Health', 'teladoc@thriveathome.dev', '(800) 835-2362', 'Chicago', 'IL',
      ARRAY['telehealth','health_service'], 4.7, true
    );
  END IF;

  -- Mental health provider
  IF NOT EXISTS (SELECT 1 FROM service_providers WHERE email = 'betterhelp@thriveathome.dev') THEN
    INSERT INTO service_providers (
      full_name, company_name, email, phone, city, state,
      service_types, rating_average, is_active
    ) VALUES (
      'Senior Wellness Counseling', 'Chicago Senior Mental Health Center', 'betterhelp@thriveathome.dev', '(312) 555-0817', 'Chicago', 'IL',
      ARRAY['mental_health','telehealth','health_service'], 4.9, true
    );
  END IF;

  -- Transportation provider
  IF NOT EXISTS (SELECT 1 FROM service_providers WHERE email = 'gogograndparent@thriveathome.dev') THEN
    INSERT INTO service_providers (
      full_name, company_name, email, phone, city, state,
      service_types, rating_average, is_active
    ) VALUES (
      'GoGoGrandparent', 'GoGoGrandparent', 'gogograndparent@thriveathome.dev', '(855) 464-6872', 'Chicago', 'IL',
      ARRAY['transport','medical_transport','social_transport'], 4.6, true
    );
  END IF;

  -- Meal delivery provider
  IF NOT EXISTS (SELECT 1 FROM service_providers WHERE email = 'mealsonwheels@thriveathome.dev') THEN
    INSERT INTO service_providers (
      full_name, company_name, email, phone, city, state,
      service_types, rating_average, is_active
    ) VALUES (
      'Meals on Wheels Chicago', 'Meals on Wheels Chicago', 'mealsonwheels@thriveathome.dev', '(312) 922-3663', 'Chicago', 'IL',
      ARRAY['meals','meal_delivery'], 4.8, true
    );
  END IF;

END $$;
