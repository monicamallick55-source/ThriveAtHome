import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"
const env = Object.fromEntries(
  readFileSync("/workspaces/ThriveAtHome/.env.local","utf8")
    .split("\n").filter(l=>l&&!l.startsWith("#"))
    .map(l=>{const i=l.indexOf("=");return[l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^["']|["']$/g,"")]})
)
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const base = { date_of_birth: "1952-06-15", phone_number: "+15550000000", status: "active", plan_tier: "complete" }

const accounts = [
  { ...base, supabase_auth_id: "f20d0393-aafc-4d13-b6b8-03c2dccdded4", full_name: "Veteran Test",    preferred_name: "Veteran",   is_veteran: true },
  { ...base, supabase_auth_id: "7030e22a-76f0-45d0-ad18-f70cd36f2036", full_name: "VSO Admin Test",  preferred_name: "VSO Admin"  },
  { ...base, supabase_auth_id: "6606c8ad-65ac-41b3-a2af-51d2dfbfc2fb", full_name: "K12 Admin Test",  preferred_name: "K12 Admin"  },
  { ...base, supabase_auth_id: "d454084a-9964-4afd-94b4-80234edd2ffd", full_name: "K12 Student Test", preferred_name: "Student", date_of_birth: "2008-01-20", plan_tier: "basics" },
]

for (const row of accounts) {
  const {data, error} = await sb.from("members").insert(row).select("id").maybeSingle()
  if (error) console.log(`⚠ ${row.full_name}: ${error.message}`)
  else console.log(`✅ ${row.full_name}: ${data.id}`)
}
