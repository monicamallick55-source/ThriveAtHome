// app/api/nonprofit/referrals/route.ts
// GET  /api/nonprofit/referrals        — list pending referrals (navigator/admin)
// POST /api/nonprofit/referrals        — submit a new referral (nonprofit org portal)

import { NextRequest, NextResponse } from 'next/server'
import { createReferral, getPendingReferrals, getReferralsForOrg } from '@/lib/nonprofit/db'
import type { CommunityAccessTier } from '@/lib/nonprofit/types'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const orgId = searchParams.get('org_id')

    if (orgId) {
      const referrals = await getReferralsForOrg(orgId)
      return NextResponse.json({ referrals })
    }

    // Navigator/admin: all pending referrals
    const referrals = await getPendingReferrals()
    return NextResponse.json({ referrals })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      nonprofit_org_id,
      senior_full_name,
      senior_phone,
      senior_email,
      senior_address_city,
      senior_address_state,
      senior_dob_year,
      tier_requested,
      reason_for_referral,
      financial_need_confirmed,
    } = body

    if (!nonprofit_org_id || !senior_full_name || !senior_phone || !reason_for_referral) {
      return NextResponse.json(
        { error: 'nonprofit_org_id, senior_full_name, senior_phone, and reason_for_referral are required' },
        { status: 400 }
      )
    }

    const tier: CommunityAccessTier = tier_requested === 'community_subsidised'
      ? 'community_subsidised'
      : 'community_free'

    const { data, error } = await createReferral({
      nonprofit_org_id,
      senior_full_name,
      senior_phone,
      senior_email,
      senior_address_city,
      senior_address_state,
      senior_dob_year,
      tier_requested: tier,
      reason_for_referral,
      financial_need_confirmed: !!financial_need_confirmed,
    })

    if (error) return NextResponse.json({ error }, { status: 400 })
    return NextResponse.json({ referral: data }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
