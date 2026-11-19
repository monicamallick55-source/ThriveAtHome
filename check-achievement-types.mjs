import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
const env = Object.fromEntries(
  readFileSync('/workspaces/ThriveAtHome/.env.local', 'utf8')
    .split('\n').filter(l => l && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^["']|["']$/g,'')] })
)
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
// Check existing rows to see valid types in use
const { data } = await sb.from('member_achievements').select('type').limit(20)
console.log('existing types:', [...new Set(data.map(r => r.type))])
// Try to get constraint from information schema
const { data: d2 } = await sb.rpc('query', { q: "select pg_get_constraintdef(oid) from pg_constraint where conname='member_achievements_type_check'" }).maybeSingle().catch(() => ({data:null}))
console.log('constraint:', d2)
