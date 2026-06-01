-- Migration 024: Add loss_anniversary_date to grief_support_requests (Phase 43)

ALTER TABLE grief_support_requests
  ADD COLUMN IF NOT EXISTS loss_anniversary_date date;
