-- Migration 090: Onboarding sessions table
-- Tracks Quinn voice onboarding progress in real time
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS onboarding_sessions (
  id                      uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id              text UNIQUE NOT NULL,        -- generated on page load, passed to Retell as dynamic var
  created_at              timestamptz DEFAULT now() NOT NULL,
  updated_at              timestamptz DEFAULT now() NOT NULL,
  family_member_id        uuid REFERENCES family_members(id) ON DELETE CASCADE,

  -- Fields populated by Quinn tool calls (each updates independently)
  first_name              text,
  last_name               text,
  preferred_name          text,
  phone                   text,
  email                   text,
  dob                     text,
  address                 text,
  emergency_contact_name  text,
  emergency_contact_phone text,
  medications             text,
  conditions              text,

  -- Name confirmed letter-by-letter during call
  name_spelling_confirmed boolean DEFAULT false,

  -- Retell call reference
  retell_call_id          text,
  call_ended_at           timestamptz,

  -- Flow state machine
  status  text NOT NULL DEFAULT 'in_progress'
          CHECK (status IN (
            'in_progress',        -- Quinn is actively collecting info
            'pending_confirmation', -- Quinn read back summary, awaiting member "yes"
            'ready_to_submit',    -- Member confirmed all details, auto-submit browser
            'submitted',          -- Member row created successfully
            'error',              -- Tool call failed, show recovery options
            'abandoned'           -- Call ended without completion
          )),
  error_type text  -- 'save_failed' | 'timeout' | 'unclear_input' | 'submit_failed'
);

ALTER TABLE onboarding_sessions ENABLE ROW LEVEL SECURITY;

-- Family member can read their own session (created before auth in some flows — use session_id cookie auth)
CREATE POLICY "family_own_session" ON onboarding_sessions
  FOR ALL
  USING (
    family_member_id IS NULL  -- pre-auth sessions accessible by session_id only (service role)
    OR family_member_id = (
      SELECT id FROM family_members WHERE supabase_auth_id = auth.uid()
    )
  );

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_onboarding_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER onboarding_sessions_updated_at
  BEFORE UPDATE ON onboarding_sessions
  FOR EACH ROW EXECUTE FUNCTION update_onboarding_session_timestamp();

-- Index for fast lookup by session_id (webhook hits this every tool call)
CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_session_id
  ON onboarding_sessions(session_id);

-- Enable Supabase Realtime on this table (needed for SSE listener)
ALTER PUBLICATION supabase_realtime ADD TABLE onboarding_sessions;
