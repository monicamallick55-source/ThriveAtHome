import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { resolveMemberContext } from '@/lib/data/members'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { memberId } = await resolveMemberContext(user.id)
  if (!memberId) return NextResponse.json({ error: 'No member linked' }, { status: 403 })

  const supabase = await createClient()

  const { data: conn } = await (supabase.from as any)('member_connections')
    .select('requester_id, addressee_id').eq('id', (await params).id).maybeSingle()
  if (!conn) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (conn.requester_id !== memberId && conn.addressee_id !== memberId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await (supabase.from as any)('private_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('receiver_id', memberId)
    .is('read_at', null)
    .in('sender_id', [conn.requester_id, conn.addressee_id])

  return NextResponse.json({ ok: true })
}
