-- Migration 118: Age-stage community circles
-- Adds 'age_group' as a community_type and seeds four age-range circles.
-- These give members a community of peers at the same life stage,
-- separate from cultural and interest circles.

-- 1. Extend the community_type check constraint to include 'age_group'
ALTER TABLE cultural_circles
  DROP CONSTRAINT IF EXISTS cultural_circles_community_type_check;

ALTER TABLE cultural_circles
  ADD CONSTRAINT cultural_circles_community_type_check
  CHECK (community_type IN ('cultural', 'interest', 'age_group'));

-- 2. Add an age_min / age_max column pair for filtering and onboarding auto-join
ALTER TABLE cultural_circles
  ADD COLUMN IF NOT EXISTS age_min int,
  ADD COLUMN IF NOT EXISTS age_max int; -- NULL = no upper bound (85+)

-- 3. Add emoji column if it doesn't exist yet
ALTER TABLE cultural_circles
  ADD COLUMN IF NOT EXISTS emoji text;

-- 4. Seed the four age-stage circles
INSERT INTO cultural_circles (circle_name, description, emoji, community_type, age_min, age_max)
VALUES
  (
    'Active Pre-Retirees (55-64)',
    'For members still working or recently transitioning — navigating retirement planning, encore careers, Medicare prep, and staying active.',
    '💼',
    'age_group',
    55, 64
  ),
  (
    'Early Retirees (65-74)',
    'For newly and recently retired members — building a fulfilling post-career life, travel, new hobbies, grandparenting, staying sharp and socially connected.',
    '🌿',
    'age_group',
    65, 74
  ),
  (
    'Established Seniors (75-84)',
    'For members with deep life wisdom — strong community connections, grandparenting, adapting to changing health, and celebrating a life well lived.',
    '🌟',
    'age_group',
    75, 84
  ),
  (
    'Elder Community (85+)',
    'For our eldest members — legacy, life story, deepening friendships, navigating health transitions with dignity.',
    '🕊️',
    'age_group',
    85, NULL
  )
ON CONFLICT DO NOTHING;

-- 4. Add joined_via to circle_memberships so auto-joins are distinguishable from manual joins
ALTER TABLE circle_memberships
  ADD COLUMN IF NOT EXISTS joined_via text;

-- 6. Helper function: returns the correct age-group circle id for a given age
CREATE OR REPLACE FUNCTION age_group_circle_id(member_age int)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM cultural_circles
  WHERE community_type = 'age_group'
    AND age_min <= member_age
    AND (age_max IS NULL OR age_max >= member_age)
  LIMIT 1;
$$;
