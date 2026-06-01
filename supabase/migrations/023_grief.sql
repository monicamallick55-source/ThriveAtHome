-- Migration 023: Grief Support Requests (Phase 42)

CREATE TABLE grief_support_requests (
  id                      uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at              timestamptz DEFAULT now() NOT NULL,
  member_id               uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  loss_type               text NOT NULL,
  circle_type_requested   text,
  availability_preference text,
  additional_notes        text,
  status                  text NOT NULL DEFAULT 'pending',
  navigator_notes         text,
  matched_at              timestamptz
);

ALTER TABLE grief_support_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "family_all_own_grief_requests" ON grief_support_requests FOR ALL
USING (EXISTS (
  SELECT 1 FROM family_members fm
  WHERE fm.member_id = grief_support_requests.member_id
    AND fm.supabase_auth_id = auth.uid()
));

CREATE POLICY "navigator_read_grief_requests" ON grief_support_requests FOR SELECT
USING (EXISTS (
  SELECT 1 FROM family_members fm
  WHERE fm.supabase_auth_id = auth.uid()
    AND fm.role IN ('navigator', 'admin')
));

CREATE POLICY "navigator_update_grief_requests" ON grief_support_requests FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM family_members fm
  WHERE fm.supabase_auth_id = auth.uid()
    AND fm.role IN ('navigator', 'admin')
));
