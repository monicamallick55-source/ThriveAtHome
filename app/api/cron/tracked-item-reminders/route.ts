import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
function authOk(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET; if (!secret) return true
  const h = req.headers.get('x-cron-secret') ?? req.headers.get('authorization')?.replace('Bearer ','')
  return h === secret
}
export async function POST(request: NextRequest) {
  if (!authOk(request)) return NextResponse.json({ error:'unauthorized' }, { status:401 })
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate()+1)
  const d = tomorrow.toISOString().split('T')[0]
  const { data: items } = await supabase.from('tracked_items')
    .select('id,member_id,title,due_date,members(phone_number,aria_call_opted_in)')
    .eq('call_reminder',true).eq('status','pending')
    .gte('due_date',`${d}T00:00:00`).lt('due_date',`${d}T23:59:59`)
  const graceId = process.env.RETELL_GRACE_AGENT_ID
  let called = 0
  for (const item of items ?? []) {
    const mem = Array.isArray(item.members) ? item.members[0] : item.members
    if (!mem?.phone_number || !mem?.aria_call_opted_in) continue
    if (!graceId) { console.log(`[Grace stub] would call ${mem.phone_number} re: "${item.title}"`); called++; continue }
    const r = await fetch('https://api.retellai.com/v2/create-phone-call', {
      method:'POST',
      headers:{ 'Authorization':`Bearer ${process.env.RETELL_API_KEY}`, 'Content-Type':'application/json' },
      body: JSON.stringify({ from_number:process.env.TWILIO_PHONE_NUMBER, to_number:mem.phone_number,
        agent_id:graceId, metadata:{ member_id:item.member_id, call_type:'reminder', item_name:item.title, due_date:item.due_date } }),
    }).catch(e => { console.error('[Grace] failed:',e); return null })
    if (r?.ok) called++
    await new Promise(r => setTimeout(r,200))
  }
  return NextResponse.json({ ok:true, called, items_found: items?.length ?? 0 })
}
export async function GET(req: NextRequest) { return POST(req) }
