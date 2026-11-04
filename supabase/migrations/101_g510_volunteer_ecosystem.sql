-- G5.10 Volunteer ecosystem completion
alter table volunteers add column if not exists vso_affiliation text
  check (vso_affiliation in ('VFW','American Legion','DAV','AMVETS','MOAA','other'));

alter table corporate_volunteer_programs add column if not exists tier text
  check (tier in ('partner','champion','leader'));

-- Tier hour targets: partner=200, champion=500, leader=500+
-- Stored in a simple config table
create table if not exists corporate_tier_config (
  tier text primary key,
  hour_target int not null,
  badge_label text not null
);
insert into corporate_tier_config values
  ('partner', 200, 'Community Partner'),
  ('champion', 500, 'Community Champion'),
  ('leader', 500, 'Community Leader')
on conflict do nothing;

-- Family reciprocity: family members volunteer for OTHER seniors; credits go to their senior
alter table volunteer_hours add column if not exists earned_for_member_id uuid references members(id);
-- Guard: family volunteers cannot be matched to their own senior's requests
-- Enforced at API level (not DB-level FK — the relationship is flexible)
