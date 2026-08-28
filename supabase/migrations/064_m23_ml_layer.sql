-- M23: Advanced AI/ML Layer
-- Phases 93-97: Wellness baseline modeling, Behavioral anomaly detection,
-- Fall risk prediction, Social isolation detection, Grief pattern monitoring.
--
-- The heavy ML models (Isolation Forest, XGBoost, sentiment NLP) run through the
-- MlProvider stub — a transparent, deterministic heuristic — until a real model
-- inference service is configured (ML_INFERENCE_URL). These tables store the
-- platform-side outputs: the rolling baseline per member and each scored result,
-- plus links to any alert / navigator task the score raised.

-- ─── Phase 93: Rolling wellness baseline (one row per member) ─────────────────
CREATE TABLE IF NOT EXISTS wellness_baselines (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at          timestamptz DEFAULT now() NOT NULL,
  member_id           uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  window_days         int NOT NULL DEFAULT 30,
  computed_at         timestamptz NOT NULL DEFAULT now(),
  data_points         int NOT NULL DEFAULT 0,
  status              text NOT NULL DEFAULT 'insufficient_data',
  -- ok | insufficient_data
  mood_mean           numeric,
  mood_std            numeric,
  energy_mean         numeric,
  energy_std          numeric,
  pain_mean           numeric,
  pain_std            numeric,
  sleep_hours_mean    numeric,
  sleep_hours_std     numeric,
  steps_mean          numeric,
  steps_std           numeric,
  resting_hr_mean     numeric,
  resting_hr_std      numeric,
  call_engagement_rate numeric,
  UNIQUE(member_id)
);
ALTER TABLE wellness_baselines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_read_own_wellness_baselines" ON wellness_baselines FOR SELECT
  USING (EXISTS (SELECT 1 FROM family_members fm
    WHERE fm.member_id = wellness_baselines.member_id
    AND fm.supabase_auth_id = auth.uid()));

-- ─── Phase 94: Behavioral anomaly detections (Isolation Forest time-series) ───
CREATE TABLE IF NOT EXISTS behavioral_anomalies (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        timestamptz DEFAULT now() NOT NULL,
  member_id         uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  detected_at       timestamptz NOT NULL DEFAULT now(),
  method            text NOT NULL DEFAULT 'isolation_heuristic',
  anomaly_score     numeric NOT NULL DEFAULT 0,
  -- 0..1, higher = more anomalous
  severity          text NOT NULL DEFAULT 'info',
  -- info | concern | urgent
  top_drivers       text[] DEFAULT '{}',
  features          jsonb NOT NULL DEFAULT '{}',
  alert_id          uuid REFERENCES alerts(id) ON DELETE SET NULL,
  navigator_task_id uuid REFERENCES navigator_tasks(id) ON DELETE SET NULL,
  resolved          boolean NOT NULL DEFAULT false,
  resolved_at       timestamptz
);
ALTER TABLE behavioral_anomalies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_read_own_behavioral_anomalies" ON behavioral_anomalies FOR SELECT
  USING (EXISTS (SELECT 1 FROM family_members fm
    WHERE fm.member_id = behavioral_anomalies.member_id
    AND fm.supabase_auth_id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_behavioral_anomalies_member_time
  ON behavioral_anomalies (member_id, detected_at DESC);

-- ─── Phase 95: Fall risk prediction (XGBoost on sensor + meds + history) ──────
CREATE TABLE IF NOT EXISTS fall_risk_scores (
  id                   uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at           timestamptz DEFAULT now() NOT NULL,
  member_id            uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  computed_at          timestamptz NOT NULL DEFAULT now(),
  model                text NOT NULL DEFAULT 'xgboost_heuristic',
  risk_probability     numeric NOT NULL DEFAULT 0,
  -- 0..1
  risk_band            text NOT NULL DEFAULT 'low',
  -- low | moderate | high
  contributing_factors jsonb NOT NULL DEFAULT '[]',
  navigator_task_id    uuid REFERENCES navigator_tasks(id) ON DELETE SET NULL
);
ALTER TABLE fall_risk_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_read_own_fall_risk_scores" ON fall_risk_scores FOR SELECT
  USING (EXISTS (SELECT 1 FROM family_members fm
    WHERE fm.member_id = fall_risk_scores.member_id
    AND fm.supabase_auth_id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_fall_risk_scores_member_time
  ON fall_risk_scores (member_id, computed_at DESC);

-- ─── Phase 96: Social isolation detection (sentiment NLP + engagement trend) ──
CREATE TABLE IF NOT EXISTS isolation_scores (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at            timestamptz DEFAULT now() NOT NULL,
  member_id             uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  computed_at           timestamptz NOT NULL DEFAULT now(),
  isolation_score       numeric NOT NULL DEFAULT 0,
  -- 0..1, higher = more isolated
  risk_band             text NOT NULL DEFAULT 'low',
  -- low | moderate | high
  sentiment_valence     numeric,
  -- -1..1
  engagement_trend      numeric,
  -- ratio of recent 30d engagement events to prior 30d (1 = flat)
  drivers               text[] DEFAULT '{}',
  suggested_connections jsonb NOT NULL DEFAULT '[]',
  navigator_task_id     uuid REFERENCES navigator_tasks(id) ON DELETE SET NULL
);
ALTER TABLE isolation_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_read_own_isolation_scores" ON isolation_scores FOR SELECT
  USING (EXISTS (SELECT 1 FROM family_members fm
    WHERE fm.member_id = isolation_scores.member_id
    AND fm.supabase_auth_id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_isolation_scores_member_time
  ON isolation_scores (member_id, computed_at DESC);

-- ─── Phase 97: Grief pattern monitoring (prolonged grief disorder risk) ──────
CREATE TABLE IF NOT EXISTS grief_pattern_flags (
  id                            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at                    timestamptz DEFAULT now() NOT NULL,
  member_id                     uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  grief_request_id              uuid REFERENCES grief_support_requests(id) ON DELETE SET NULL,
  computed_at                   timestamptz NOT NULL DEFAULT now(),
  months_since_loss             numeric,
  pgd_risk                      boolean NOT NULL DEFAULT false,
  risk_band                     text NOT NULL DEFAULT 'none',
  -- none | monitoring | elevated | high
  indicators                    text[] DEFAULT '{}',
  professional_referral_suggested boolean NOT NULL DEFAULT false,
  navigator_task_id             uuid REFERENCES navigator_tasks(id) ON DELETE SET NULL
);
ALTER TABLE grief_pattern_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_read_own_grief_pattern_flags" ON grief_pattern_flags FOR SELECT
  USING (EXISTS (SELECT 1 FROM family_members fm
    WHERE fm.member_id = grief_pattern_flags.member_id
    AND fm.supabase_auth_id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_grief_pattern_flags_member_time
  ON grief_pattern_flags (member_id, computed_at DESC);

-- ─── Member-level opt-out of ML wellness intelligence ───────────────────────
ALTER TABLE members ADD COLUMN IF NOT EXISTS ml_insights_opt_out boolean NOT NULL DEFAULT false;
