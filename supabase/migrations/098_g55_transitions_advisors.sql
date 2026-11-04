-- G5.5 Life transitions depth
-- Add therapist/grief counselor/chaplain to trusted_advisors
alter table trusted_advisors add column if not exists license_number text;
alter table trusted_advisors add column if not exists license_state char(2);
alter table trusted_advisors add column if not exists telehealth_available boolean default false;
alter table trusted_advisors add column if not exists chaplain_on_request_only boolean default false;

-- Add new categories if the enum or check exists
do $$ begin
  alter table trusted_advisors drop constraint if exists trusted_advisors_category_check;
exception when others then null; end $$;

-- transition_plan_steps for 6-week facility-move checklist
create table if not exists transition_plan_steps (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references transition_plans(id) on delete cascade,
  week_number int not null check (week_number between 1 and 6),
  step_title text not null,
  step_description text,
  status text not null default 'pending' check (status in ('pending','in_progress','done','skipped')),
  due_date date,
  completed_at timestamptz,
  completed_by uuid references members(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_transition_steps_plan on transition_plan_steps(plan_id);
alter table transition_plan_steps enable row level security;
create policy "org staff manage transition steps" on transition_plan_steps for all using (
  plan_id in (
    select id from transition_plans where org_id in (
      select org_id from members where user_id = auth.uid() and role in ('admin','navigator','staff')
    )
  )
);
create policy "members see own steps" on transition_plan_steps for select using (
  plan_id in (select id from transition_plans where member_id in (select id from members where user_id = auth.uid()))
);
