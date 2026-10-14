-- Migration 108: G5.1 — Add clinical signal columns to check_in_calls
-- These are written by processCallEnded after Anthropic clinical extraction

ALTER TABLE check_in_calls
  ADD COLUMN IF NOT EXISTS fall_risk_mention        boolean,
  ADD COLUMN IF NOT EXISTS pain_mentioned           boolean,
  ADD COLUMN IF NOT EXISTS social_isolation_signal  boolean,
  ADD COLUMN IF NOT EXISTS medication_adherence     boolean,
  ADD COLUMN IF NOT EXISTS cognitive_concern_signal boolean,
  ADD COLUMN IF NOT EXISTS mood_score               numeric(4,1),
  ADD COLUMN IF NOT EXISTS energy_score             numeric(4,1),
  ADD COLUMN IF NOT EXISTS pain_score               numeric(4,1),
  ADD COLUMN IF NOT EXISTS medication_taken         boolean,
  ADD COLUMN IF NOT EXISTS icd10_codes              text[]  DEFAULT '{}';
