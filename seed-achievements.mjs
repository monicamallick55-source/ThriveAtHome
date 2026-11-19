import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
const env = Object.fromEntries(
  readFileSync('/workspaces/ThriveAtHome/.env.local', 'utf8')
    .split('\n').filter(l => l && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^["']|["']$/g,'')] })
)
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const memberId = '42ffcc14-0878-42fe-a14e-b060f50439aa' // Jane Smith

const achievements = [
  { member_id: memberId, type: 'badge',        occurred_at: '2026-10-01T00:00:00Z', shared_with_family: true,  metadata: { badge_name: 'Early Bird', description: 'Completed 5 morning check-ins' } },
  { member_id: memberId, type: 'milestone',    occurred_at: '2026-10-15T00:00:00Z', shared_with_family: true,  metadata: { description: '30 days on the platform' } },
  { member_id: memberId, type: 'streak',       occurred_at: '2026-11-01T00:00:00Z', shared_with_family: false, metadata: { days: 7, description: '7-day check-in streak' } },
  { member_id: memberId, type: 'recognition',  occurred_at: '2026-11-10T00:00:00Z', shared_with_family: true,  metadata: { description: 'Nominated as a community helper' } },
]

for (const a of achievements) {
  const { data, error } = await sb.from('member_achievements').insert(a).select('id, type').maybeSingle()
  if (error) console.log(`⚠ ${a.type}: ${error.message}`)
  else console.log(`✅ ${a.type}: ${data.id}`)
}
