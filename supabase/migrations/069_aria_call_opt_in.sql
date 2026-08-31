-- Aria opt-in: daily check-in calls are OPT-IN, not default.
-- Trust-first launch strategy — the human navigator relationship comes first for the
-- first 30 days, and Aria's morning calls are introduced only with the senior's consent.
-- Run in Supabase SQL Editor.

ALTER TABLE members
  ADD COLUMN IF NOT EXISTS aria_call_opted_in boolean NOT NULL DEFAULT false;

-- Existing seeded/demo members that already rely on Aria calls can be opted back in
-- individually by a navigator; the default for every new member is false.

COMMENT ON COLUMN members.aria_call_opted_in IS
  'Senior has explicitly chosen to receive Aria AI morning check-in calls. Default false — the Aria call cron skips members where this is false. Frequency is controlled separately by check_in_frequency.';
