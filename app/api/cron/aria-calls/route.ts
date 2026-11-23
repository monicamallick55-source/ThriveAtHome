import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { agentIdFor } from '@/lib/voice/agents'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
function authOk(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET; if (!secret) return true
  const h = req.headers.get('x-cron-secret') ?? req.headers.get('authorization')?.replace('Bearer ','')
  return h === secret
}
export async function POST(request: NextRequest) {
  if (!authOk(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const now = new Date()
  const day21 = new Date(now.getTime() - 21*24*60*60*1000)
  const day22 = new Date(now.getTime() - 22*24*60*60*1000)
  const day2  = new Date(now.getTime() -  2*24*60*60*1000)
  const { data: newMembers } = await supabase.from('members').select('id,aria_call_opted_in,created_at')
    .eq('status','active').gte('created_at', day2.toISOString())
  for (const m of newMembers ?? []) {
    if (!m.aria_call_opted_in) {
      const { count } = await supabase.from('navigator_tasks').select('id',{count:'exact',head:true})
        .eq('member_id',m.id).eq('task_type','welcome_call')
      if (!count) await supabase.from('navigator_tasks').insert({
        member_id:m.id, task_type:'welcome_call', priority:'high', status:'pending',
        description:'Personal welcome call — do not mention Aria (Launch Protocol days 1–7)',
        due_by: new Date(new Date(m.created_at).getTime()+24*60*60*1000).toISOString(),
      }).catch(console.error)
    }
  }
  const { data: d21 } = await supabase.from('members').select('id')
    .eq('status','active').eq('aria_call_opted_in',false)
    .lte('created_at',day21.toISOString()).gte('created_at',day22.toISOString())
  for (const m of d21 ?? []) {
    const { count } = await supabase.from('navigator_tasks').select('id',{count:'exact',head:true})
      .eq('member_id',m.id).eq('task_type','aria_intro')
    if (!count) await supabase.from('navigator_tasks').insert({
      member_id:m.id, task_type:'aria_intro', priority:'normal', status:'pending',
      description:'Offer Aria (play sample call if wanted). Default is NO.',
    }).catch(console.error)
  }
  const agentId = agentIdFor('aria')
  if (!agentId) { console.warn('[Cron/aria] RETELL_AGENT_ID not set — stub mode'); return NextResponse.json({ ok:true, mode:'stub', called:0 }) }
  const { data: members } = await supabase.from('members').select('id,phone_number,checkin_preference')
    .eq('status','active').eq('aria_call_opted_in',true).neq('checkin_preference','none')
  let called = 0
  for (const m of members ?? []) {
    if (!m.phone_number) continue
    const r = await fetch('https://api.retellai.com/v2/create-phone-call', {
      method:'POST',
      headers:{ 'Authorization':`Bearer ${process.env.RETELL_API_KEY}`, 'Content-Type':'application/json' },
      body: JSON.stringify({ from_number:process.env.TWILIO_PHONE_NUMBER, to_number:m.phone_number,
        agent_id:agentId, metadata:{ member_id:m.id, call_type:'check_in' } }),
    }).catch(e => { console.error('[Aria] call failed:',e); return null })
    if (r?.ok) called++
    await new Promise(r => setTimeout(r, 200))
  }
  return NextResponse.json({ ok:true, called })
}
export async function GET(req: NextRequest) { return POST(req) }


export async function GET(request: NextRequest) {
  if (!authOk(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  return NextResponse.json({ ok: true, message: 'aria-calls cron ready' }, { status: 200 })
}
