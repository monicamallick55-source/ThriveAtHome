import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
const env = Object.fromEntries(
  readFileSync('/workspaces/ThriveAtHome/.env.local', 'utf8')
    .split('\n').filter(l => l && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^["']|["']$/g,'')] })
)
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const memberId = '42ffcc14-0878-42fe-a14e-b060f50439aa'

const candidates = [
  'home_from_hospital', 'returned_home', 'surgery_recovery', 'fall_recovery',
  'hospital_discharge', 'rehab_complete', 'wellness_visit', 'medication_milestone',
  'social_connection', 'volunteer_match', 'buddy_match', 'goal_met', 'care_plan_complete',
  'check_in_complete', 'crisis_resolved', 'family_connected', 'life_story',
  'birthday_celebrated', 'anniversary_celebrated', 'community_joined'
]

for (const type of candidates) {
  const { error } = await sb.from('member_achievements')
    .insert({ member_id: memberId, type, occurred_at: new Date().toISOString(), metadata: {} })
    .select('id').maybeSingle()
  if (!error) {
    console.log(`✅ valid: ${type}`)
    await sb.from('member_achievements').delete().eq('member_id', memberId).eq('type', type)
  } else if (error.code === '23514') {
    console.log(`❌ invalid: ${type}`)
  } else {
    console.log(`⚠ ${type}: ${error.message}`)
  }
}
