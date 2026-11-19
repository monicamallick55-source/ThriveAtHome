import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"
const env = Object.fromEntries(
  readFileSync("/workspaces/ThriveAtHome/.env.local","utf8")
    .split("\n").filter(l=>l&&!l.startsWith("#"))
    .map(l=>{const i=l.indexOf("=");return[l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^["']|["']$/g,"")]})
)
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const tomorrow = new Date(Date.now()+86400000).toISOString().slice(0,10)
const memberId = "42ffcc14-0878-42fe-a14e-b060f50439aa"
const authId = "6ac833bd-ddd3-48f9-a36f-da969bd5cfa9"
const partnerId = "975262b9-d051-4819-a85c-c6b524ab29b8"

// Check existing service_bookings for valid status values
const {data:sb2} = await sb.from("service_bookings").select("status").limit(10)
console.log("service_bookings existing statuses:", JSON.stringify([...new Set((sb2??[]).map(r=>r.status))]))

// Try known status values for service_bookings
for (const s of ["scheduled","confirmed","active","requested","booked","accepted"]) {
  const {error} = await sb.from("service_bookings").insert({
    member_id: memberId, partner_id: partnerId,
    service_type: "transportation", status: s,
    scheduled_at: `${tomorrow}T10:00:00Z`
  })
  if (!error) { console.log(`service_bookings status="${s}": ✅`); break }
  else console.log(`service_bookings status="${s}": ⚠ ${error.message.slice(0,60)}`)
}

// ride_bookings with auth user ID as requested_by
const {error:re} = await sb.from("ride_bookings").insert({
  member_id: memberId, requested_by: authId,
  pickup_address: "123 Seed St", dropoff_address: "Medical Center",
  pickup_time: `${tomorrow}T09:00:00Z`, status: "requested"
})
console.log("ride_bookings (authId as requested_by):", re ? "⚠ "+re.message : "✅")
