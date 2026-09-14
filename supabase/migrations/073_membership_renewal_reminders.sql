-- Migration 073: annual dues renewal reminders (Batch 2, item 4)
-- Track the last renewal-reminder day-offset sent so the cron doesn't email twice.
-- Run once in the Supabase SQL Editor. Safe to re-run.

ALTER TABLE org_memberships ADD COLUMN IF NOT EXISTS last_renewal_reminder_sent int;
-- Values: 30, 14, 7 (days-before-expiry bucket most recently emailed), or NULL.
ALTER TABLE org_memberships ADD COLUMN IF NOT EXISTS last_renewal_reminder_at timestamptz;
