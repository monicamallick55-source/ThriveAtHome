-- =============================================================================
-- ThriveAtHome — Database Assertion Queries
-- Run against: Supabase ref qdniskppkfqjmtpkftdt
-- Usage: psql "$DATABASE_URL" -f tests/db/assertions.sql
-- Or via: npx tsx tests/db/run-assertions.ts
-- =============================================================================

-- ─── TC-INF002 — All 8 Nov 4 Migrations Applied ──────────────────────────────
-- Expected: 8 migrations from Nov 4, all present

SELECT 'TC-INF002' AS tc,
       COUNT(*) AS migrations_found,
       CASE
         WHEN COUNT(*) >= 8 THEN 'PASS'
         ELSE 'FAIL — Expected 8, found ' || COUNT(*)::text
       END AS result
FROM supabase_migrations
WHERE name IN (
  '097_g54',
  '098_g55',
  '099_g56',
  '100_g58',
  '101_g510',
  '102_g4',
  'partner_listings',
  'navigator_tasks_schema_fix'
);

-- Individual check:
SELECT 'TC-INF002-detail' AS tc, name,
  CASE WHEN name IS NOT NULL THEN 'PRESENT' ELSE 'MISSING' END AS status
FROM (VALUES
  ('097_g54'),
  ('098_g55'),
  ('099_g56'),
  ('100_g58'),
  ('101_g510'),
  ('102_g4'),
  ('partner_listings'),
  ('navigator_tasks_schema_fix')
) AS expected(name)
LEFT JOIN supabase_migrations sm USING (name);


-- ─── TC-M054 — All 20 Communities Present ────────────────────────────────────
SELECT 'TC-M054' AS tc,
       community_type,
       COUNT(*) AS count,
       CASE
         WHEN community_type = 'cultural' AND COUNT(*) = 12 THEN 'PASS'
         WHEN community_type = 'interest' AND COUNT(*) >= 8  THEN 'PASS'
         ELSE 'WARN — check count'
       END AS result
FROM communities
GROUP BY community_type
ORDER BY community_type;

SELECT 'TC-M054-total' AS tc,
       COUNT(*) AS total_communities,
       CASE WHEN COUNT(*) >= 20 THEN 'PASS' ELSE 'FAIL — Expected ≥ 20' END AS result
FROM communities;


-- ─── TC-M050 — Exactly 4 Named Interest Circles ──────────────────────────────
SELECT 'TC-M050' AS tc,
       COUNT(*) AS named_interest_circles,
       CASE WHEN COUNT(*) = 4 THEN 'PASS' ELSE 'FAIL — Expected exactly 4' END AS result
FROM communities
WHERE community_type = 'interest' AND is_named = true;

-- List them:
SELECT 'TC-M050-detail' AS tc, name, community_type, is_named
FROM communities
WHERE community_type = 'interest'
ORDER BY is_named DESC, name;


-- ─── TC-PD001 — 15 Partner Listings Seeded ───────────────────────────────────
SELECT 'TC-PD001' AS tc,
       COUNT(*) AS partner_listings,
       CASE WHEN COUNT(*) >= 15 THEN 'PASS' ELSE 'FAIL — Expected ≥ 15' END AS result
FROM partner_listings;


-- ─── TC-VOL061 — training_completed Column Exists ────────────────────────────
SELECT 'TC-VOL061' AS tc,
       COUNT(*) AS column_exists,
       CASE WHEN COUNT(*) = 1 THEN 'PASS' ELSE 'FAIL — Column missing' END AS result
FROM information_schema.columns
WHERE table_name = 'volunteer_profiles'
  AND column_name = 'training_completed';


-- ─── TC-REG001 — RLS Policies Use supabase_auth_id ───────────────────────────
-- Check no policies still reference old user_id column
SELECT 'TC-REG001' AS tc,
       COUNT(*) AS policies_with_old_user_id,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL — Found policies using user_id' END AS result
FROM pg_policies
WHERE tablename = 'members'
  AND qual::text LIKE '%user_id%'
  AND qual::text NOT LIKE '%supabase_auth_id%';

-- List all members table policies for review:
SELECT 'TC-REG001-detail' AS tc,
       policyname,
       cmd,
       qual
FROM pg_policies
WHERE tablename = 'members'
ORDER BY policyname;


-- ─── TC-CH001 — 10 Metros Seeded ─────────────────────────────────────────────
SELECT 'TC-CH001' AS tc,
       COUNT(*) AS metro_count,
       CASE WHEN COUNT(*) >= 10 THEN 'PASS' ELSE 'FAIL — Expected ≥ 10' END AS result
FROM metro_areas;


-- ─── TC-LT005 — Therapist Requires License Number ────────────────────────────
-- Attempt to find the constraint (should exist)
SELECT 'TC-LT005' AS tc,
       COUNT(*) AS constraint_exists,
       CASE WHEN COUNT(*) >= 1 THEN 'PASS' ELSE 'FAIL — No license constraint found' END AS result
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc USING (constraint_name)
WHERE tc.table_name = 'trusted_advisors'
  AND cc.check_clause LIKE '%license%';


-- ─── TC-SCH001 — navigator_tasks Schema Columns ──────────────────────────────
-- Verify key columns from the 25-file schema fix exist
SELECT 'TC-SCH001' AS tc,
       column_name,
       data_type,
       'PRESENT' AS status
FROM information_schema.columns
WHERE table_name = 'navigator_tasks'
  AND column_name IN ('task_type', 'priority', 'status', 'member_id', 'navigator_id',
                      'metadata', 'created_at', 'completed_at', 'due_date')
ORDER BY column_name;


-- ─── TC-INF002 — supabase_migrations full list (recent) ──────────────────────
SELECT 'TC-INF002-full' AS tc, name, inserted_at
FROM supabase_migrations
ORDER BY inserted_at DESC
LIMIT 20;
