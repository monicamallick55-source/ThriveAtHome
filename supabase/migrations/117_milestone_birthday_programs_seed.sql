-- Migration 117: G7.6 — Seed milestone_birthday_programs + add trigger_days_before column
-- Milestone ages: 70, 75, 80, 85, 90, 95, 100
-- Each row drives the milestone-birthdays cron and navigator task creation

-- 1. Add trigger_days_before column (how far in advance to fire the cron task)
ALTER TABLE milestone_birthday_programs
  ADD COLUMN IF NOT EXISTS trigger_days_before int NOT NULL DEFAULT 30;

COMMENT ON COLUMN milestone_birthday_programs.trigger_days_before IS
  'Days before the milestone birthday to create navigator tasks (default 30)';

-- 2. Seed milestone programs — upsert so re-running is safe
INSERT INTO milestone_birthday_programs (age, program_name, description, trigger_days_before, is_active, gifts)
VALUES
  (
    70,
    'Seventieth Birthday Celebration',
    'A milestone marking the start of the wisdom decade. A meaningful celebration with personal touches, family outreach, and Aria-led excitement.',
    30,
    true,
    '["handwritten_card","photo_book_offer","community_birthday_post"]'::jsonb
  ),
  (
    75,
    'Seventy-Fifth Birthday Celebration',
    'The diamond anniversary of life. Premium family coordination, enhanced Aria call script, and optional community tribute post.',
    30,
    true,
    '["handwritten_card","photo_book_offer","community_birthday_post","navigator_call"]'::jsonb
  ),
  (
    80,
    'Eightieth Birthday Celebration',
    'A landmark birthday requiring premium coordination: family contact, navigator-led celebration planning, and Aria featured story.',
    30,
    true,
    '["handwritten_card","premium_gift_basket_offer","community_birthday_post","navigator_call","care_director_note"]'::jsonb
  ),
  (
    85,
    'Eighty-Fifth Birthday Celebration',
    'Living legend milestone. Personal note from care director, premium celebration, family coordination call, community recognition.',
    30,
    true,
    '["handwritten_card","premium_gift_basket_offer","community_birthday_post","care_director_call","family_coordination_call"]'::jsonb
  ),
  (
    90,
    'Ninetieth Birthday Celebration',
    'Entering the nineties — one of the most celebrated milestones in longevity. Highest-priority navigator task, optional local media outreach, premium celebration.',
    30,
    true,
    '["handwritten_card","premium_gift_basket_offer","community_birthday_post","care_director_call","family_coordination_call","media_outreach_optional"]'::jsonb
  ),
  (
    95,
    'Ninety-Fifth Birthday Celebration',
    'Extraordinary milestone at 95. Superlative care team response, premium celebration, family and community outreach.',
    30,
    true,
    '["handwritten_card","premium_gift_basket_offer","community_birthday_post","care_director_call","family_coordination_call","media_outreach_optional"]'::jsonb
  ),
  (
    100,
    'Centennial Celebration',
    'One hundred years — the pinnacle of longevity milestones. CEO alert, premium celebration, press release option, proclamation request, community-wide recognition.',
    30,
    true,
    '["handwritten_card","premium_gift_basket_offer","community_birthday_post","ceo_alert","care_director_call","family_coordination_call","press_release_optional","proclamation_optional"]'::jsonb
  )
ON CONFLICT (age) DO UPDATE SET
  program_name        = EXCLUDED.program_name,
  description         = EXCLUDED.description,
  trigger_days_before = EXCLUDED.trigger_days_before,
  is_active           = EXCLUDED.is_active,
  gifts               = EXCLUDED.gifts;
