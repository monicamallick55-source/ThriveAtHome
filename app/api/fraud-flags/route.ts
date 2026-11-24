/**
 * app/api/fraud-flags/route.ts — Fraud Flags API
 * TC-FS002, TC-FS003
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data, error } = await supabase
    .from('fraud_flags')
    .select('*')
    .eq('member_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ flags: [] })
  return NextResponse.json({ flags: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  // Look up member UUID from members table (member_id is not auth UID)
  const admin = createAdminClient()
  const { data: memberRow } = await admin.from('members').select('id').eq('supabase_auth_id', user.id).maybeSingle()
  const memberId = memberRow?.id ?? user.id

  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch { /* empty body is fine */ }

  const { data, error } = await supabase.from('fraud_flags').insert({
    member_id: memberId,
    scam_type: body.flag_type ?? body.scam_type ?? 'manual_report',
    matched_text: body.description ?? body.matched_text ?? null,
    source: body.source ?? 'member',
    severity: body.severity ?? 'low',
    status: 'open',
  }).select('id').single()

  if (error) return NextResponse.json({ error: 'Could not create flag' }, { status: 500 })
  return NextResponse.json({ ok: true, id: data?.id ?? null }, { status: 201 })
}
