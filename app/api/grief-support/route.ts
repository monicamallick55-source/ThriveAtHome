import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getMemberForAuthUser } from '@/lib/data/members'
import { createGriefSupportRequest, setDailyCheckInForGrief } from '@/lib/data/grief'
import { emailProvider } from '@/lib/providers'

export async function POST(req: Request) {
  try {
    const user = await requireAuth()
    const body = await req.json()
    const { lossType, circleTypeRequested, availabilityPreference, additionalNotes, lossAnniversaryDate } = body

    if (!lossType) return NextResponse.json({ error: 'Loss type is required' }, { status: 400 })

    const { data: member } = await getMemberForAuthUser(user.id)
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

    const { data: request, error } = await createGriefSupportRequest({
      memberId: member.id,
      lossType,
      circleTypeRequested: circleTypeRequested ?? undefined,
      availabilityPreference: availabilityPreference ?? undefined,
      additionalNotes: additionalNotes ?? undefined,
      lossAnniversaryDate: lossAnniversaryDate ?? undefined,
    })

    if (error) return NextResponse.json({ error }, { status: 500 })

    // Update check-in frequency to daily
    await setDailyCheckInForGrief(member.id)

    // Notify care team via stub
    const details = `Loss type: ${lossType} | Circle: ${circleTypeRequested ?? 'Not specified'} | Availability: ${availabilityPreference ?? 'Not specified'} | Notes: ${additionalNotes ?? 'None'} | Check-in updated to daily.`
    await emailProvider.sendGriefSupportNotification(
      process.env.CARE_TEAM_EMAIL ?? 'care@thriveathome.dev',
      member.preferred_name ?? member.full_name,
      details
    )

    return NextResponse.json({ request })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unexpected error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
