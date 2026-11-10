import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  if (!body.price_id && !body.plan) {
    return NextResponse.json({ error: 'price_id required' }, { status: 400 })
  }
  if (body.plan === 'premier') {
    return NextResponse.json({ error: 'Premier plan not available' }, { status: 403 })
  }

  // In production: create Stripe checkout session
  return NextResponse.json({ url: '/dashboard/plan?checkout=pending', session_id: 'cs_test_stub' })
}
