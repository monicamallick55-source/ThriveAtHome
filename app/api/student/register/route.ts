import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStudentByAuthId } from '@/lib/data/students'

export async function POST(req: NextRequest) {
  let user: Awaited<ReturnType<typeof requireAuth>>
  try {
    user = await requireAuth()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Prevent duplicate registration
  const existing = await getStudentByAuthId(user.id)
  if (existing) {
    return NextResponse.json({ error: 'Already registered as a student volunteer' }, { status: 409 })
  }

  const body = await req.json()
  const { full_name, email, university_name, major, graduation_year } = body

  if (!full_name?.trim() || !university_name?.trim()) {
    return NextResponse.json({ error: 'full_name and university_name are required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('student_volunteers')
    .insert({
      supabase_auth_id: user.id,
      full_name: full_name.trim(),
      email: email?.trim() ?? user.email ?? '',
      university_name: university_name?.trim() ?? null,
      major: major?.trim() ?? null,
      graduation_year: graduation_year ?? null,
      status: 'active', // auto-activate students (coordinator reviews asynchronously)
    })

  if (error) {
    console.error('[student/register]', error)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
