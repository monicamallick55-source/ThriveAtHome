// app/api/nonprofit/referrals/[id]/decline/route.ts
// POST /api/nonprofit/referrals/:id/decline

import { NextRequest, NextResponse } from 'next/server'
import { updateReferralStatus } from '@/lib/nonprofit/db'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: referralId } = await params
    const body = await req.json()
    const { decline_reason } = body

    await updateReferralStatus(referralId, 'declined', { decline_reason })

    return NextResponse.json({ message: 'Referral declined' })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
