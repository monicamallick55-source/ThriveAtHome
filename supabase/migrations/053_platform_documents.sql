-- Phase 72: Platform Document Library
-- Shared document library for org admins, agency admins, and navigators.
-- Scope: 'org' (org-wide), 'agency' (agency-wide), 'member' (member-specific)
-- Visibility: 'admins_only' | 'members' | 'care_team'
-- Storage bucket: platform-documents (create manually in Supabase Storage → New Bucket → "platform-documents" → private)

CREATE TABLE IF NOT EXISTS platform_documents (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      timestamptz DEFAULT now() NOT NULL,
  -- Scope columns — exactly one is set depending on scope
  org_id          uuid REFERENCES community_orgs(id) ON DELETE CASCADE,
  agency_id       uuid REFERENCES care_agencies(id) ON DELETE CASCADE,
  member_id       uuid REFERENCES members(id) ON DELETE CASCADE,
  scope           text NOT NULL DEFAULT 'org',
  -- 'org' = org-wide document | 'agency' = agency-wide | 'member' = member-specific
  -- Content
  title           text NOT NULL,
  description     text,
  file_name       text NOT NULL,
  file_type       text NOT NULL DEFAULT 'application/octet-stream',
  file_size_bytes int,
  storage_path    text NOT NULL,
  category        text NOT NULL DEFAULT 'general',
  -- policy, form, newsletter, care_plan, clinical, member_specific, general
  visibility      text NOT NULL DEFAULT 'admins_only',
  -- 'admins_only' = only org_admin / agency_admin / navigator
  -- 'members' = visible to org members (family members linked to the org)
  -- 'care_team' = navigators and agency care workers only
  uploaded_by_name text,
  -- Constraints
  CONSTRAINT scope_check CHECK (
    (scope = 'org' AND org_id IS NOT NULL AND agency_id IS NULL AND member_id IS NULL) OR
    (scope = 'agency' AND agency_id IS NOT NULL AND org_id IS NULL AND member_id IS NULL) OR
    (scope = 'member' AND member_id IS NOT NULL)
  )
);

ALTER TABLE platform_documents ENABLE ROW LEVEL SECURITY;

-- Org admin: full control over own org's documents
CREATE POLICY "org_admin_own_docs" ON platform_documents FOR ALL
  USING (
    org_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.supabase_auth_id = auth.uid()
      AND fm.org_id = platform_documents.org_id
      AND fm.role = 'org_admin'
    )
  );

-- Agency admin: full control over own agency's documents
CREATE POLICY "agency_admin_own_docs" ON platform_documents FOR ALL
  USING (
    agency_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.supabase_auth_id = auth.uid()
      AND fm.agency_id = platform_documents.agency_id
      AND fm.role = 'agency_admin'
    )
  );

-- Navigator: can read/write member-specific docs for their members
CREATE POLICY "navigator_member_docs" ON platform_documents FOR ALL
  USING (
    member_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM care_navigators cn
      JOIN navigator_member_assignments nma ON nma.navigator_id = cn.id
      WHERE cn.supabase_auth_id = auth.uid()
      AND nma.member_id = platform_documents.member_id
    )
  );

-- Members/family: can read org documents with visibility='members'
CREATE POLICY "family_read_member_docs" ON platform_documents FOR SELECT
  USING (
    visibility = 'members' AND
    org_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.supabase_auth_id = auth.uid()
      AND fm.org_id = platform_documents.org_id
    )
  );

-- Family: read their own member-specific documents
CREATE POLICY "family_read_own_member_docs" ON platform_documents FOR SELECT
  USING (
    member_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.supabase_auth_id = auth.uid()
      AND fm.member_id = platform_documents.member_id
    )
  );

-- Admin: full access to all documents
CREATE POLICY "admin_all_docs" ON platform_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.supabase_auth_id = auth.uid()
      AND fm.role = 'admin'
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS platform_documents_org_id_idx ON platform_documents(org_id);
CREATE INDEX IF NOT EXISTS platform_documents_agency_id_idx ON platform_documents(agency_id);
CREATE INDEX IF NOT EXISTS platform_documents_member_id_idx ON platform_documents(member_id);
CREATE INDEX IF NOT EXISTS platform_documents_scope_idx ON platform_documents(scope);
