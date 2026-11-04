/**
 * app/api/celebrations/route.ts — G7.4 Family-initiated celebrations
 *
 * POST  /api/celebrations  — family creates a celebration request
 * GET   /api/celebrations  — list celebrations (member or family)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })
  : null

const TIER_PRICES: Record<string, number> = {
  digital: 0,
  enhanced: 2500,   // $25.00
  premier: 7500,    // $75.00
}

const TIER_LABELS: Record<string, string> = {
  digital: 'Digital Celebration — Joy call + digital family card (Free)',
  enhanced: 'Enhanced Celebration — Volunteer visit + gift coordination ($25)',
  premier: 'Premier Celebration — Video gathering + physical memory book ($75)',
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const memberId = searchParams.get('member_id')

  let query = supabase
    .from('celebration_requests')
    .select('*')
    .order('occasion_date', { ascending: true })

  if (memberId) query = query.eq('member_id', memberId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ celebrations: data })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { member_id, occasion, occasion_date, tier = 'digital', title, description } = body

  if (!member_id || !occasion || !occasion_date) {
    return NextResponse.json({ error: 'member_id, occasion and occasion_date are required' }, { status: 400 })
  }

  const price_cents = TIER_PRICES[tier] ?? 0

  // ── Grief guard: check if occasion_date is within 30 days of a loss anniversary
  const { data: griefRequests } = await supabase
    .from('grief_support_requests')
    .select('loss_date')
    .eq('member_id', member_id)
    .not('loss_date', 'is', null)

  let griefFlagged = false
  if (griefRequests && griefRequests.length > 0) {
    const oDate = new Date(occasion_date)
    for (const gr of griefRequests) {
      if (!gr.loss_date) continue
      const lossDate = new Date(gr.loss_date)
      // Compare month/day proximity (within 30 days same year)
      const lossThisYear = new Date(oDate.getFullYear(), lossDate.getMonth(), lossDate.getDate())
      const diffMs = Math.abs(oDate.getTime() - lossThisYear.getTime())
      const diffDays = diffMs / (1000 * 60 * 60 * 24)
      if (diffDays <= 30) {
        griefFlagged = true
        break
      }
    }
  }

  const status = griefFlagged ? 'pending' : (price_cents === 0 ? 'planning' : 'pending')

  const { data: celebration, error: insertErr } = await supabase
    .from('celebration_requests')
    .insert({
      member_id,
      created_by: user.id,
      occasion,
      occasion_date,
      tier,
      title: title ?? TIER_LABELS[tier],
      description,
      amount_cents: price_cents,
      status,
      grief_guard_flagged: griefFlagged,
    })
    .select()
    .single()

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })

  // If grief-flagged: create a navigator task for review
  if (griefFlagged) {
    await supabase.from('navigator_tasks').insert({
      member_id,
      task_type: 'grief_anniversary_review',
      notes: `A family member planned a ${tier} celebration for ${occasion} on ${occasion_date}. The date is within 30 days of a recorded loss anniversary. Please review before the celebration proceeds.`,
      priority: 'medium',
      category: 'check_in',
      status: 'pending',
    }).then(({ error: _e }: { error: unknown }) => void _e)
  }

  // If paid tier — create Stripe Checkout
  if (price_cents > 0 && stripe) {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: price_cents,
            product_data: {
              name: TIER_LABELS[tier],
              description: `Celebration for member on ${occasion_date}`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        celebration_id: celebration.id,
        purpose: 'celebration',
        member_id,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/celebrations?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/celebrations?cancelled=1`,
    })

    await supabase
      .from('celebration_requests')
      .update({ stripe_session_id: session.id })
      .eq('id', celebration.id)

    return NextResponse.json({ celebration, checkout_url: session.url })
  }

  return NextResponse.json({ celebration })
}
