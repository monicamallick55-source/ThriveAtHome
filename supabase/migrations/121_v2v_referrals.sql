-- V2V referrals: org admin warm-handoff to another org
-- Applied to DB via SQL editor 2026-10; this file commits it to the repo

CREATE TABLE IF NOT EXISTS v2v_referrals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_org_id   UUID NOT NULL REFERENCES organizations(id),
  to_org_id     UUID NOT NULL REFERENCES organizations(id),
  member_id     UUID NOT NULL REFERENCES members(id),
  referred_by   UUID NOT NULL REFERENCES members(id),
  reason        TEXT,
  notes         TEXT,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','accepted','declined','completed')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_v2v_from_org  ON v2v_referrals(from_org_id);
CREATE INDEX IF NOT EXISTS idx_v2v_to_org    ON v2v_referrals(to_org_id);
CREATE INDEX IF NOT EXISTS idx_v2v_member    ON v2v_referrals(member_id);

ALTER TABLE v2v_referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_admin_insert_v2v"  ON v2v_referrals;
DROP POLICY IF EXISTS "org_admin_select_v2v"  ON v2v_referrals;
DROP POLICY IF EXISTS "org_admin_update_v2v"  ON v2v_referrals;
DROP POLICY IF EXISTS "platform_admin_v2v"    ON v2v_referrals;

CREATE POLICY "org_admin_insert_v2v" ON v2v_referrals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.supabase_auth_id = auth.uid()
        AND fm.org_id = from_org_id
        AND fm.role IN ('org_admin','admin')
    )
  );

CREATE POLICY "org_admin_select_v2v" ON v2v_referrals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.supabase_auth_id = auth.uid()
        AND fm.org_id IN (from_org_id, to_org_id)
        AND fm.role IN ('org_admin','admin')
    )
  );

CREATE POLICY "org_admin_update_v2v" ON v2v_referrals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.supabase_auth_id = auth.uid()
        AND fm.org_id = to_org_id
        AND fm.role IN ('org_admin','admin')
    )
  );

CREATE POLICY "platform_admin_v2v" ON v2v_referrals FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_admin');
