import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getStudentByAuthId, logStudentVisit } from '@/lib/data/students'

export async function POST(req: NextRequest) {
  let user: Awaited<ReturnType<typeof requireAuth>>
  try {
    user = await requireAuth()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const student = await getStudentByAuthId(user.id)
  if (!student) {
    return NextResponse.json({ error: 'Student record not found' }, { status: 403 })
  }

  const body = await req.json()
  const { visitDate, durationMinutes, visitType, reflection, notes } = body

  if (!visitDate || !durationMinutes || !visitType || !reflection?.trim()) {
    return NextResponse.json({ error: 'visitDate, durationMinutes, visitType, and reflection are required' }, { status: 400 })
  }

  if (typeof durationMinutes !== 'number' || durationMinutes < 15 || durationMinutes > 480) {
    return NextResponse.json({ error: 'durationMinutes must be between 15 and 480' }, { status: 400 })
  }

  const result = await logStudentVisit({
    studentId: student.id,
    visitDate,
    durationMinutes,
    visitType,
    reflection,
    notes,
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error ?? 'Failed to log visit' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
