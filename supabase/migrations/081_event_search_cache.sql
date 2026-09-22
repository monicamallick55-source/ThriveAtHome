-- FEATURE-002/003 — cache for location-aware event search results (Google
-- Custom Search + Claude relevance scoring), so repeat lookups for the same
-- zip+query within 24 hours don't burn the Google free-tier quota.
CREATE TABLE IF NOT EXISTS event_search_cache (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  timestamptz DEFAULT now() NOT NULL,
  query       text NOT NULL,
  zip_code    text NOT NULL,
  results     jsonb NOT NULL,
  expires_at  timestamptz NOT NULL
);
-- No user-level RLS on event_search_cache — written and read by service role only

CREATE INDEX IF NOT EXISTS idx_event_search_cache_lookup ON event_search_cache (zip_code, query, expires_at);
