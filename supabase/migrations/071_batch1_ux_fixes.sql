-- Migration 071: Batch 1 member-portal UX fixes (September 2026)
-- Run this whole file once in the Supabase SQL Editor. Safe to re-run (guards throughout).
--
-- 1. tracked_items: per-item subcategory + preferred contact method
--    - subcategory: the specific kind within the category (e.g. "Doctor visit",
--      "Streaming service"). Free text; the client offers a filtered list per category.
--    - preferred_contact_method: how the member wants to be reached about THIS item.
--      Pre-populated from members.preferred_contact_method, overridable per item.
--    - category comment widened to include 'subscription'.

ALTER TABLE tracked_items ADD COLUMN IF NOT EXISTS subcategory text;
ALTER TABLE tracked_items ADD COLUMN IF NOT EXISTS preferred_contact_method text;
COMMENT ON COLUMN tracked_items.category IS 'renewal | appointment | subscription';

-- 2. member_needs: which community/circle the need relates to (optional context).
--    member_needs already exists (see post-need route). Add a nullable text tag only.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'member_needs') THEN
    ALTER TABLE member_needs ADD COLUMN IF NOT EXISTS community_context text;
  END IF;
END $$;
