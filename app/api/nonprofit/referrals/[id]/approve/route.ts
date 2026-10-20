// app/api/nonprofit/referrals/[id]/approve/route.ts
// POST /api/nonprofit/referrals/:id/approve
// Navigator approves a referral and enrols the senior into Community Access

import { NextRequest, NextResponse } from 'next/server'
import { updateReferralStatus, enrollSponsoredMembership } from '@/lib/nonprofit/db'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: referralId } = await params
    const body = await req.json()
    const {
      member_id,        // UUID of the member record (created during onboarding call)
      navigator_id,
      navigator_notes,
      tier,             // 'community_free' | 'community_subsidised'
      end_date,         // optional ISO date string
    } = body

    if (!member_id) {
      return NextResponse.json(
        { error: 'member_id is required — create the member record before approving' },
        { status: 400 }
      )
    }

    // Get referral to pull nonprofit_org_id and referral context
    const supabase = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    const { data: referral } = await db
      .from('nonprofit_referrals')
      .select('*')
      .eq('id', referralId)
      .maybeSingle() as { data: Record<string, any> | null; error: unknown }

    if (!referral) {
      return NextResponse.json({ error: 'Referral not found' }, { status: 404 })
    }

    if (referral.status === 'enrolled') {
      return NextResponse.json({ error: 'Referral already enrolled' }, { status: 409 })
    }

    // Enrol the sponsored membership
    const { data: membership, error: enrollError } = await enrollSponsoredMembership({
      member_id,
      nonprofit_org_id: referral.nonprofit_org_id,
      tier: tier ?? referral.tier_requested,
      referral_notes: referral.reason_for_referral,
      navigator_notes,
      navigator_id,
      end_date,
    })

    if (enrollError) {
      return NextResponse.json({ error: enrollError }, { status: 400 })
    }

    // Update referral status to enrolled
    await updateReferralStatus(referralId, 'enrolled', {
      member_id,
      sponsored_membership_id: membership?.id,
    })

    // Create a navigator task to call the new Community Access member within 24h
    await db.from('navigator_tasks').insert({
      member_id,
      task_type: 'community_access_welcome',
      description: `New Community Access member referred by ${referral.nonprofit_org_id}. Call within 24 hours for welcome onboarding.`,
      priority: 'high',
    })

    return NextResponse.json({
      membership,
      message: 'Senior enrolled in Community Access membership',
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
