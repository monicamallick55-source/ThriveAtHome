-- Migration 111: G7.1 Fraud & Scam Protection
-- fraud_flags table for tracking detected scam patterns across all member touchpoints

-- ── fraud_flags ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS fraud_flags (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at          timestamptz DEFAULT now() NOT NULL,
  member_id           uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  source              text NOT NULL CHECK (source IN (
                        'call_transcript','private_message','community_post',
                        'gift_order','navigator','family','buddy'
                      )),
  source_id           uuid,            -- call id, post id, message id, etc.
  scam_type           text NOT NULL CHECK (scam_type IN (
                        'gift_card','government_impersonation','grandparent',
                        'romance','tech_support','lottery_prize',
                        'investment_crypto','charity','large_purchase','other'
                      )),
  matched_text        text CHECK (char_length(matched_text) <= 200),
  severity            text NOT NULL DEFAULT 'concern'
                        CHECK (severity IN ('concern','urgent')),
  status              text NOT NULL DEFAULT 'open'
                        CHECK (status IN ('open','reviewing','confirmed','false_positive','resolved')),
  family_notified_at  timestamptz,
  resolved_by         uuid REFERENCES family_members(id) ON DELETE SET NULL,
  resolution_note     text,
  navigator_task_id   uuid
);

CREATE INDEX IF NOT EXISTS fraud_flags_member_id_idx ON fraud_flags(member_id);
CREATE INDEX IF NOT EXISTS fraud_flags_status_idx ON fraud_flags(status);
CREATE INDEX IF NOT EXISTS fraud_flags_severity_idx ON fraud_flags(severity);
CREATE INDEX IF NOT EXISTS fraud_flags_created_at_idx ON fraud_flags(created_at DESC);

ALTER TABLE fraud_flags ENABLE ROW LEVEL SECURITY;

-- Members can read their own flags (so they can see alerts if appropriate)
CREATE POLICY "ff_member_read" ON fraud_flags
  FOR SELECT
  USING (member_id = ANY(acting_member_ids()));

-- Family can read flags for their member
CREATE POLICY "ff_family_read" ON fraud_flags
  FOR SELECT
  USING (member_id = ANY(acting_member_ids()));

-- Family can report (insert with source='family')
CREATE POLICY "ff_family_insert" ON fraud_flags
  FOR INSERT
  WITH CHECK (
    source IN ('family', 'navigator') AND
    member_id = ANY(acting_member_ids())
  );

-- Staff (admin/navigator) can do everything
CREATE POLICY "ff_staff_all" ON fraud_flags
  FOR ALL
  USING (is_staff());
