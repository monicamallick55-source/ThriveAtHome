/**
 * app/api/fraud-flags/route.ts — Fraud Flags API
 * TC-FS002
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('fraud_flags')
    .select('*')
    .eq('member_supabase_auth_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ flags: [] })
  return NextResponse.json({ flags: data ?? [] })
}

export async function POST(req: NextRequest) {
  // TC-FS005 — report a fraud flag
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch { /* empty body is fine */ }

  const { data, error } = await db.from('fraud_flags').insert({
    member_supabase_auth_id: user.id,
    flag_type: body.flag_type ?? 'manual_report',
    description: body.description ?? null,
    source: body.source ?? 'member',
    status: 'open',
  }).select('id').single()

  if (error) return NextResponse.json({ error: 'Could not create flag' }, { status: 500 })
  return NextResponse.json({ ok: true, flag_id: data?.id ?? null }, { status: 201 })
}
