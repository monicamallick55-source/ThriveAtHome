import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
const env = Object.fromEntries(
  readFileSync('/workspaces/ThriveAtHome/.env.local','utf8')
    .split('\n').filter(l=>l&&!l.startsWith('#'))
    .map(l=>{const i=l.indexOf('=');return[l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^["']|["']$/g,'')]})
)
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const tables=['members','buddy_assignments','service_bookings','tracked_items','navigator_tasks','training_modules','ride_bookings','events','gifts','check_in_calls','celebration_plans','grief_support_requests','notifications','crisis_events','billing_invoices']
for(const t of tables){
  const{data,error}=await sb.from(t).select('*').limit(1)
  if(error){console.log(`${t}: ERROR — ${error.message}`);continue}
  console.log(`${t}: ${JSON.stringify(data?.[0]?Object.keys(data[0]):'(empty)')}`)
}
