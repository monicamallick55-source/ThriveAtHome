import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
export async function POST(req: NextRequest) {
  const raw = (req.headers.get('authorization')||'').replace('Bearer ','').trim()
  if (!raw) return NextResponse.json({error:'Unauthorized'},{status:401})
  const hash = createHash('sha256').update(raw).digest('hex')
  const { data: device } = await supabase.from('device_tokens').select('id,revoked_at').eq('token_hash',hash).single()
  if (!device||device.revoked_at) return NextResponse.json({error:'Invalid token'},{status:401})
  let body: {battery_pct?:number;app_version?:string} = {}
  try { body = await req.json() } catch {}
  await supabase.from('device_tokens').update({last_seen_at:new Date().toISOString(),battery_pct:body.battery_pct??null,app_version:body.app_version??null}).eq('id',device.id)
  return NextResponse.json({ok:true})
}
