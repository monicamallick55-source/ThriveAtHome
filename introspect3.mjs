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
const volunteerId = "2a0e008c-730d-4c64-b5d8-448c516c69ab"
const partnerId = "975262b9-d051-4819-a85c-c6b524ab29b8"

const {error:e1} = await sb.from("buddy_assignments").insert({
  member_id: memberId, volunteer_id: volunteerId,
  assigned_at: new Date().toISOString(), status: "pending",
  call_frequency: "weekly", match_score: 85
})
console.log("buddy_assignments:", e1 ? "⚠ "+e1.message : "✅")

const {error:e2} = await sb.from("service_bookings").insert({
  member_id: memberId, partner_id: partnerId,
  service_type: "transportation", status: "pending",
  scheduled_at: `${tomorrow}T10:00:00Z`
})
console.log("service_bookings:", e2 ? "⚠ "+e2.message : "✅")

const {error:e3} = await sb.from("ride_bookings").insert({
  member_id: memberId, requested_by: memberId,
  pickup_address: "123 Seed St", dropoff_address: "Medical Center",
  pickup_time: `${tomorrow}T09:00:00Z`, status: "requested"
})
console.log("ride_bookings:", e3 ? "⚠ "+e3.message : "✅")
