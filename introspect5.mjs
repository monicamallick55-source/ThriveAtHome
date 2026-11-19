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

// Check existing ride_bookings for clues
const {data:rb} = await sb.from("ride_bookings").select("*").limit(3)
console.log("existing ride_bookings:", JSON.stringify(rb))

// Try omitting requested_by entirely
const {error:e1} = await sb.from("ride_bookings").insert({
  member_id: memberId,
  pickup_address: "123 Seed St", dropoff_address: "Medical Center",
  pickup_time: `${tomorrow}T09:00:00Z`, status: "requested"
})
console.log("ride_bookings (no requested_by):", e1 ? "⚠ "+e1.message : "✅")
