// app/api/home-safety/enrollments/[id]/route.ts
// PATCH — member updates their own enrollment (withdraw, update home_type/comments)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { data: fm } = await supabase
    .from('family_members')
    .select('id, member_id, role')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()
  if (!fm) return NextResponse.json({ error: 'No session' }, { status: 403 })

  const admin = createAdminClient()

  // Load enrollment to verify ownership
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: enrollment } = await (admin as any)
    .from('safety_program_enrollments')
    .select('id, member_id, status')
    .eq('id', id)
    .maybeSingle()

  if (!enrollment) return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })

  const isStaff = fm.role === 'admin' || fm.role === 'navigator'
  const isOwner = fm.member_id === enrollment.member_id
  if (!isOwner && !isStaff) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const allowed = isStaff
    ? ['home_type', 'comments', 'income_qualified', 'status', 'volunteer_id']
    : ['home_type', 'comments', 'income_qualified']

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const patch: Record<string, any> = {}
  for (const key of allowed) {
    if (key in body) patch[key] = body[key]
  }

  // Member can only withdraw
  if (!isStaff && body.status && body.status !== 'withdrawn') {
    return NextResponse.json({ error: 'Members can only withdraw from a program' }, { status: 403 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from('safety_program_enrollments')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
