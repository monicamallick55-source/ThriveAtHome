-- Memory Books v2: adds format_type, purchase tracking, regeneration, Memory Collage support
-- Human must run this in Supabase SQL Editor

ALTER TABLE memory_books
  ADD COLUMN IF NOT EXISTS format_type        text NOT NULL DEFAULT 'memory_book',
  ADD COLUMN IF NOT EXISTS purchase_date      timestamptz,
  ADD COLUMN IF NOT EXISTS regeneration_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS collage_storage_path text;

-- status now includes 'draft' in addition to existing values
-- Existing rows keep their current status; no constraint change needed
