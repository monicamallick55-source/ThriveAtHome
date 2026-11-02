-- Migration 098: Navigator time logging + seat limits (G5.7)

-- Navigator seat config (one row per plan tier)
CREATE TABLE IF NOT EXISTS navigator_seat_config (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_tier     text NOT NULL UNIQUE, -- 'basic'|'complete'|'premier'
  monthly_minutes int NOT NULL,       -- allocated navigator minutes per month
  max_members   int,                  -- NULL = unlimited
  created_at    timestamptz DEFAULT now() NOT NULL
);

INSERT INTO navigator_seat_config (plan_tier, monthly_minutes, max_members) VALUES
('basic',    30,  NULL),
('complete', 60,  NULL),
('premier',  180, NULL)
ON CONFLICT (plan_tier) DO NOTHING;

-- Time log: every navigator interaction billed against member's allocation
CREATE TABLE IF NOT EXISTS navigator_time_log (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at     timestamptz DEFAULT now() NOT NULL,
  member_id      uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  navigator_id   uuid REFERENCES family_members(id) ON DELETE SET NULL,
  task_id        uuid REFERENCES navigator_tasks(id) ON DELETE SET NULL,
  started_at     timestamptz NOT NULL,
  ended_at       timestamptz,
  duration_minutes int GENERATED ALWAYS AS (
    CASE WHEN ended_at IS NOT NULL
    THEN GREATEST(1, EXTRACT(EPOCH FROM (ended_at - started_at)) / 60)::int
    ELSE NULL END
  ) STORED,
  log_type       text NOT NULL DEFAULT 'call', -- 'call'|'task'|'message'|'research'
  notes          text,
  billing_period text NOT NULL -- 'YYYY-MM'
);
CREATE INDEX IF NOT EXISTS idx_nav_time_member ON navigator_time_log (member_id, billing_period);
CREATE INDEX IF NOT EXISTS idx_nav_time_period ON navigator_time_log (billing_period);

-- Monthly usage summary (materialised by cron)
CREATE TABLE IF NOT EXISTS navigator_usage_summary (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id        uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  billing_period   text NOT NULL, -- 'YYYY-MM'
  plan_tier        text NOT NULL,
  allocated_minutes int NOT NULL,
  used_minutes     int NOT NULL DEFAULT 0,
  overage_minutes  int NOT NULL DEFAULT 0,
  last_computed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(member_id, billing_period)
);
CREATE INDEX IF NOT EXISTS idx_nav_usage_member ON navigator_usage_summary (member_id, billing_period);
