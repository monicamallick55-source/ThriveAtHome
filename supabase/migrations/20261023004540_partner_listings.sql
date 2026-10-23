create table if not exists public.partner_listings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  bio text,
  category text not null,
  categories text[] default '{}',
  address text,
  city text,
  state text,
  zip text,
  lat numeric(10,6),
  lng numeric(10,6),
  phone text,
  website text,
  email text,
  logo_url text,
  verified boolean default false,
  featured boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists partner_listings_state_idx on public.partner_listings(state);
create index if not exists partner_listings_category_idx on public.partner_listings(category);
create index if not exists partner_listings_verified_idx on public.partner_listings(verified);

alter table public.partner_listings enable row level security;

create policy "Public can read verified listings"
  on public.partner_listings for select
  using (verified = true);

create policy "Admins can manage all listings"
  on public.partner_listings for all
  using (auth.jwt() ->> 'role' in ('admin', 'network_admin', 'nonprofit_admin'));
