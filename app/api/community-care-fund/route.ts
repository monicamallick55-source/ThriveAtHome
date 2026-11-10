import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  return NextResponse.json({
    fund_balance_cents: 0,
    total_raised_cents: 0,
    total_distributed_cents: 0,
    active_campaigns: 0,
    status: 'active',
  })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  if (!body.amount_cents || !body.reason) {
    return NextResponse.json({ error: 'amount_cents and reason required' }, { status: 400 })
  }

  return NextResponse.json({ ok: true, application_id: crypto.randomUUID(), status: 'pending_review' })
}
