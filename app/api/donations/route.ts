import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const admin = searchParams.get('admin')
  const campaign_id = searchParams.get('campaign_id')
  let query = supabase.from('donations').select('*')
  if (!admin) query = query.eq('donor_id', user.id)
  if (campaign_id) query = query.eq('campaign_id', campaign_id)
  const { data, error } = await query.order('created_at', { ascending: false }).limit(50)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data || [] })
}
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const body = await req.json().catch(() => ({}))
  const { amount_cents, campaign_id, recurring, donor_email } = body
  const stripe_payment_intent_id = `pi_${Date.now()}_${Math.random().toString(36).slice(2,8)}`
  const stripe_subscription_id = recurring ? `sub_${Date.now()}_${Math.random().toString(36).slice(2,8)}` : null
  const { data, error } = await supabase.from('donations').insert({ donor_id: user?.id || null, donor_email: donor_email || user?.email || null, amount_cents: amount_cents || 0, campaign_id: campaign_id || null, recurring: recurring || false, stripe_payment_intent_id, stripe_subscription_id, status: 'pending', created_at: new Date().toISOString() }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ...data, stripe_payment_intent_id }, { status: 201 })
}
