-- Add call preference columns to members table
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS checkin_preference text NOT NULL DEFAULT 'aria'
    CHECK (checkin_preference IN ('aria','buddy','both')),
  ADD COLUMN IF NOT EXISTS call_frequency_preference text NOT NULL DEFAULT 'weekly'
    CHECK (call_frequency_preference IN ('daily','few_times_week','weekly')),
  ADD COLUMN IF NOT EXISTS onboarding_call_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_call_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS onboarding_call_scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_aria_call_at timestamptz,
  ADD COLUMN IF NOT EXISTS risk_override_calls boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN members.checkin_preference IS 'aria | buddy | both — chosen during onboarding';
COMMENT ON COLUMN members.call_frequency_preference IS 'daily | few_times_week | weekly — Aria call cadence chosen by member';
COMMENT ON COLUMN members.onboarding_call_completed IS 'true once Aria onboarding call is answered and completed';
COMMENT ON COLUMN members.onboarding_call_attempts IS 'number of onboarding call attempts made (max 3)';
COMMENT ON COLUMN members.risk_override_calls IS 'when true, system calls daily regardless of frequency preference';
