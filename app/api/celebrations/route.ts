// app/api/celebrations/route.ts
// G7.4 — Family-initiated celebration requests (3 tiers)
// GET  — list celebration requests for member (family + navigator)
// POST — create a new celebration request

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const VALID_TIERS = ['basic', 'enhanced', 'premium'] as const
const TIER_PRICES: Record<string, number> = { basic: 0, enhanced: 2500, premium: 7500 }

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: fm } = await supabase
    .from('family_members')
    .select('id, member_id, role')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  const memberId = fm?.member_id
  if (!memberId) return NextResponse.json({ error: 'Family member only' }, { status: 403 })

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from('celebration_requests')
    .select('*, messages:celebration_messages(count)')
    .eq('member_id', memberId)
    .order('celebration_date', { ascending: true })
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ celebrations: data })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: fm } = await supabase
    .from('family_members')
    .select('id, member_id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()
  if (!fm) return NextResponse.json({ error: 'Family member only' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const tier: unknown = body?.tier
  const celebrationDate: unknown = body?.celebrationDate
  const specialMessage: string | null = typeof body?.specialMessage === 'string'
    ? body.specialMessage.slice(0, 500) : null
  const eventId: string | null = typeof body?.eventId === 'string' ? body.eventId : null

  if (!VALID_TIERS.includes(tier as typeof VALID_TIERS[number])) {
    return NextResponse.json({ error: `tier must be one of: ${VALID_TIERS.join(', ')}` }, { status: 400 })
  }
  if (!celebrationDate || !/^\d{4}-\d{2}-\d{2}$/.test(celebrationDate as string)) {
    return NextResponse.json({ error: 'celebrationDate must be YYYY-MM-DD' }, { status: 400 })
  }

  const amountCents = TIER_PRICES[tier as string]
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any

  // Check if member has an active grief_support_request close to this date (grief guard)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: griefCheck } = await (admin as any)
    .from('grief_support_requests')
    .select('id, created_at')
    .eq('member_id', fm.member_id)
    .eq('status', 'active')
    .limit(1)

  const griefHold = (griefCheck?.length ?? 0) > 0

  // Insert celebration request
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from('celebration_requests')
    .insert({
      member_id: fm.member_id,
      requested_by: fm.id,
      event_id: eventId,
      tier,
      amount_cents: amountCents,
      status: griefHold ? 'in_review' : (amountCents === 0 ? 'active' : 'pending'),
      celebration_date: celebrationDate,
      special_message: specialMessage,
      grief_hold: griefHold,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (griefHold) {
    // Create navigator task for grief hold review
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from('navigator_tasks').insert({
      member_id: fm.member_id,
      task_type: 'celebration_grief_review',
      priority: 'medium',
      description: `Family requested a ${tier} celebration on ${celebrationDate} — member has an active grief support case. Please review before activating.`,
      metadata: { celebration_id: data.id, tier, celebration_date: celebrationDate },
    }).catch(() => null)
  }

  // For basic tier (free): create an Aria context injection for the day
  if (tier === 'basic') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from('aria_call_contexts').upsert({
      member_id: fm.member_id,
      context_type: 'family_celebration',
      context_key: `celebration_${data.id}`,
      content: `Your family has planned a special celebration for you on ${celebrationDate}! ${specialMessage ? `They want you to know: "${specialMessage}"` : 'They love you and are thinking of you.'}`,
      expires_at: new Date(new Date(celebrationDate + 'T12:00:00Z').getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    }, { onConflict: 'member_id,context_key' }).catch(() => null)
  }

  const response: Record<string, unknown> = { ok: true, celebrationId: data.id, tier, amountCents, griefHold }

  if (amountCents > 0) {
    // TODO: create Stripe PaymentIntent
    // response.requiresPayment = true
    // response.clientSecret = pi.client_secret
    response.note = 'Payment integration pending Stripe live keys'
  }

  return NextResponse.json(response, { status: 201 })
}
