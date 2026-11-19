import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
const env = Object.fromEntries(
  readFileSync('/workspaces/ThriveAtHome/.env.local', 'utf8')
    .split('\n').filter(l => l && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^["']|["']$/g,'')] })
)
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

// Drop old constraint and add expanded one
const { error } = await sb.rpc('exec_sql', { sql: `
  ALTER TABLE member_achievements 
    DROP CONSTRAINT IF EXISTS member_achievements_type_check;
  ALTER TABLE member_achievements 
    ADD CONSTRAINT member_achievements_type_check 
    CHECK (type IN (
      'home_from_hospital',
      'badge',
      'milestone', 
      'streak',
      'recognition'
    ));
`})
console.log('migration:', error ?? '✅ done')
