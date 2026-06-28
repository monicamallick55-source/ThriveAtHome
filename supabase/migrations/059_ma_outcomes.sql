-- Migration 059: Medicare Advantage Outcomes Data Package (Phase 76)
-- Adds structured clinical fields to check_in_calls, icd10_codes to alerts

-- Structured clinical fields for Aria call summaries
ALTER TABLE check_in_calls
  ADD COLUMN IF NOT EXISTS pain_mentioned boolean,
  ADD COLUMN IF NOT EXISTS medication_adherence boolean,
  ADD COLUMN IF NOT EXISTS social_isolation_signal boolean,
  ADD COLUMN IF NOT EXISTS fall_risk_mention boolean,
  ADD COLUMN IF NOT EXISTS cognitive_concern_signal boolean;

-- ICD-10 code mapping on alerts (array of codes e.g. ['W19', 'Z91.81'])
ALTER TABLE alerts
  ADD COLUMN IF NOT EXISTS icd10_codes text[] NOT NULL DEFAULT '{}';
