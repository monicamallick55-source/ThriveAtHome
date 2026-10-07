import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { resolveMemberContext } from '@/lib/data/members'

const VALID_ACTIONS = ['accepted', 'declined', 'blocked']

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { memberId } = await resolveMemberContext(user.id)
  if (!memberId) return NextResponse.json({ error: 'No member linked' }, { status: 403 })

  const supabase = await createClient()

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { status } = body as { status?: string }
  if (!status || !VALID_ACTIONS.includes(status)) {
    return NextResponse.json({ error: 'status must be accepted, declined, or blocked' }, { status: 400 })
  }

  // Only the addressee can accept/decline; either party can block
  const { data: conn } = await (supabase.from as any)('member_connections')
    .select('requester_id, addressee_id, status').eq('id', (await params).id).maybeSingle()
  if (!conn) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isParty = conn.requester_id === memberId || conn.addressee_id === memberId
  if (!isParty) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (status !== 'blocked' && conn.addressee_id !== memberId) {
    return NextResponse.json({ error: 'Only the recipient can accept or decline' }, { status: 403 })
  }

  const { data, error } = await (supabase.from as any)('member_connections')
    .update({ status, responded_at: new Date().toISOString() })
    .eq('id', (await params).id)
    .select().maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
