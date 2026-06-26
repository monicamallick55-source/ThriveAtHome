-- Phase 60 — White Label / Co-branding
-- Stores per-agency branding configuration (logo, colors, display name).
-- ThriveAtHome branding is always visible — brand_integrity enforced at the application layer.

CREATE TABLE IF NOT EXISTS brand_configs (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at            timestamptz DEFAULT now() NOT NULL,
  updated_at            timestamptz DEFAULT now() NOT NULL,
  agency_id             uuid NOT NULL REFERENCES care_agencies(id) ON DELETE CASCADE,
  agency_display_name   text,
  -- If set, shown as the primary label on co-branded pages (e.g. "Golden Gate Home Care")
  primary_color         text NOT NULL DEFAULT '#1B3A6B',
  -- Hex color for agency accent (defaults to ThriveAtHome navy)
  secondary_color       text NOT NULL DEFAULT '#2A9D8F',
  logo_storage_path     text,
  -- Supabase Storage path: brand-assets/<agency_id>/logo.png
  logo_url              text,
  -- Public URL once uploaded
  tagline               text,
  -- Agency tagline shown below co-branded header, optional
  powered_by_label      text NOT NULL DEFAULT 'Powered by ThriveAtHome',
  -- Always displayed — cannot be set to empty. Application layer enforces this.
  is_active             boolean NOT NULL DEFAULT true,
  UNIQUE(agency_id)
);
ALTER TABLE brand_configs ENABLE ROW LEVEL SECURITY;

-- Agency admins can read and update their own brand config
CREATE POLICY "agency_admin_all_own_brand_config" ON brand_configs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.supabase_auth_id = auth.uid()
      AND fm.role = 'agency_admin'
      AND EXISTS (
        SELECT 1 FROM care_agencies ca WHERE ca.id = brand_configs.agency_id AND ca.id = fm.agency_id
      )
    )
  );

-- Admins can see all brand configs
CREATE POLICY "admin_all_brand_configs" ON brand_configs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.supabase_auth_id = auth.uid() AND fm.role = 'admin'
    )
  );

-- Family members can read the brand config for agencies connected to their member
CREATE POLICY "family_read_linked_agency_brand" ON brand_configs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      JOIN agency_referrals ar ON ar.member_id = fm.member_id
      WHERE fm.supabase_auth_id = auth.uid()
      AND ar.agency_id = brand_configs.agency_id
    )
  );

-- Update trigger to maintain updated_at
CREATE OR REPLACE FUNCTION update_brand_configs_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER brand_configs_updated_at
  BEFORE UPDATE ON brand_configs
  FOR EACH ROW EXECUTE FUNCTION update_brand_configs_updated_at();

-- Storage bucket for brand assets (logos, etc.) — run in Supabase Storage dashboard:
-- Create private bucket named "brand-assets"
-- RLS: agency_admin can upload to brand-assets/<their-agency-id>/*
-- Family can read files in brand-assets/* (public logos for co-branding display)

-- Seed Golden Gate Home Care brand config (references seed from migration 039)
INSERT INTO brand_configs (agency_id, agency_display_name, primary_color, secondary_color, tagline)
SELECT id, name, '#1B3A6B', '#2A9D8F', 'Compassionate care at home'
FROM care_agencies WHERE name = 'Golden Gate Home Care'
ON CONFLICT (agency_id) DO NOTHING;
