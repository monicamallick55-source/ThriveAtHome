import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getVolunteerByAuthId, logVolunteerVisit } from '@/lib/data/volunteers'
import { createCorporateHourFromVisit } from '@/lib/data/corporate-volunteers'
import type { VisitType } from '@/lib/services/serviceTypes'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const volunteer_result = await getVolunteerByAuthId(user.id)
    if (volunteer_result.error || !volunteer_result.data) {
      return NextResponse.json({ error: 'Volunteer profile not found' }, { status: 403 })
    }
    const volunteer = volunteer_result.data
    if (volunteer.status !== 'active') {
      return NextResponse.json({ error: 'Volunteer is not active' }, { status: 403 })
    }

    const body = await req.json()
    const { member_id, visit_date, duration_minutes, visit_type, volunteer_notes, volunteer_rating } = body

    if (!member_id || !visit_date || !duration_minutes || !visit_type) {
      return NextResponse.json({ error: 'member_id, visit_date, duration_minutes, and visit_type are required' }, { status: 400 })
    }
    if (typeof duration_minutes !== 'number' || duration_minutes < 1 || duration_minutes > 480) {
      return NextResponse.json({ error: 'duration_minutes must be between 1 and 480' }, { status: 400 })
    }

    const { data: visitData, error } = await logVolunteerVisit({
      volunteer_id: volunteer.id,
      member_id,
      visit_date,
      duration_minutes,
      visit_type: visit_type as VisitType,
      volunteer_notes,
      volunteer_rating,
    })
    if (error) return NextResponse.json({ error }, { status: 500 })

    // Auto-attribute hours to corporate program if volunteer is enrolled
    if (volunteer.corporate_program_id && visitData?.id) {
      const hoursLogged = duration_minutes / 60
      await createCorporateHourFromVisit(
        volunteer.corporate_program_id,
        volunteer.id,
        visitData.id,
        hoursLogged,
        visit_date
      )
    }

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (e) {
    console.error('[api/volunteer/visits] Unexpected error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
