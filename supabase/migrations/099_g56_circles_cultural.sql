-- G5.6 Named interest circles + cultural content
alter table community_orgs add column if not exists membership_visibility text not null default 'public'
  check (membership_visibility in ('public','members_only','private'));

create table if not exists circle_content (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references community_orgs(id) on delete cascade,
  org_id uuid references organizations(id),
  title text not null,
  body text,
  media_url text,
  source_url text,
  publish_on date default current_date,
  created_by uuid references members(id),
  created_at timestamptz default now()
);
create index if not exists idx_circle_content_circle on circle_content(circle_id, publish_on);
alter table circle_content enable row level security;

-- Members in the circle can see its content
create policy "circle members see content" on circle_content for select using (
  circle_id in (
    select community_id from community_members
    where member_id in (select id from members where user_id = auth.uid())
    and status = 'active'
  )
  or circle_id in (
    select id from community_orgs where membership_visibility = 'public'
  )
);
create policy "org staff manage circle content" on circle_content for all using (
  org_id in (select org_id from members where user_id = auth.uid() and role in ('admin','navigator','staff','coordinator'))
);

-- Seed the 4 named interest circles (Bay Area org_id placeholder — navigator assigns org_id on first deploy)
-- These are inserted as community_orgs rows with community_type = 'interest'
insert into community_orgs (name, community_type, description, is_active, membership_visibility)
values
  ('Veterans Circle', 'interest', 'A community for senior veterans to connect, share stories, and support one another.', true, 'public'),
  ('LGBTQ+ Seniors Circle', 'interest', 'A welcoming, affirming community for LGBTQ+ seniors. Membership is private — only you and other members can see your participation.', true, 'private'),
  ('Widows & Widowers Circle', 'interest', 'Peer support and connection for those who have lost a spouse or partner.', true, 'members_only'),
  ('Professional Identity Circle', 'interest', 'For retired teachers, nurses, engineers, and other professionals — staying connected to the work that defined you.', true, 'public')
on conflict do nothing;
