-- Migration 088 — Agent transfers + non-member tool callers (Gap Build G1 transfer fix)
-- One inbound number, answered by Quinn, who hands calls to other agents with Retell
-- Agent Transfer (same call_id; only Quinn's webhook fires). Record every agent on the call.
-- Tools called by non-members (family, volunteers, unknown numbers) create navigator tasks
-- that have no member, so navigator_tasks.member_id becomes nullable and the caller is recorded.

ALTER TABLE check_in_calls
  ADD COLUMN IF NOT EXISTS agents_involved text[] NOT NULL DEFAULT '{}';

ALTER TABLE inbound_call_log
  ADD COLUMN IF NOT EXISTS agents_involved text[] NOT NULL DEFAULT '{}';

ALTER TABLE navigator_tasks ALTER COLUMN member_id DROP NOT NULL;
ALTER TABLE navigator_tasks
  ADD COLUMN IF NOT EXISTS caller_phone text,   -- E.164, for tasks raised by a non-member caller
  ADD COLUMN IF NOT EXISTS caller_role  text;   -- 'family','volunteer','staff','unknown'

COMMENT ON COLUMN check_in_calls.agents_involved IS
  'Every agent on the call in order, e.g. {quinn,rosa}. agent_name is the last one.';
