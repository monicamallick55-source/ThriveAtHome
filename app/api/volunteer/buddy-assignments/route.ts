// GET /api/volunteer/buddy-assignments — returns active buddy assignments for the logged-in volunteer
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getVolunteerByAuthId } from '@/lib/data/volunteers'
import { getVolunteerBuddyAssignments } from '@/lib/data/buddies'

export async function GET() {
  try {
    const user = await requireAuth()
    const { data: volunteer } = await getVolunteerByAuthId(user.id)
    if (!volunteer) return NextResponse.json({ error: 'Volunteer not found' }, { status: 404 })

    const { data, error } = await getVolunteerBuddyAssignments(volunteer.id)
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
