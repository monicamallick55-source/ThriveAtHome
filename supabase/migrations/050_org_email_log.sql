-- Phase 70: Org email sent history log
-- Records every email sent to org members for audit and history display

CREATE TABLE IF NOT EXISTS org_sent_emails (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at    timestamptz DEFAULT now() NOT NULL,
  org_id        uuid NOT NULL REFERENCES community_orgs(id) ON DELETE CASCADE,
  subject       text NOT NULL,
  body          text NOT NULL,
  recipient_group text NOT NULL DEFAULT 'all',
  -- 'all', 'program_[id]', 'dues_due', 'custom'
  recipient_count int NOT NULL DEFAULT 0,
  sent_by_name  text
);
ALTER TABLE org_sent_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_admin_own_sent_emails" ON org_sent_emails FOR ALL
  USING (EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.supabase_auth_id = auth.uid()
    AND fm.org_id = org_sent_emails.org_id
    AND fm.role = 'org_admin'
  ));

CREATE POLICY "admin_all_sent_emails" ON org_sent_emails FOR ALL
  USING (EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.supabase_auth_id = auth.uid()
    AND fm.role = 'admin'
  ));
