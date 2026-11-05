-- =============================================================================
-- ThriveAtHome — Seed Test Accounts
-- Run once against your Supabase instance to create the test user accounts
-- needed for E2E tests.
--
-- Usage:
--   psql "$DATABASE_URL" -f tests/db/seed-accounts.sql
--
-- Password for all test accounts: TestPass123!
-- (Set via Supabase auth.users — handled by Supabase Auth, not SQL directly)
--
-- For Supabase, create users via:
--   supabase auth users create --email member@test.com --password TestPass123! (CLI)
--   OR via the Supabase Dashboard → Authentication → Users
--   OR via the seed script below using the Admin API
-- =============================================================================

-- ─── Verify seed accounts exist ──────────────────────────────────────────────
-- After creating users via Supabase Auth, run this to verify:

SELECT
  u.email,
  m.plan_tier,
  m.supabase_auth_id,
  CASE
    WHEN m.id IS NOT NULL THEN 'member row exists'
    ELSE 'MISSING member row'
  END AS status
FROM auth.users u
LEFT JOIN public.members m ON m.supabase_auth_id = u.id::text
WHERE u.email IN (
  'member@test.com',
  'complete@test.com',
  'premier@test.com',
  'family@test.com',
  'navigator@test.com',
  'admin@test.com',
  'volunteer@test.com',
  'student@test.com',
  'veteran@test.com',
  'retired_pro@test.com',
  'corporate@test.com',
  'neighbor@test.com',
  'faith@test.com',
  'k12student@test.com',
  'agency@test.com',
  'employer@test.com',
  'network@test.com',
  'seniorcenter@test.com',
  'aaa@test.com',
  'orgadmin@test.com',
  'vsoadmin@test.com',
  'uniadmin@test.com',
  'k12admin@test.com',
  'careworker@test.com',
  'medicare_member@test.com',
  'grief_member@test.com',
  'opt_out_member@test.com',
  'b2b_new_org@test.com'
)
ORDER BY u.email;


-- ─── Set plan_tier for test members ──────────────────────────────────────────
-- After users are created, set their plan_tier appropriately:

-- Basic member (default)
UPDATE members SET plan_tier = 'basic'
WHERE supabase_auth_id = (SELECT id::text FROM auth.users WHERE email = 'member@test.com');

-- Complete member
UPDATE members SET plan_tier = 'complete'
WHERE supabase_auth_id = (SELECT id::text FROM auth.users WHERE email = 'complete@test.com');

-- Premier member (manually set — plan hidden publicly)
UPDATE members SET plan_tier = 'premier'
WHERE supabase_auth_id = (SELECT id::text FROM auth.users WHERE email = 'premier@test.com');

-- Medicare member: ml_insights_opt_out = false (opted IN to insights)
UPDATE members
SET ml_insights_opt_out = false,
    zip_code = '94103'
WHERE supabase_auth_id = (SELECT id::text FROM auth.users WHERE email = 'medicare_member@test.com');

-- Grief member: has active grief_support_requests row
-- (also used to verify birthday arc skips grief members)
INSERT INTO grief_support_requests (member_id, pathway, status, created_at)
SELECT m.id, 'loss_of_loved_one', 'active', NOW()
FROM members m
JOIN auth.users u ON u.id::text = m.supabase_auth_id
WHERE u.email = 'grief_member@test.com'
ON CONFLICT DO NOTHING;

-- Opt-out member: celebration_opt_out = true
UPDATE members SET celebration_opt_out = true
WHERE supabase_auth_id = (SELECT id::text FROM auth.users WHERE email = 'opt_out_member@test.com');


-- ─── Seed roles for non-member accounts ──────────────────────────────────────
-- Navigator role
UPDATE members SET role = 'navigator'
WHERE supabase_auth_id = (SELECT id::text FROM auth.users WHERE email = 'navigator@test.com');

-- Admin role
UPDATE members SET role = 'admin'
WHERE supabase_auth_id = (SELECT id::text FROM auth.users WHERE email = 'admin@test.com');

-- Volunteers
UPDATE volunteer_profiles vp
SET type = 'general', training_completed = true
FROM members m
JOIN auth.users u ON u.id::text = m.supabase_auth_id
WHERE u.email = 'volunteer@test.com' AND vp.member_id = m.id;

UPDATE volunteer_profiles vp
SET type = 'veteran', training_completed = true
FROM members m
JOIN auth.users u ON u.id::text = m.supabase_auth_id
WHERE u.email = 'veteran@test.com' AND vp.member_id = m.id;

UPDATE volunteer_profiles vp
SET type = 'student', training_completed = true
FROM members m
JOIN auth.users u ON u.id::text = m.supabase_auth_id
WHERE u.email = 'student@test.com' AND vp.member_id = m.id;

UPDATE volunteer_profiles vp
SET type = 'retired_pro', profession = 'doctor', training_completed = true
FROM members m
JOIN auth.users u ON u.id::text = m.supabase_auth_id
WHERE u.email = 'retired_pro@test.com' AND vp.member_id = m.id;

UPDATE volunteer_profiles vp
SET type = 'neighbor', home_zip_code = '94103', training_completed = true
FROM members m
JOIN auth.users u ON u.id::text = m.supabase_auth_id
WHERE u.email = 'neighbor@test.com' AND vp.member_id = m.id;


-- ─── Link family@test.com to member@test.com ─────────────────────────────────
INSERT INTO family_members (member_id, family_user_id, relationship, status)
SELECT
  (SELECT m.id FROM members m JOIN auth.users u ON u.id::text = m.supabase_auth_id WHERE u.email = 'member@test.com'),
  (SELECT u.id FROM auth.users u WHERE u.email = 'family@test.com'),
  'child',
  'active'
ON CONFLICT DO NOTHING;


-- ─── Summary ─────────────────────────────────────────────────────────────────
SELECT 'Seed complete — verify above results show all 28 accounts with member rows' AS note;
