-- G5.9: Hospital referrals for FHIR ServiceRequest intake
CREATE TABLE IF NOT EXISTS hospital_referrals (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      timestamptz DEFAULT now() NOT NULL,
  member_id       uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  fhir_request_id text,
  referring_org   text,
  reason_code     text,
  reason_text     text,
  priority        text NOT NULL DEFAULT 'routine' CHECK (priority IN ('routine','urgent','asap','stat')),
  status          text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','cancelled','entered-in-error')),
  authored_on     timestamptz NOT NULL DEFAULT now(),
  raw_payload     jsonb
);
CREATE INDEX IF NOT EXISTS idx_hr_member ON hospital_referrals(member_id, created_at);
ALTER TABLE hospital_referrals ENABLE ROW LEVEL SECURITY;
