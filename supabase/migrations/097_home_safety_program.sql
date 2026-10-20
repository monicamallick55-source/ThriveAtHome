-- 097_home_safety_program.sql
-- G6.1 — Home Safety & Earthquake Preparedness Program
-- Modelled on Foster City Village's 2025-2026 programme

-- Safety Programmes (per org, or ThriveAtHome-run when org_id IS NULL)
CREATE TABLE IF NOT EXISTS safety_programs (
  id                          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at                  timestamptz DEFAULT now() NOT NULL,
  org_id                      uuid,  -- references org; FK omitted until org table is confirmed
  name                        text NOT NULL,
  program_year                text NOT NULL,            -- e.g. '2026'
  description                 text,
  eligibility                 jsonb NOT NULL DEFAULT '{}', -- e.g. {"org_tiers":["full"]}
  capacity_households         integer NOT NULL DEFAULT 20,
  enrollment_open             boolean NOT NULL DEFAULT true,
  starts_on                   date,
  ends_on                     date,
  free_item_budget_cents      integer NOT NULL DEFAULT 0,
  subsidy_per_home_cents      integer NOT NULL DEFAULT 0,
  contractor_partner_id       uuid REFERENCES community_partners(id),
  income_referral_partner_id  uuid REFERENCES community_partners(id),
  sponsors                    jsonb NOT NULL DEFAULT '[]', -- [{name, logo_url, amount_cents}]
  created_by                  uuid REFERENCES family_members(id)
);
ALTER TABLE safety_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sp_read"  ON safety_programs FOR SELECT USING (is_staff() OR org_id IS NULL OR EXISTS (
  SELECT 1 FROM org_memberships om WHERE om.org_id = safety_programs.org_id AND om.member_id = ANY(acting_member_ids())
));
CREATE POLICY "sp_staff_write" ON safety_programs FOR ALL USING (is_staff());

-- Enrolments — one per household per programme
CREATE TABLE IF NOT EXISTS safety_program_enrollments (
  id                 uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at         timestamptz DEFAULT now() NOT NULL,
  program_id         uuid NOT NULL REFERENCES safety_programs(id) ON DELETE CASCADE,
  member_id          uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  home_type          text NOT NULL DEFAULT 'single_family'
                     CHECK (home_type IN ('single_family','condo','townhouse','apartment','mobile_home','other')),
  comments           text,
  status             text NOT NULL DEFAULT 'applied'
                     CHECK (status IN ('applied','waitlisted','enrolled','training_scheduled','inspected',
                                       'proposal_sent','work_in_progress','complete','declined','withdrawn')),
  volunteer_id       uuid REFERENCES members(id),
  income_qualified   boolean,                           -- self-attested; partner verifies
  consent_terms_at   timestamptz,
  UNIQUE (program_id, member_id)
);
ALTER TABLE safety_program_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "spe_own_or_staff" ON safety_program_enrollments FOR ALL
  USING (member_id = ANY(acting_member_ids()) OR is_staff() OR
         volunteer_id = ANY(acting_member_ids()))
  WITH CHECK (member_id = ANY(acting_member_ids()) OR is_staff());

-- Volunteers assigned to programmes
CREATE TABLE IF NOT EXISTS safety_program_volunteers (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       timestamptz DEFAULT now() NOT NULL,
  program_id       uuid NOT NULL REFERENCES safety_programs(id) ON DELETE CASCADE,
  volunteer_id     uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  max_households   integer NOT NULL DEFAULT 5,
  trained_at       timestamptz,
  UNIQUE (program_id, volunteer_id)
);
ALTER TABLE safety_program_volunteers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "spv_read" ON safety_program_volunteers FOR SELECT
  USING (is_staff() OR volunteer_id = ANY(acting_member_ids()));
CREATE POLICY "spv_staff_write" ON safety_program_volunteers FOR ALL USING (is_staff());

-- Home Safety Checks (inspection visits)
CREATE TABLE IF NOT EXISTS home_safety_checks (
  id                      uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at              timestamptz DEFAULT now() NOT NULL,
  enrollment_id           uuid NOT NULL REFERENCES safety_program_enrollments(id) ON DELETE CASCADE,
  member_id               uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  mode                    text NOT NULL DEFAULT 'in_person'
                          CHECK (mode IN ('in_person','virtual')),
  scheduled_at            timestamptz,
  completed_at            timestamptz,
  assessor_volunteer_id   uuid REFERENCES members(id),
  assessor_family_member_id uuid REFERENCES family_members(id),
  status                  text NOT NULL DEFAULT 'scheduled'
                          CHECK (status IN ('scheduled','in_progress','completed','cancelled')),
  report_pdf_path         text
);
ALTER TABLE home_safety_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hsc_own_or_staff" ON home_safety_checks FOR ALL
  USING (member_id = ANY(acting_member_ids()) OR is_staff() OR
         assessor_volunteer_id = ANY(acting_member_ids()))
  WITH CHECK (member_id = ANY(acting_member_ids()) OR is_staff() OR
              assessor_volunteer_id = ANY(acting_member_ids()));

-- Checklist items per check
CREATE TABLE IF NOT EXISTS home_safety_items (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  timestamptz DEFAULT now() NOT NULL,
  check_id    uuid NOT NULL REFERENCES home_safety_checks(id) ON DELETE CASCADE,
  room        text NOT NULL,
  item_key    text NOT NULL,
  result      text NOT NULL DEFAULT 'na'
              CHECK (result IN ('ok','concern','na')),
  note        text,
  photo_path  text
);
ALTER TABLE home_safety_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hsi_via_check" ON home_safety_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM home_safety_checks hsc WHERE hsc.id = home_safety_items.check_id
    AND (hsc.member_id = ANY(acting_member_ids()) OR is_staff() OR
         hsc.assessor_volunteer_id = ANY(acting_member_ids()))
  ));

