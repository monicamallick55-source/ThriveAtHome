-- Migration 006 — Add 'volunteer' to user_role enum
-- Run in Supabase SQL Editor after 005_volunteers.sql

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'volunteer';
