-- Migration 091: G5.4 Celebrations depth
ALTER TABLE members ADD COLUMN IF NOT EXISTS celebration_opt_out boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS milestone_birthday_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  age integer NOT NULL UNIQUE,
  program_name text NOT NULL,
  description text,
  gifts jsonb DEFAULT '[]',
  special_call_agent text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE milestone_birthday_programs ENABLE ROW LEVEL SECURITY;
