-- Migration 085 — Call pipeline schema fix (Gap Build G1.1)
-- Adds agent/direction tracking to check_in_calls, extends call_type,
-- makes member_id nullable for unmatched inbound callers, and adds
-- inbound_call_log for non-member inbound calls.

-- Agent + direction tracking on calls
ALTER TABLE check_in_calls
  ADD COLUMN IF NOT EXISTS agent_id      text,
  ADD COLUMN IF NOT EXISTS agent_name    text,     -- 'aria','rosa','joy','grace','hope','claire','sam','morgan','nova','alex','quinn','jordan'
  ADD COLUMN IF NOT EXISTS direction     text CHECK (direction IN ('inbound','outbound')),
  ADD COLUMN IF NOT EXISTS from_number   text,
  ADD COLUMN IF NOT EXISTS to_number     text,
  ADD COLUMN IF NOT EXISTS caller_role   text,     -- 'member','family','volunteer','buddy','staff','partner','unknown'
  ADD COLUMN IF NOT EXISTS processed_at  timestamptz;

-- Clear any accidental duplicate retell_call_ids (keep the oldest row's value)
-- so the unique index below can be created.
UPDATE check_in_calls c
SET retell_call_id = NULL
WHERE retell_call_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM check_in_calls o
    WHERE o.retell_call_id = c.retell_call_id
      AND (o.created_at, o.id) < (c.created_at, c.id)
  );

-- Full (non-partial) unique index: PostgREST upserts use ON CONFLICT (retell_call_id)
-- without a WHERE clause, which cannot target a partial index. NULLs stay distinct,
-- so this behaves the same as the partial version for rows without a Retell id.
CREATE UNIQUE INDEX IF NOT EXISTS idx_check_in_calls_retell_call_id
  ON check_in_calls(retell_call_id);

-- Extend call_type enum
ALTER TYPE call_type ADD VALUE IF NOT EXISTS 'onboarding';
ALTER TYPE call_type ADD VALUE IF NOT EXISTS 'callback';
ALTER TYPE call_type ADD VALUE IF NOT EXISTS 'celebration';
ALTER TYPE call_type ADD VALUE IF NOT EXISTS 'reminder';
ALTER TYPE call_type ADD VALUE IF NOT EXISTS 'crisis';
ALTER TYPE call_type ADD VALUE IF NOT EXISTS 'care_line';

-- member_id must be nullable so unmatched inbound callers are still recorded
ALTER TABLE check_in_calls ALTER COLUMN member_id DROP NOT NULL;

-- Non-member inbound calls (family, volunteers, partners) that don't belong in check_in_calls
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

DROP POLICY IF EXISTS "staff_read_inbound_calls" ON inbound_call_log;
CREATE POLICY "staff_read_inbound_calls" ON inbound_call_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM family_members fm WHERE fm.supabase_auth_id = auth.uid() AND fm.role IN ('admin','navigator'))
);
