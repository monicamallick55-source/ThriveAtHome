import { createClient } from '@supabase/supabase-js'
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
const { data, error } = await sb.from('member_achievements').select('*').limit(10)
console.log('achievements:', JSON.stringify(data, null, 2))
console.log('error:', error)
