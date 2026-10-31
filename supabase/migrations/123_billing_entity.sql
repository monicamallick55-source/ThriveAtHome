-- Migration 123: billing_entity + migration_status on members
-- Ensures all Stripe subscriptions are tagged to TAH Inc. billing entity

ALTER TABLE members
  ADD COLUMN IF NOT EXISTS billing_entity TEXT NOT NULL DEFAULT 'tah_inc'
    CHECK (billing_entity IN ('tah_inc', 'foundation')),
  ADD COLUMN IF NOT EXISTS migration_status TEXT NOT NULL DEFAULT 'native'
    CHECK (migration_status IN ('native', 'migrated', 'pending_migration'));

COMMENT ON COLUMN members.billing_entity IS 'Which legal entity owns this subscription: tah_inc (default) or foundation (future 501c3)';
COMMENT ON COLUMN members.migration_status IS 'native = joined after TAH Inc formation; migrated = moved from old entity; pending_migration = queued for batch move';
