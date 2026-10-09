// app/api/careers/opportunities/[id]/route.ts
// PATCH — update opportunity (staff only)
// DELETE — archive opportunity (staff only)

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function resolveStaff() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: fm } = await supabase
    .from('family_members')
    .select('id, role')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()
  if (!fm || !['admin', 'navigator'].includes(fm.role ?? '')) return null
  return fm
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const fm = await resolveStaff()
  if (!fm) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const allowed = ['title', 'organization', 'description', 'work_type', 'location',
    'remote_ok', 'hours_per_week', 'pay', 'skills_desired', 'industries',
    'apply_url', 'apply_email', 'closes_on', 'status']

  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }
  if (body.status === 'filled') updates.filled_at = new Date().toISOString()

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from('career_opportunities')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ opportunity: data })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const fm = await resolveStaff()
  if (!fm) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from('career_opportunities')
    .update({ status: 'archived' })
    .eq('id', id)

  return NextResponse.json({ ok: true })
}
