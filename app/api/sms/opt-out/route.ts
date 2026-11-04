import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export async function POST(req: NextRequest) {
  const body = await req.text()
  const params = new URLSearchParams(body)
  const from = params.get('From') || ''
  const text = (params.get('Body') || '').trim().toUpperCase()
  const supabase = await createClient()
  if (['STOP','STOPALL','UNSUBSCRIBE','CANCEL','END','QUIT'].includes(text)) {
    await (supabase as any).from('members').update({ sms_opt_out: true, sms_opt_out_at: new Date().toISOString() }).eq('phone', from)
  } else if (['START','UNSTOP','YES'].includes(text)) {
    await (supabase as any).from('members').update({ sms_opt_out: false, sms_opt_out_at: null }).eq('phone', from)
  }
  return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', { headers: { 'Content-Type': 'text/xml' } })
}
