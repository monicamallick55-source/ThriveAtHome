-- G4 Volunteer training gate
-- Tracks required modules and completion per volunteer
create table if not exists volunteer_training_requirements (
  id uuid primary key default gen_random_uuid(),
  module_name text not null unique,
  display_name text not null,
  required_for text[] not null default '{}',  -- ['buddy','companion','driver','all']
  created_at timestamptz default now()
);

insert into volunteer_training_requirements (module_name, display_name, required_for) values
  ('orientation', 'Volunteer Orientation', ARRAY['all']),
  ('hipaa_privacy', 'HIPAA & Privacy', ARRAY['all']),
  ('senior_sensitivity', 'Senior Sensitivity Training', ARRAY['all']),
  ('buddy_skills', 'Buddy Call Skills', ARRAY['buddy']),
  ('companion_safety', 'Companion Safety', ARRAY['companion']),
  ('driver_safety', 'Safe Driver Training', ARRAY['driver'])
on conflict (module_name) do nothing;

create table if not exists volunteer_training_completions (
  id uuid primary key default gen_random_uuid(),
  volunteer_id uuid not null references volunteers(id) on delete cascade,
  module_name text not null references volunteer_training_requirements(module_name),
  completed_at timestamptz default now(),
  verified_by uuid references members(id),
  unique(volunteer_id, module_name)
);
create index if not exists idx_training_completions_volunteer
  on volunteer_training_completions(volunteer_id);
