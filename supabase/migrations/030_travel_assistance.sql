-- Migration 030: Travel Assistance visit_type values
-- Phase 45 ISSUE — Travel Assistance as 8th service category
-- Add travel companion visit type for volunteer matching

ALTER TYPE visit_type ADD VALUE IF NOT EXISTS 'travel_companion';
ALTER TYPE visit_type ADD VALUE IF NOT EXISTS 'travel_coordination';
