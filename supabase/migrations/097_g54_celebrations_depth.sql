-- G5.4 Celebrations depth
alter table members add column if not exists celebration_opt_out boolean not null default false;

create table if not exists milestone_birthday_programs (
  id uuid primary key default gen_random_uuid(),
  age int not null unique,
  offering text not null,
  created_at timestamptz default now()
);

insert into milestone_birthday_programs (age, offering) values
  (70, 'life_story_video_prompt'),
  (75, 'memory_book_navigator_call'),
  (80, 'recorded_phone_interview'),
  (85, 'full_celebration_community_toast'),
  (90, 'full_celebration_community_toast'),
  (95, 'full_celebration_community_toast'),
  (100, 'full_celebration_community_toast')
on conflict (age) do nothing;

create table if not exists member_achievements (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  org_id uuid references organizations(id),
  achievement_type text not null,
  occurred_at timestamptz default now(),
  shared_with_family boolean not null default true,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);
create index if not exists idx_member_achievements_member on member_achievements(member_id);
alter table member_achievements enable row level security;
create policy "members see own achievements" on member_achievements for select using (
  member_id in (select id from members where user_id = auth.uid())
);
create policy "org staff see achievements" on member_achievements for all using (
  org_id in (select org_id from members where user_id = auth.uid() and role in ('admin','navigator','staff'))
);
