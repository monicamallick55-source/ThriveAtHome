-- B2B Agent Customization: org_agent_configs table

CREATE TABLE IF NOT EXISTS org_agent_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES brand_configs(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  persona_name TEXT,
  greeting TEXT,
  tone TEXT DEFAULT 'warm',
  system_prompt_override TEXT,
  programs JSONB DEFAULT '[]',
  contacts JSONB DEFAULT '[]',
  custom_faqs JSONB DEFAULT '[]',
  off_limits_topics TEXT[],
  referral_triggers JSONB DEFAULT '[]',
  config_version INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, agent_type)
);

CREATE INDEX IF NOT EXISTS idx_org_agent_configs_org_id ON org_agent_configs(org_id);
CREATE INDEX IF NOT EXISTS idx_org_agent_configs_active ON org_agent_configs(org_id, is_active);

ALTER TABLE org_agent_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_admin_manage_agent_configs" ON org_agent_configs
  FOR ALL USING (
    org_id IN (
      SELECT org_id FROM family_members
      WHERE supabase_auth_id = auth.uid()
      AND role IN ('org_admin', 'admin')
    )
  );

CREATE POLICY "members_read_active_configs" ON org_agent_configs
  FOR SELECT USING (
    is_active = true
    AND org_id IN (
      SELECT org_id FROM family_members
      WHERE supabase_auth_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS org_agent_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES brand_configs(id),
  agent_type TEXT NOT NULL,
  member_id UUID,
  session_id TEXT,
  interaction_type TEXT,
  escalated_to_human BOOLEAN DEFAULT false,
  satisfaction_score INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_org_agent_interactions_org ON org_agent_interactions(org_id, created_at);
