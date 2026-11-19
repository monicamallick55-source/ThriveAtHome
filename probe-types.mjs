import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
const env = Object.fromEntries(
  readFileSync('/workspaces/ThriveAtHome/.env.local', 'utf8')
    .split('\n').filter(l => l && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^["']|["']$/g,'')] })
)
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const memberId = '42ffcc14-0878-42fe-a14e-b060f50439aa'

const candidates = ['badge', 'milestone', 'streak', 'recognition', 'award', 'completion',
  'first_call', 'check_in_streak', 'volunteer_hours', 'birthday', 'anniversary',
  'home_from_hospital', 'joined', 'goal_met']

for (const type of candidates) {
  const { error } = await sb.from('member_achievements')
    .insert({ member_id: memberId, type, occurred_at: new Date().toISOString(), metadata: {} })
    .select('id').maybeSingle()
  if (!error) {
    console.log(`✅ valid: ${type}`)
    // clean it up
    await sb.from('member_achievements').delete().eq('member_id', memberId).eq('type', type)
      .neq('occurred_at', '2026-10-01T00:00:00Z')
  } else if (error.code === '23514') {
    console.log(`❌ invalid: ${type}`)
  } else {
    console.log(`⚠ ${type}: ${error.message}`)
  }
}
