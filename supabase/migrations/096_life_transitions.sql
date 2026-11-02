-- Migration 096: Life Transition Pathways (G5.5)

CREATE TABLE IF NOT EXISTS life_transitions (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   timestamptz DEFAULT now() NOT NULL,
  member_id    uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  pathway      text NOT NULL CHECK (pathway IN ('bereavement','new_diagnosis','moving','caregiver_transition')),
  status       text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','paused')),
  started_at   timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  metadata     jsonb NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_life_transitions_member ON life_transitions (member_id, status);
CREATE INDEX IF NOT EXISTS idx_life_transitions_pathway ON life_transitions (pathway, status);

-- Steps within a pathway
CREATE TABLE IF NOT EXISTS life_transition_steps (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  transition_id   uuid NOT NULL REFERENCES life_transitions(id) ON DELETE CASCADE,
  step_key        text NOT NULL,
  scheduled_for   timestamptz,
  completed_at    timestamptz,
  skipped_at      timestamptz,
  navigator_task_id uuid,
  UNIQUE(transition_id, step_key)
);
CREATE INDEX IF NOT EXISTS idx_transition_steps ON life_transition_steps (transition_id);

-- Pathway resource library
CREATE TABLE IF NOT EXISTS transition_resources (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  pathway     text NOT NULL,
  title       text NOT NULL,
  description text,
  url         text,
  resource_type text NOT NULL DEFAULT 'article', -- 'article'|'phone'|'local'|'pdf'
  sort_order  int NOT NULL DEFAULT 0
);

INSERT INTO transition_resources (pathway, title, description, url, resource_type, sort_order) VALUES
-- Bereavement
('bereavement','Grief Share Support Groups','Local and online grief support groups','https://www.griefshare.org','local',1),
('bereavement','What''s Your Grief','Articles, podcasts, and community for grief','https://whatsyourgrief.com','article',2),
('bereavement','AARP Grief & Loss','Practical guidance and community forum','https://www.aarp.org/home-family/friends-family/grief-and-loss/','article',3),
-- New diagnosis
('new_diagnosis','Medicare Plan Finder','Compare plans that cover your new needs','https://www.medicare.gov/plan-compare/','article',1),
('new_diagnosis','Benefits.gov','Federal benefit programs you may now qualify for','https://www.benefits.gov','article',2),
('new_diagnosis','National Council on Aging BenefitsCheckUp','Screen for 2,500+ benefits programs','https://www.benefitscheckup.org','article',3),
-- Moving/downsizing
('moving','AARP Downsizing Guide','Step-by-step downsizing checklist','https://www.aarp.org/home-family/your-home/downsizing/','article',1),
('moving','National Association of Senior Move Managers','Find certified senior move managers','https://www.nasmm.org','local',2),
('moving','HUD-Approved Housing Counselors','Free or low-cost housing advice','https://www.hud.gov/program_offices/housing/sfh/hcc','local',3),
-- Caregiver transition
('caregiver_transition','ARCH National Respite Network','Find respite care for caregivers','https://archrespite.org','local',1),
('caregiver_transition','Caregiver Action Network','Support and education for family caregivers','https://www.caregiveraction.org','article',2),
('caregiver_transition','Eldercare Locator','Connect to local area agencies on aging','https://eldercare.acl.gov','local',3)
ON CONFLICT DO NOTHING;
