-- Add community_type column to cultural_circles
-- 'cultural' = cultural/ethnic/heritage communities (the original 12)
-- 'interest'  = interest-based hobby communities (the 8 added in migration 014)

ALTER TABLE cultural_circles
  ADD COLUMN IF NOT EXISTS community_type text NOT NULL DEFAULT 'cultural';

-- Circles that have an interest_tag set are interest-based communities
UPDATE cultural_circles
  SET community_type = 'interest'
  WHERE interest_tag IS NOT NULL AND community_type = 'cultural';
