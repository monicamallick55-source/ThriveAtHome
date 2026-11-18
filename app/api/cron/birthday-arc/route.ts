import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function checkAuth(req: NextRequest) {
  const s = req.headers.get('x-cron-secret') ?? req.headers.get('authorization')?.replace('Bearer ','')
  return s === process.env.CRON_SECRET
}

async function runArc(mockToday?: string) {
  const today = mockToday ? new Date(mockToday) : new Date()
  const results: Record<string, number> = {}
  const offsets = [{o:7,k:'d7'},{o:5,k:'d5'},{o:3,k:'d3'},{o:1,k:'d1'},{o:0,k:'d0'},{o:-1,k:'d1after'}]
  for (const {o,k} of offsets) {
    const t = new Date(today); t.setDate(t.getDate()+o)
    const tmm = String(t.getMonth()+1).padStart(2,'0')
    const tdd = String(t.getDate()).padStart(2,'0')
    const {data:members=[]} = await supabase.from('members')
      .select('id,name,aria_call_opted_in').eq('status','active').eq('celebration_opt_out',false)
      .or(`date_of_birth.like.%-${tmm}-${tdd},date_of_birth.like.${tmm}-${tdd}`)
    results[k] = members?.length ?? 0
    if (o===0) for (const m of (members??[])) {
      await supabase.from('members').update({birthday_banner_active:true}).eq('id',m.id)
    }
    if (o===-1) for (const m of (members??[])) {
      await supabase.from('members').update({birthday_banner_active:false}).eq('id',m.id)
      await supabase.from('navigator_tasks').insert({member_id:m.id,task_type:'birthday_thankyou',title:`Birthday thank-you for ${m.name}`,priority:'low',status:'pending',created_at:new Date().toISOString()})
    }
  }
  return results
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({error:'Unauthorized'},{status:401})
  const url = new URL(req.url)
  return NextResponse.json({ok:true,results:await runArc(url.searchParams.get('mockDate')??undefined)})
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({error:'Unauthorized'},{status:401})
  let mockToday: string|undefined
  try { const b = await req.json(); mockToday = b?.mockDate } catch {}
  return NextResponse.json({ok:true,results:await runArc(mockToday)})
}
