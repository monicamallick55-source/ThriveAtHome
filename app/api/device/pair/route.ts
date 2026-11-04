import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHash, randomBytes } from 'crypto'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
export async function POST(req: NextRequest) {
  let body: {pairing_code?:string;label?:string} = {}
  try { body = await req.json() } catch { return NextResponse.json({error:'Invalid JSON'},{status:400}) }
  if (!body.pairing_code) return NextResponse.json({error:'pairing_code required'},{status:400})
  const code = body.pairing_code.trim().toUpperCase()
  const now = new Date().toISOString()
  const { data: device, error } = await supabase.from('device_tokens').select('id,member_id,pairing_expires').eq('pairing_code',code).is('token_hash',null).is('revoked_at',null).single()
  if (error || !device) return NextResponse.json({error:'Invalid or expired pairing code'},{status:404})
  if (device.pairing_expires && device.pairing_expires < now) return NextResponse.json({error:'Pairing code expired'},{status:410})
  const rawToken = randomBytes(48).toString('hex')
  const tokenHash = createHash('sha256').update(rawToken).digest('hex')
  await supabase.from('device_tokens').update({token_hash:tokenHash,label:body.label||'Thrive Device',pairing_code:null,pairing_expires:null,last_seen_at:now}).eq('id',device.id)
  const { data: member } = await supabase.from('members').select('first_name,last_name').eq('id',device.member_id).single()
  return NextResponse.json({device_token:rawToken,member_id:device.member_id,member_name:member?`${member.first_name} ${member.last_name}`:'Member'})
}
