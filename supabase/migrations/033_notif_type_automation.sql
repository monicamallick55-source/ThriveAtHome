-- Add automation notification types and important_date_reminder to notif_type enum
ALTER TYPE notif_type ADD VALUE IF NOT EXISTS 'important_date_reminder';
ALTER TYPE notif_type ADD VALUE IF NOT EXISTS 'automation_isolation';
ALTER TYPE notif_type ADD VALUE IF NOT EXISTS 'automation_vaccination';
ALTER TYPE notif_type ADD VALUE IF NOT EXISTS 'automation_volunteer_reengagement';
ALTER TYPE notif_type ADD VALUE IF NOT EXISTS 'automation_event_noshow';
ALTER TYPE notif_type ADD VALUE IF NOT EXISTS 'automation_onboarding';
ALTER TYPE notif_type ADD VALUE IF NOT EXISTS 'automation_transport_followup';
ALTER TYPE notif_type ADD VALUE IF NOT EXISTS 'automation_tech_help_check';
ALTER TYPE notif_type ADD VALUE IF NOT EXISTS 'automation_meal_feedback';
