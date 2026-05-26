-- Migration 007 — Driver verification fields on volunteers table
-- Run in Supabase SQL Editor after 006_volunteer_role.sql

ALTER TABLE volunteers
  ADD COLUMN IF NOT EXISTS has_drivers_license boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS license_state       text,
  ADD COLUMN IF NOT EXISTS insurance_provider  text,
  ADD COLUMN IF NOT EXISTS insurance_expiry    date;
