-- Migration 085: Voice Call Pipeline Schema Fix
ALTER TABLE check_in_calls
  ADD COLUMN IF NOT EXISTS agent_id      text,
  ADD COLUMN IF NOT EXISTS agent_name    text,
  ADD COLUMN IF NOT EXISTS direction     text CHECK (direction IN ('inbound','outbound')),
  ADD COLUMN IF NOT EXISTS from_number   text,
  ADD COLUMN IF NOT EXISTS to_number     text,
  ADD COLUMN IF NOT EXISTS caller_role   text,
  ADD COLUMN IF NOT EXISTS processed_at  timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS idx_check_in_calls_retell_call_id
  ON check_in_calls(retell_call_id) WHERE retell_call_id IS NOT NULL;
ALTER TABLE check_in_calls ALTER COLUMN member_id DROP NOT NULL;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel='onboarding' AND enumtypid='call_type'::regtype) THEN ALTER TYPE call_type ADD VALUE 'onboarding'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel='celebration' AND enumtypid='call_type'::regtype) THEN ALTER TYPE call_type ADD VALUE 'celebration'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel='reminder' AND enumtypid='call_type'::regtype) THEN ALTER TYPE call_type ADD VALUE 'reminder'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel='crisis' AND enumtypid='call_type'::regtype) THEN ALTER TYPE call_type ADD VALUE 'crisis'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel='care_line' AND enumtypid='call_type'::regtype) THEN ALTER TYPE call_type ADD VALUE 'care_line'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel='callback' AND enumtypid='call_type'::regtype) THEN ALTER TYPE call_type ADD VALUE 'callback'; END IF;
END$$;
CREATE TABLE IF NOT EXISTS inbound_call_log (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       timestamptz DEFAULT now() NOT NULL,
  retell_call_id   text UNIQUE,
  agent_name       text NOT NULL,
  from_number      text,
  caller_role      text NOT NULL DEFAULT 'unknown',
  family_member_id uuid REFERENCES family_members(id) ON DELETE SET NULL,
  volunteer_id     uuid,
  duration_seconds int,
  ai_summary       text,
  transcript       text,
  needs_followup   boolean NOT NULL DEFAULT false
);
ALTER TABLE inbound_call_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracked_items ADD COLUMN IF NOT EXISTS call_reminder boolean NOT NULL DEFAULT false;
