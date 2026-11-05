/**
 * app/api/celebrations/plan/route.ts — G7.4
 * POST /api/celebrations/plan — family creates a celebration for their senior
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const TIER_PRICES: Record<string, number> = {
  digital: 0,
  enhanced: 2500,
  premier: 7500,
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { tier, occasion, occasion_date, title, notes } = body

  if (!tier || !occasion || !occasion_date) {
    return NextResponse.json({ error: 'tier, occasion and occasion_date are required' }, { status: 400 })
  }

  if (!['digital', 'enhanced', 'premier'].includes(tier)) {
    return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
  }

  // Find member linked to this family member account
  const { data: familyMember } = await supabase
    .from('family_members')
    .select('id, member_id')
    .eq('supabase_auth_id', user.id)
    .single()

  if (!familyMember) {
    return NextResponse.json({ error: 'Family member account not found' }, { status: 404 })
  }

  // Grief guard: check if occasion_date is within 30 days of a loss anniversary
  let grief_flagged = false
  const occasionDateObj = new Date(occasion_date)
  const { data: griefRequests } = await supabase
    .from('grief_support_requests')
    .select('loss_date')
    .eq('member_id', familyMember.member_id)
    .not('loss_date', 'is', null)

  for (const req of griefRequests ?? []) {
    if (!req.loss_date) continue
    const lossDate = new Date(req.loss_date)
    // Compare month/day anniversary
    const lossAnniversary = new Date(occasionDateObj.getFullYear(), lossDate.getMonth(), lossDate.getDate())
    const diffDays = Math.abs((occasionDateObj.getTime() - lossAnniversary.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays <= 30) {
      grief_flagged = true
      break
    }
  }

  const price_cents = TIER_PRICES[tier] ?? 0

  // Create celebration request
  const { data: celebration, error } = await supabase
    .from('celebration_requests')
    .insert({
      family_member_id: familyMember.id,
      member_id: familyMember.member_id,
      tier,
      occasion,
      occasion_date,
      title: title || null,
      notes: notes || null,
      price_cents,
      grief_flagged,
      status: grief_flagged ? 'navigator_review' : (price_cents === 0 ? 'confirmed' : 'pending_payment'),
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // If grief flagged, create a navigator task
  if (grief_flagged) {
    await supabase.from('navigator_tasks').insert({
      member_id: familyMember.member_id,
      task_type: 'celebration_grief_review',
      notes: `Celebration request (${tier} tier, ${occasion} on ${occasion_date}) flagged — close to loss anniversary. Review before confirming.`,
      status: 'open',
    })
  }

  return NextResponse.json({
    success: true,
    celebration_id: celebration.id,
    grief_flagged,
    status: grief_flagged ? 'navigator_review' : (price_cents === 0 ? 'confirmed' : 'pending_payment'),
  })
}
