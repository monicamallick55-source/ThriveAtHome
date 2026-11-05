-- ThriveAtHome — Seed Communities (20 circles) | TC-M005 / TC-M054
-- Safe to re-run (INSERT ... ON CONFLICT DO NOTHING)

INSERT INTO communities (name, community_type, description, is_named, membership_visibility, is_active)
VALUES
  ('African American Seniors Circle',  'cultural', 'Community for African American seniors',          false, 'public',       true),
  ('Asian Pacific Islander Circle',    'cultural', 'Community for AAPI seniors',                      false, 'public',       true),
  ('Latinx Seniors Circle',            'cultural', 'Comunidad para seniors latinos',                  false, 'public',       true),
  ('Jewish Seniors Circle',            'cultural', 'Community for Jewish seniors',                    false, 'public',       true),
  ('Catholic Seniors Circle',          'cultural', 'Community for Catholic seniors',                  false, 'public',       true),
  ('Muslim Seniors Circle',            'cultural', 'Community for Muslim seniors',                    false, 'public',       true),
  ('South Asian Seniors Circle',       'cultural', 'Community for South Asian seniors',               false, 'public',       true),
  ('Native American Seniors Circle',   'cultural', 'Community for Native American seniors',           false, 'public',       true),
  ('Caribbean Seniors Circle',         'cultural', 'Community for Caribbean seniors',                 false, 'public',       true),
  ('Eastern European Seniors Circle',  'cultural', 'Community for Eastern European seniors',          false, 'public',       true),
  ('Middle Eastern Seniors Circle',    'cultural', 'Community for Middle Eastern seniors',            false, 'public',       true),
  ('Pacific Islander Seniors Circle',  'cultural', 'Community for Pacific Islander seniors',          false, 'public',       true),
  ('Veterans Circle',                  'interest',  'For veterans and military families',             true,  'public',       true),
  ('LGBTQ+ Seniors Circle',            'interest',  'Safe space for LGBTQ+ seniors',                 true,  'members_only', true),
  ('Widows & Widowers Circle',         'interest',  'Support for those who have lost a spouse',       true,  'public',       true),
  ('Professional Identity Circle',     'interest',  'Connecting retired professionals by field',      true,  'public',       true),
  ('Gardening Circle',                 'interest',  'Tips and community for senior gardeners',        false, 'public',       true),
  ('Book Club Circle',                 'interest',  'Monthly reads and discussion',                   false, 'public',       true),
  ('Fitness & Wellness Circle',        'interest',  'Exercise, movement, and healthy aging',          false, 'public',       true),
  ('Creative Arts Circle',             'interest',  'Painting, crafts, music, and creative expression',false,'public',      true)
ON CONFLICT (name) DO NOTHING;
