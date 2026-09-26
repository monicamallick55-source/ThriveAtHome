// FEATURE-002/003 — location-aware live event search for the Cultural
// Programming and Cultural Festivals pages. Family accounts search for
// events near a zip code (defaults to the member's profile zip).
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { resolveMemberContext, getMemberById } from '@/lib/data/members'
import { searchLiveEvents, getLiveEventAttendance, type LiveEventCategory } from '@/lib/data/eventSearch'

const ZIP_PATTERN = /^\d{5}$/
const VALID_RADII = [5, 10, 25, 50]

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { category, zip: requestedZip, radius: requestedRadius } = body as {
    category?: string; zip?: string; radius?: number
  }

  if (category !== 'cultural' && category !== 'festival') {
    return NextResponse.json({ error: 'category must be "cultural" or "festival"' }, { status: 400 })
  }
  const radius = VALID_RADII.includes(requestedRadius as number) ? (requestedRadius as number) : 25

  const { memberId } = await resolveMemberContext(user.id)

  let zip = requestedZip?.trim()
  if (zip && !ZIP_PATTERN.test(zip)) {
    return NextResponse.json({ error: 'Please enter a valid 5-digit zip code.' }, { status: 400 })
  }

  if (!zip && memberId) {
    const { data: member } = await getMemberById(memberId)
    zip = member?.zip_code ?? undefined
  }

  if (!zip) {
    return NextResponse.json(
      { error: 'Add a zip code to your profile, or enter one above, to see events near you.' },
      { status: 400 }
    )
  }

  if (!process.env.SEARCHAPI_API_KEY || !process.env.ANTHROPIC_API_KEY) {
    console.error('[api/events/search] Missing GOOGLE_SEARCH_API_KEY, GOOGLE_SEARCH_ENGINE_ID, or ANTHROPIC_API_KEY')
    return NextResponse.json(
      { error: 'Event search is not configured yet. Please try again later.' },
      { status: 500 }
    )
  }

  const { data, error, cached } = await searchLiveEvents(category as LiveEventCategory, zip, radius)
  if (error) {
    return NextResponse.json({ error: 'We could not load events right now. Please try again in a moment.' }, { status: 500 })
  }

  const events = data ?? []
  let attendance: Record<string, { count: number; going: boolean }> = {}
  if (category === 'festival' && events.length > 0) {
    const { data: attendanceData } = await getLiveEventAttendance(events.map((e) => e.url), memberId)
    attendance = attendanceData
  }

  return NextResponse.json({ events, cached, zip, attendance })
}