-- Work tiers per programme (basic / enhanced)
CREATE TABLE IF NOT EXISTS safety_work_tiers (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   timestamptz DEFAULT now() NOT NULL,
  program_id   uuid NOT NULL REFERENCES safety_programs(id) ON DELETE CASCADE,
  tier_key     text NOT NULL CHECK (tier_key IN ('basic','enhanced')),
  label        text NOT NULL,
  description  text,
  UNIQUE (program_id, tier_key)
);
ALTER TABLE safety_work_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "swt_read" ON safety_work_tiers FOR SELECT USING (true);
CREATE POLICY "swt_staff_write" ON safety_work_tiers FOR ALL USING (is_staff());

-- Proposals sent to member
CREATE TABLE IF NOT EXISTS safety_proposals (
  id                   uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at           timestamptz DEFAULT now() NOT NULL,
  enrollment_id        uuid NOT NULL REFERENCES safety_program_enrollments(id) ON DELETE CASCADE,
  tier_key             text NOT NULL CHECK (tier_key IN ('basic','enhanced')),
  sent_at              timestamptz,
  responded_at         timestamptz,
  status               text NOT NULL DEFAULT 'draft'
                       CHECK (status IN ('draft','sent','accepted_all','accepted_some','declined')),
  total_free_cents     integer NOT NULL DEFAULT 0,
  total_subsidy_cents  integer NOT NULL DEFAULT 0,
  total_member_cents   integer NOT NULL DEFAULT 0
);
ALTER TABLE safety_proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sproposal_own_or_staff" ON safety_proposals FOR ALL
  USING (EXISTS (
    SELECT 1 FROM safety_program_enrollments spe
    WHERE spe.id = safety_proposals.enrollment_id
    AND (spe.member_id = ANY(acting_member_ids()) OR is_staff() OR
         spe.volunteer_id = ANY(acting_member_ids()))
  ));

-- Proposal line items
CREATE TABLE IF NOT EXISTS safety_proposal_lines (
  id                              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at                      timestamptz DEFAULT now() NOT NULL,
  proposal_id                     uuid NOT NULL REFERENCES safety_proposals(id) ON DELETE CASCADE,
  item_key                        text NOT NULL,
  description                     text NOT NULL,
  route                           text NOT NULL DEFAULT 'contractor'
                                  CHECK (route IN ('contractor','partner_referral','volunteer','member_diy')),
  est_cost_cents                  integer NOT NULL DEFAULT 0,
  contractor_discount_cents       integer NOT NULL DEFAULT 0,
  subsidy_cents                   integer NOT NULL DEFAULT 0,
  member_cost_cents               integer NOT NULL DEFAULT 0,
  accepted                        boolean,                -- null = not yet decided
  work_order_status               text NOT NULL DEFAULT 'not_started'
                                  CHECK (work_order_status IN ('not_started','scheduled','done','verified')),
  completed_at                    timestamptz,
  verified_by_volunteer_at        timestamptz,
  community_partner_referral_id   uuid REFERENCES partner_referrals(id)
);
ALTER TABLE safety_proposal_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "spl_via_proposal" ON safety_proposal_lines FOR ALL
  USING (EXISTS (
    SELECT 1 FROM safety_proposals sp
    JOIN safety_program_enrollments spe ON spe.id = sp.enrollment_id
    WHERE sp.id = safety_proposal_lines.proposal_id
    AND (spe.member_id = ANY(acting_member_ids()) OR is_staff() OR
         spe.volunteer_id = ANY(acting_member_ids()))
  ));

-- Go-Bags per enrollment
CREATE TABLE IF NOT EXISTS go_bags (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at          timestamptz DEFAULT now() NOT NULL,
  enrollment_id       uuid NOT NULL REFERENCES safety_program_enrollments(id) ON DELETE CASCADE,
  delivered_at        timestamptz,
  contents_checklist  jsonb NOT NULL DEFAULT '{}',
  next_refresh_due    date
);
ALTER TABLE go_bags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gb_own_or_staff" ON go_bags FOR ALL
  USING (EXISTS (
    SELECT 1 FROM safety_program_enrollments spe
    WHERE spe.id = go_bags.enrollment_id
    AND (spe.member_id = ANY(acting_member_ids()) OR is_staff())
  ));

-- Emergency fridge magnets
CREATE TABLE IF NOT EXISTS emergency_magnets (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        timestamptz DEFAULT now() NOT NULL,
  enrollment_id     uuid NOT NULL REFERENCES safety_program_enrollments(id) ON DELETE CASCADE,
  generated_pdf_path text,
  printed           boolean NOT NULL DEFAULT false,
  delivered_at      timestamptz
);
ALTER TABLE emergency_magnets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "em_own_or_staff" ON emergency_magnets FOR ALL
  USING (EXISTS (
    SELECT 1 FROM safety_program_enrollments spe
    WHERE spe.id = emergency_magnets.enrollment_id
    AND (spe.member_id = ANY(acting_member_ids()) OR is_staff())
  ));

-- Indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_spe_member ON safety_program_enrollments(member_id);
CREATE INDEX IF NOT EXISTS idx_spe_volunteer ON safety_program_enrollments(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_hsc_enrollment ON home_safety_checks(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_hsi_check ON home_safety_items(check_id);
CREATE INDEX IF NOT EXISTS idx_sp_enrollment ON safety_proposals(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_spl_proposal ON safety_proposal_lines(proposal_id);
