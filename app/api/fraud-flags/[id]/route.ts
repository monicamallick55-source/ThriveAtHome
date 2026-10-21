// app/api/fraud-flags/[id]/route.ts
// G7.1 — PATCH: navigator updates fraud flag status (reviewing, confirmed, false_positive, resolved)

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const VALID_STATUSES = ['open', 'reviewing', 'confirmed', 'false_positive', 'resolved'] as const
type FlagStatus = (typeof VALID_STATUSES)[number]

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: flagId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: fm } = await supabase
    .from('family_members')
    .select('id, role')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  if (!fm || (fm.role !== 'admin' && fm.role !== 'navigator')) {
    return NextResponse.json({ error: 'Navigator or admin required' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const status: unknown = body?.status
  const resolutionNote: string | null = typeof body?.resolutionNote === 'string'
    ? body.resolutionNote.slice(0, 1000)
    : null

  if (!VALID_STATUSES.includes(status as FlagStatus)) {
    return NextResponse.json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` }, { status: 400 })
  }

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any
  const updates: Record<string, unknown> = { status }
  if (['confirmed', 'false_positive', 'resolved'].includes(status as string)) {
    updates.resolved_by = fm.id
    if (resolutionNote) updates.resolution_note = resolutionNote
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from('fraud_flags')
    .update(updates)
    .eq('id', flagId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
