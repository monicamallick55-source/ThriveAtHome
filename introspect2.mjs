import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"
const env = Object.fromEntries(
  readFileSync("/workspaces/ThriveAtHome/.env.local","utf8")
    .split("\n").filter(l=>l&&!l.startsWith("#"))
    .map(l=>{const i=l.indexOf("=");return[l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^["']|["']$/g,"")]})
)
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const {data:v,error:ve} = await sb.from("volunteers").select("id,full_name,status").limit(3)
if (ve) console.log("volunteers:", ve.message)
else console.log("volunteers:", JSON.stringify(v))
const {data:p,error:pe} = await sb.from("service_partners").select("id,name").limit(3)
if (pe) { const {data:p2,error:pe2} = await sb.from("partners").select("id,name").limit(3); if(pe2) console.log("service_partners:",pe.message,"| partners:",pe2.message); else console.log("partners:",JSON.stringify(p2)) }
else console.log("service_partners:", JSON.stringify(p))
const {data:rb} = await sb.from("ride_bookings").select("status").limit(10)
console.log("ride_booking statuses:", JSON.stringify([...new Set((rb??[]).map(r=>r.status))]))
const {data:ba} = await sb.from("buddy_assignments").select("volunteer_id").limit(3)
console.log("buddy volunteer_ids:", JSON.stringify((ba??[]).map(r=>r.volunteer_id)))
