-- FEATURE-013: navigator_applications table for the /careers/navigator apply form.
CREATE TABLE IF NOT EXISTS navigator_applications (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at     timestamptz DEFAULT now() NOT NULL,
  full_name      text NOT NULL,
  email          text NOT NULL,
  linkedin_url   text,
  why_interested text NOT NULL,
  status         text NOT NULL DEFAULT 'pending'
);

ALTER TABLE navigator_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_navigator_applications" ON navigator_applications FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM family_members fm WHERE fm.supabase_auth_id = auth.uid() AND fm.role = 'admin'));

-- Service role can always insert (unauthenticated public application form)
CREATE POLICY "service_role_insert_navigator_applications" ON navigator_applications FOR INSERT
  WITH CHECK (true);
