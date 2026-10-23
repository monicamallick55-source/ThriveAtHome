-- Add geo coordinates to circle_events for radius search
-- circle_events is the community/circle events table (distinct from the platform-wide `events`)

alter table circle_events
  add column if not exists latitude  double precision,
  add column if not exists longitude double precision,
  add column if not exists zip_code  text;

-- Partial index on events that have coordinates (only those can be radius-searched)
create index if not exists circle_events_geo_idx
  on circle_events (latitude, longitude)
  where latitude is not null and longitude is not null;

-- Haversine distance in miles as a SQL function (reusable)
create or replace function haversine_miles(
  lat1 double precision, lon1 double precision,
  lat2 double precision, lon2 double precision
) returns double precision
language sql immutable parallel safe as $$
  select 3958.8 * acos(
    least(1.0, cos(radians(lat1)) * cos(radians(lat2))
      * cos(radians(lon2) - radians(lon1))
      + sin(radians(lat1)) * sin(radians(lat2))
    )
  )
$$;
