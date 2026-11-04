import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
const TIER_PRICES: Record<string,number> = { digital:0, enhanced:2500, premier:7500 }
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data:{ user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error:'Unauthorized' },{ status:401 })
  const { tier, occasion, occasion_date, title, notes } = await req.json()
  if (!tier||!occasion||!occasion_date) return NextResponse.json({ error:'tier, occasion and occasion_date required' },{ status:400 })
  if (!['digital','enhanced','premier'].includes(tier)) return NextResponse.json({ error:'Invalid tier' },{ status:400 })
  const { data:fm } = await supabase.from('family_members').select('id,member_id').eq('supabase_auth_id',user.id).single()
  if (!fm) return NextResponse.json({ error:'Family member account not found' },{ status:404 })
  let grief_flagged = false
  const occasionDt = new Date(occasion_date)
  const { data:grief } = await supabase.from('grief_support_requests').select('loss_date').eq('member_id',fm.member_id).not('loss_date','is',null)
  for (const g of grief??[]) {
    if (!g.loss_date) continue
    const ld = new Date(g.loss_date)
    const ann = new Date(occasionDt.getFullYear(),ld.getMonth(),ld.getDate())
    if (Math.abs((occasionDt.getTime()-ann.getTime())/(1000*60*60*24))<=30) { grief_flagged=true; break }
  }
  const price_cents = TIER_PRICES[tier]??0
  const { data:cel, error } = await supabase.from('celebration_requests').insert({
    family_member_id:fm.id, member_id:fm.member_id, tier, occasion, occasion_date,
    title:title||null, notes:notes||null, price_cents, grief_flagged,
    status: grief_flagged?'navigator_review':(price_cents===0?'confirmed':'pending_payment'),
  }).select('id').single()
  if (error) return NextResponse.json({ error:error.message },{ status:500 })
  if (grief_flagged) await supabase.from('navigator_tasks').insert({ member_id:fm.member_id, task_type:'celebration_grief_review', notes:`Celebration (${tier}, ${occasion} on ${occasion_date}) flagged near loss anniversary.`, status:'open' })
  return NextResponse.json({ success:true, celebration_id:cel.id, grief_flagged, status:grief_flagged?'navigator_review':(price_cents===0?'confirmed':'pending_payment') })
}
