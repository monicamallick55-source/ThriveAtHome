// POST /api/admin/buddy-match — creates a buddy assignment (admin/navigator only)
import { NextResponse } from 'next/server'
import { requireAuth, getUserRole } from '@/lib/auth'
import { createBuddyAssignment } from '@/lib/data/buddies'
import { emailProvider } from '@/lib/providers'

export async function POST(req: Request) {
  try {
    const user = await requireAuth()
    const role = await getUserRole(user.id)
    if (role !== 'admin' && role !== 'navigator') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { member_id, volunteer_id, match_score, match_reasons, call_frequency, preferred_call_day, preferred_call_time, navigator_notes } = body

    if (!member_id || !volunteer_id) {
      return NextResponse.json({ error: 'member_id and volunteer_id are required' }, { status: 400 })
    }

    const { data, error } = await createBuddyAssignment({
      member_id,
      volunteer_id,
      match_score: match_score ?? 0,
      match_reasons: match_reasons ?? [],
      call_frequency: call_frequency ?? 'weekly',
      preferred_call_day: preferred_call_day ?? undefined,
      preferred_call_time: preferred_call_time ?? undefined,
      navigator_notes: navigator_notes ?? undefined,
    })

    if (error) return NextResponse.json({ error }, { status: 500 })

    // Notify via stub email
    await emailProvider.sendAlert(
      process.env.CARE_TEAM_EMAIL ?? 'care@thriveathome.com',
      'Admin',
      `New buddy match created. Assignment ID: ${data?.id}`
    )

    return NextResponse.json({ data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
