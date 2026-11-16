-- transition_plans
create table if not exists transition_plans (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id) on delete cascade,
  pathway text,
  status text not null default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table transition_plans enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='transition_plans' and policyname='service role full access') then
    create policy "service role full access" on transition_plans using (true) with check (true);
  end if;
end $$;

create table if not exists transition_steps (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references transition_plans(id) on delete cascade,
  title text not null,
  "order" int default 1,
  status text not null default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table transition_steps enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='transition_steps' and policyname='service role full access') then
    create policy "service role full access" on transition_steps using (true) with check (true);
  end if;
end $$;

create table if not exists tracked_items (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id) on delete cascade,
  title text not null,
  category text,
  status text not null default 'pending',
  navigator_note text,
  item_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table tracked_items enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='tracked_items' and policyname='service role full access') then
    create policy "service role full access" on tracked_items using (true) with check (true);
  end if;
end $$;
