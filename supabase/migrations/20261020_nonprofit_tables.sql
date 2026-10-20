-- Migration: Nonprofit platform tables
-- 2026-10-20

-- ─── NONPROFIT ORGS ──────────────────────────────────────────────────────────

create table if not exists nonprofit_orgs (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  org_type              text not null check (org_type in (
                          'area_agency_on_aging', 'village_network', 'senior_center',
                          'faith_organization', 'community_foundation', 'housing_authority',
                          'healthcare_system', 'other_nonprofit'
                        )),
  ein                   text,                    -- federal EIN, e.g. "12-3456789"
  contact_name          text not null,
  contact_email         text not null unique,
  contact_phone         text,
  address_city          text,
  address_state         text,
  website               text,
  is_verified           boolean not null default false,
  total_referrals       integer not null default 0,
  active_sponsored_count integer not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists nonprofit_orgs_email_idx on nonprofit_orgs (contact_email);

-- ─── NONPROFIT REFERRALS ─────────────────────────────────────────────────────

create table if not exists nonprofit_referrals (
  id                        uuid primary key default gen_random_uuid(),
  nonprofit_org_id          uuid not null references nonprofit_orgs(id),
  senior_full_name          text not null,
  senior_phone              text not null,
  senior_email              text,
  senior_address_city       text,
  senior_address_state      text,
  senior_dob_year           integer,
  tier_requested            text not null check (tier_requested in ('community_free', 'community_subsidised')),
  reason_for_referral       text not null,
  financial_need_confirmed  boolean not null default false,
  status                    text not null default 'submitted' check (status in (
                              'submitted', 'under_review', 'approved', 'enrolled', 'declined'
                            )),
  member_id                 uuid references members(id),
  sponsored_membership_id   uuid,
  decline_reason            text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index if not exists nonprofit_referrals_org_idx on nonprofit_referrals (nonprofit_org_id);
create index if not exists nonprofit_referrals_status_idx on nonprofit_referrals (status);

-- ─── SPONSORED MEMBERSHIPS ───────────────────────────────────────────────────

create table if not exists sponsored_memberships (
  id                          uuid primary key default gen_random_uuid(),
  member_id                   uuid not null references members(id),
  nonprofit_org_id            uuid not null references nonprofit_orgs(id),
  tier                        text not null check (tier in ('community_free', 'community_subsidised')),
  status                      text not null default 'active' check (status in (
                                'pending_review', 'active', 'paused', 'expired', 'revoked'
                              )),
  monthly_subsidy_cents       integer not null default 0,
  member_monthly_cost_cents   integer not null default 0,
  referral_notes              text,
  navigator_notes             text,
  navigator_id                uuid references members(id),
  approved_at                 timestamptz,
  start_date                  date,
  end_date                    date,
  renewal_date                date,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

-- back-reference from referrals
alter table nonprofit_referrals
  add constraint fk_sponsored_membership
  foreign key (sponsored_membership_id) references sponsored_memberships(id)
  not valid;  -- allow rows without a membership yet

create index if not exists sponsored_memberships_member_idx on sponsored_memberships (member_id);
create index if not exists sponsored_memberships_org_idx on sponsored_memberships (nonprofit_org_id);
create index if not exists sponsored_memberships_status_idx on sponsored_memberships (status);

-- ─── HELPER RPC FUNCTIONS ────────────────────────────────────────────────────

create or replace function increment_nonprofit_referrals(org_id uuid)
returns void language plpgsql as $$
begin
  update nonprofit_orgs
  set total_referrals = total_referrals + 1,
      updated_at = now()
  where id = org_id;
end;
$$;

create or replace function increment_nonprofit_active(org_id uuid)
returns void language plpgsql as $$
begin
  update nonprofit_orgs
  set active_sponsored_count = active_sponsored_count + 1,
      updated_at = now()
  where id = org_id;
end;
$$;

-- ─── TRIGGER: updated_at ─────────────────────────────────────────────────────

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger nonprofit_orgs_updated_at before update on nonprofit_orgs
  for each row execute function set_updated_at();

create trigger nonprofit_referrals_updated_at before update on nonprofit_referrals
  for each row execute function set_updated_at();

create trigger sponsored_memberships_updated_at before update on sponsored_memberships
  for each row execute function set_updated_at();

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────────────────
-- Service role key (used by admin client) bypasses RLS.
-- These policies restrict direct PostgREST access.

alter table nonprofit_orgs enable row level security;
alter table nonprofit_referrals enable row level security;
alter table sponsored_memberships enable row level security;

-- Service role can do everything
create policy "service_role_all_nonprofit_orgs" on nonprofit_orgs
  for all using (auth.role() = 'service_role');

create policy "service_role_all_nonprofit_referrals" on nonprofit_referrals
  for all using (auth.role() = 'service_role');

create policy "service_role_all_sponsored_memberships" on sponsored_memberships
  for all using (auth.role() = 'service_role');
