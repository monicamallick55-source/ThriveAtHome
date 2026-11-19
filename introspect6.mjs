import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"
const env = Object.fromEntries(
  readFileSync("/workspaces/ThriveAtHome/.env.local","utf8")
    .split("\n").filter(l=>l&&!l.startsWith("#"))
    .map(l=>{const i=l.indexOf("=");return[l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^["']|["']$/g,"")]})
)
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const {data} = await sb.auth.admin.listUsers({perPage:200})
const matches = data.users.filter(u => ["veteran","vsoadmin","k12admin","k12student","vso","school"].some(e => u.email?.toLowerCase().includes(e)))
console.log(JSON.stringify(matches.map(u=>({id:u.id,email:u.email,role:u.app_metadata?.role})),null,2))
for (const u of matches) {
  const {data:m} = await sb.from("members").select("id,full_name").eq("supabase_auth_id",u.id).maybeSingle()
  console.log(`  ${u.email} → member: ${m ? m.id.slice(0,8)+' '+m.full_name : 'NONE'}`)
}
