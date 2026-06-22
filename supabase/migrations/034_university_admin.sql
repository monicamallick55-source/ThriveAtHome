-- Phase 52: University Partnership Portal (Full)
-- Adds university_admin role and links university admins to their institution

-- Add university_admin to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'university_admin';

-- Add university_name to family_members so university admin accounts know which institution they manage
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS university_name text;

-- Admin-level RLS policy: university_admin can read student_volunteers for their university
-- Applied via service role in server code (admin client bypasses RLS)
-- These are documentation-only policies; server code uses admin client for university admin queries
