-- Allow circle_id to be null (platform-wide events need no specific circle)
ALTER TABLE circle_events ALTER COLUMN circle_id DROP NOT NULL;

-- Add circle_ids array for associating one event with multiple circles
ALTER TABLE circle_events ADD COLUMN IF NOT EXISTS circle_ids uuid[] DEFAULT '{}';
