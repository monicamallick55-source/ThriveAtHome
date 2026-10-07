import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { resolveMemberContext } from '@/lib/data/members'

const FRAUD_PATTERNS = [
  /gift card/i, /wire transfer/i, /crypto/i, /bitcoin/i, /send me money/i,
  /western union/i, /moneygram/i, /\bssn\b/i, /social security number/i,
  /medicare number/i, /bank account/i, /routing number/i,
]

function scanForFraud(content: string): boolean {
  return FRAUD_PATTERNS.some(p => p.test(content))
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { memberId } = await resolveMemberContext(user.id)
  if (!memberId) return NextResponse.json({ error: 'No member linked' }, { status: 403 })

  const supabase = await createClient()

  const { data: conn } = await (supabase.from as any)('member_connections')
    .select('requester_id, addressee_id, status').eq('id', (await params).id).maybeSingle()
  if (!conn) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (conn.requester_id !== memberId && conn.addressee_id !== memberId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const otherParty = conn.requester_id === memberId ? conn.addressee_id : conn.requester_id

  const { data, error } = await (supabase.from as any)('private_messages')
    .select('id, created_at, sender_id, body, read_at, flagged')
    .in('sender_id', [memberId, otherParty])
    .in('receiver_id', [memberId, otherParty])
    .order('created_at', { ascending: true })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { memberId } = await resolveMemberContext(user.id)
  if (!memberId) return NextResponse.json({ error: 'No member linked' }, { status: 403 })

  const supabase = await createClient()

  const { data: conn } = await (supabase.from as any)('member_connections')
    .select('requester_id, addressee_id, status').eq('id', (await params).id).maybeSingle()
  if (!conn) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (conn.status !== 'accepted') return NextResponse.json({ error: 'Connection not accepted' }, { status: 403 })
  if (conn.requester_id !== memberId && conn.addressee_id !== memberId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { content } = body as { content?: string }
  if (!content?.trim()) return NextResponse.json({ error: 'content required' }, { status: 400 })
  if (content.length > 2000) return NextResponse.json({ error: 'Message too long (max 2000 chars)' }, { status: 400 })

  const receiverId = conn.requester_id === memberId ? conn.addressee_id : conn.requester_id
  const flagged = scanForFraud(content)

  const { data, error } = await (supabase.from as any)('private_messages')
    .insert({ sender_id: memberId, receiver_id: receiverId, body: content.trim(), flagged })
    .select().maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (flagged) {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const admin = createAdminClient()
    await admin.from('navigator_tasks').insert({
      member_id: receiverId,
      task_type: 'fraud_flag',
      priority: 'high',
      description: 'Possible fraud pattern in private message from ' + memberId + ' — review message ' + (data as any).id,
    } as any)
  }

  return NextResponse.json({ ...(data as object), flagged }, { status: 201 })
}
