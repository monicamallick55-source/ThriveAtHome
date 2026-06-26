-- Phase 70: Email Templates for org admins
-- org_email_templates: org-scoped reusable email templates
CREATE TABLE IF NOT EXISTS org_email_templates (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        timestamptz DEFAULT now() NOT NULL,
  org_id            uuid REFERENCES community_orgs(id) ON DELETE CASCADE,
  -- NULL org_id = factory/system template (read-only for all orgs)
  name              text NOT NULL,
  subject           text NOT NULL,
  body              text NOT NULL,
  is_factory        boolean NOT NULL DEFAULT false,
  last_used_at      timestamptz
);

ALTER TABLE org_email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_admin_own_templates" ON org_email_templates
  FOR ALL USING (
    org_id IS NULL -- factory templates: all can read
    OR EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.supabase_auth_id = auth.uid()
      AND fm.org_id = org_email_templates.org_id
      AND fm.role IN ('org_admin', 'admin')
    )
  );

CREATE POLICY "admin_all_templates" ON org_email_templates
  FOR ALL USING (
    EXISTS (SELECT 1 FROM family_members fm WHERE fm.supabase_auth_id = auth.uid() AND fm.role = 'admin')
  );

-- Factory templates available to all orgs
INSERT INTO org_email_templates (org_id, name, subject, body, is_factory) VALUES
(NULL, 'Monthly Newsletter', 'Village Newsletter — [Month Year]', 'Dear Neighbors,

Welcome to this month''s newsletter!

[YOUR CONTENT HERE]

Warm regards,
[YOUR NAME]
[ORG NAME] Village Network', true),
(NULL, 'Event Announcement', '[Event Name] — [Date]', 'Dear Neighbors,

We are excited to invite you to join us for [Event Name]!

Date: [DATE]
Time: [TIME]
How to join: [PHONE / LOCATION / LINK]

[ADDITIONAL DETAILS]

Please let us know if you have any questions.

Warm regards,
[YOUR NAME]
[ORG NAME] Village Network', true),
(NULL, 'Dues Reminder', 'Annual Dues Reminder — [ORG NAME]', 'Dear Neighbor,

This is a friendly reminder that annual village dues are due.

Dues can be paid by check made out to [ORG NAME] and mailed to our address, or by contacting [CONTACT NAME] at [CONTACT EMAIL].

Sliding scale options are available — please reach out if you would like to discuss.

Thank you for your continued support of our community!

Warm regards,
[YOUR NAME]
[ORG NAME] Village Network', true),
(NULL, 'Volunteer Thank You', 'Thank you, [VOLUNTEER NAME]!', 'Dear [VOLUNTEER NAME],

On behalf of [ORG NAME] and all the seniors you have helped, we want to say a heartfelt thank you.

Your [X hours] of volunteering this [month/year] have made a real difference in the lives of our members.

With gratitude,
[YOUR NAME]
[ORG NAME] Village Network', true),
(NULL, 'New Member Welcome', 'Welcome to [ORG NAME]!', 'Dear [MEMBER NAME],

Welcome to [ORG NAME] Village Network!

We are so glad you are part of our community. As a member, you have access to:
- Volunteer services for everyday tasks
- Monthly social events and gatherings
- Information and referrals to local services

Your first step: introduce yourself to our coordinator at [CONTACT EMAIL].

We look forward to getting to know you!

Warm regards,
[YOUR NAME]
[ORG NAME] Village Network', true);
