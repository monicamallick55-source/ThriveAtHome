#!/usr/bin/env python3
"""
G1.1 — Write migration 085_call_pipeline.sql
Run from: /workspaces/ThriveAtHome
  python3 /path/to/g1_phase1_migration.py
Then apply it: paste the SQL into Supabase SQL Editor and run it.
"""
import os

BASE = os.path.dirname(os.path.abspath(__file__))
# Write to the actual repo
REPO = "/workspaces/ThriveAtHome"

sql = """\
-- Migration 085: Voice Call Pipeline Schema Fix
-- Apply in Supabase SQL Editor

-- 1. Add missing columns to check_in_calls
ALTER TABLE check_in_calls
  ADD COLUMN IF NOT EXISTS agent_id      text,
  ADD COLUMN IF NOT EXISTS agent_name    text,
  ADD COLUMN IF NOT EXISTS direction     text CHECK (direction IN ('inbound','outbound')),
  ADD COLUMN IF NOT EXISTS from_number   text,
  ADD COLUMN IF NOT EXISTS to_number     text,
  ADD COLUMN IF NOT EXISTS caller_role   text,
  ADD COLUMN IF NOT EXISTS processed_at  timestamptz;

-- 2. Unique index on retell_call_id for idempotency
CREATE UNIQUE INDEX IF NOT EXISTS idx_check_in_calls_retell_call_id
  ON check_in_calls(retell_call_id) WHERE retell_call_id IS NOT NULL;

-- 3. Make member_id nullable (inbound callers may be unknown)
ALTER TABLE check_in_calls ALTER COLUMN member_id DROP NOT NULL;

-- 4. Extend call_type enum with new values
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'onboarding' AND enumtypid = 'call_type'::regtype) THEN
    ALTER TYPE call_type ADD VALUE 'onboarding';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'callback' AND enumtypid = 'call_type'::regtype) THEN
    ALTER TYPE call_type ADD VALUE 'callback';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'celebration' AND enumtypid = 'call_type'::regtype) THEN
    ALTER TYPE call_type ADD VALUE 'celebration';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'reminder' AND enumtypid = 'call_type'::regtype) THEN
    ALTER TYPE call_type ADD VALUE 'reminder';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'crisis' AND enumtypid = 'call_type'::regtype) THEN
    ALTER TYPE call_type ADD VALUE 'crisis';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'care_line' AND enumtypid = 'call_type'::regtype) THEN
    ALTER TYPE call_type ADD VALUE 'care_line';
  END IF;
END$$;

-- 5. Create inbound_call_log for non-member callers
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

CREATE POLICY IF NOT EXISTS "staff_read_inbound_calls" ON inbound_call_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.supabase_auth_id = auth.uid()
        AND fm.role IN ('admin','navigator')
    )
  );

-- 6. Add call_reminder column to tracked_items (for Grace agent)
ALTER TABLE tracked_items
  ADD COLUMN IF NOT EXISTS call_reminder boolean NOT NULL DEFAULT false;
"""

out = os.path.join(REPO, "supabase", "migrations", "085_call_pipeline.sql")
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, "w") as f:
    f.write(sql)

print(f"✅ Wrote {out}")
print()
print("NEXT STEP: Apply this SQL in your Supabase SQL Editor:")
print("  https://supabase.com/dashboard/project/qdniskppkfqjmtpkftdt/sql/new")
print()
print("VERIFY after applying:")
print("  SELECT column_name FROM information_schema.columns")
print("  WHERE table_name = 'check_in_calls'")
print("  AND column_name IN ('agent_id','agent_name','direction','from_number','processed_at');")
print("  -- Should return 5 rows")
