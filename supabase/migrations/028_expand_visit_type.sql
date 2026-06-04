-- Migration 028: Expand visit_type enum for service sub-categories
-- Phase 45 ISSUE Fix 7 — Sub-type propagation across platform
-- These values must be added outside a transaction block in PostgreSQL

-- Transport sub-types
ALTER TYPE visit_type ADD VALUE IF NOT EXISTS 'medical_transport';
ALTER TYPE visit_type ADD VALUE IF NOT EXISTS 'grocery_transport';
ALTER TYPE visit_type ADD VALUE IF NOT EXISTS 'social_transport';

-- Home services sub-types
ALTER TYPE visit_type ADD VALUE IF NOT EXISTS 'house_cleaning';
ALTER TYPE visit_type ADD VALUE IF NOT EXISTS 'laundry_help';
ALTER TYPE visit_type ADD VALUE IF NOT EXISTS 'yard_maintenance';
ALTER TYPE visit_type ADD VALUE IF NOT EXISTS 'home_safety';
ALTER TYPE visit_type ADD VALUE IF NOT EXISTS 'light_repairs';
ALTER TYPE visit_type ADD VALUE IF NOT EXISTS 'decluttering';

-- Meals sub-types
ALTER TYPE visit_type ADD VALUE IF NOT EXISTS 'meal_delivery';
ALTER TYPE visit_type ADD VALUE IF NOT EXISTS 'grocery_shopping';
ALTER TYPE visit_type ADD VALUE IF NOT EXISTS 'cooking_assistance';
ALTER TYPE visit_type ADD VALUE IF NOT EXISTS 'meal_planning';

-- Health sub-types
ALTER TYPE visit_type ADD VALUE IF NOT EXISTS 'telehealth_support';
ALTER TYPE visit_type ADD VALUE IF NOT EXISTS 'medication_reminder';
ALTER TYPE visit_type ADD VALUE IF NOT EXISTS 'mental_health_companion';

-- Tech help sub-types
ALTER TYPE visit_type ADD VALUE IF NOT EXISTS 'smartphone_help';
ALTER TYPE visit_type ADD VALUE IF NOT EXISTS 'computer_help';
ALTER TYPE visit_type ADD VALUE IF NOT EXISTS 'video_calling_setup';
ALTER TYPE visit_type ADD VALUE IF NOT EXISTS 'scam_prevention';

-- Legal/financial sub-type
ALTER TYPE visit_type ADD VALUE IF NOT EXISTS 'benefits_counseling';

-- Companionship sub-types
ALTER TYPE visit_type ADD VALUE IF NOT EXISTS 'friendly_visit';
ALTER TYPE visit_type ADD VALUE IF NOT EXISTS 'event_escort';
ALTER TYPE visit_type ADD VALUE IF NOT EXISTS 'reading_companion';
