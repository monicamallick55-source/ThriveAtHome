import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { resolveMemberContext } from '@/lib/data/members'

const VALID_STATUSES = ['approved', 'rejected', 'cancelled']

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { memberId } = await resolveMemberContext(user.id)
  if (!memberId) return NextResponse.json({ error: 'No member linked' }, { status: 403 })

  const supabase = await createClient()

  const { data: member } = await supabase
    .from('members')
    .select('role')
    .eq('id', memberId)
    .maybeSingle()
  const role = (member as any)?.role ?? ''
  if (!['admin', 'navigator'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { status, review_note } = body as { status?: string; review_note?: string }
  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'status must be one of: approved, rejected, cancelled' }, { status: 400 })
  }

  const { data, error } = await (supabase.from as any)('circle_events')
    .update({ status, review_note: review_note ?? null, reviewed_by: memberId })
    .eq('id', (await params).id)
    .eq('status', 'proposed')
    .select()
    .maybeSingle()

  if (error) {
    console.error('[events/review] update error:', error.message)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: 'Event not found or not in proposed state' }, { status: 404 })
  }
  return NextResponse.json(data)
}
