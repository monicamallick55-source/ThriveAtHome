-- Member-controlled privacy settings for the /member-portal Notifications & Privacy tab.
-- The senior decides what their family sees on the family dashboard, and how they
-- themselves prefer to be contacted. Every column defaults to the current behaviour
-- (family sees everything; contact by phone) so existing members are unaffected.
-- Run in Supabase SQL Editor.

ALTER TABLE members
  ADD COLUMN IF NOT EXISTS family_can_see_mood            boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS family_can_see_call_summaries  boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS family_can_see_service_history boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS family_can_see_alerts          boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS preferred_contact_method       text    NOT NULL DEFAULT 'phone';

COMMENT ON COLUMN members.family_can_see_mood IS
  'Senior consents to their family seeing the wellness mood trend on the family dashboard. When false the family dashboard hides the mood trend card.';
COMMENT ON COLUMN members.family_can_see_call_summaries IS
  'Senior consents to their family seeing friendly call summaries.';
COMMENT ON COLUMN members.family_can_see_service_history IS
  'Senior consents to their family seeing their booked services and service history.';
COMMENT ON COLUMN members.family_can_see_alerts IS
  'Senior consents to their family receiving safety alert notifications.';
COMMENT ON COLUMN members.preferred_contact_method IS
  'How the member prefers to be reached: phone | sms | email. Pre-set at signup, changeable in the member portal.';
