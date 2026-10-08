// app/api/connections/[id]/route.ts
// PATCH — accept, decline, or block a connection request.
// Handles both organic requests (standard single-accept) and
// navigator introductions (dual-accept: both parties must accept).
//
// NOTE: Uses `as any` on member_connections queries because migration 095 (which adds
// recipient_id, introduced_by, intro_note, requester_accepted, recipient_accepted,
// responded_at columns) has not yet been applied to this environment.
// Once applied and types regenerated (`npx supabase gen types`) these casts can be removed.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ── helpers ──────────────────────────────────────────────────────────────────

async function resolveMemberContext(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: fm } = await supabase
    .from('family_members')
    .select('member_id, role')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  if (fm?.member_id) return { memberId: fm.member_id as string, role: fm.role as string }

  const { data: m } = await supabase
    .from('members')
    .select('id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  if (m?.id) return { memberId: m.id as string, role: 'member' }

  return null
}

function displayName(
  m: { preferred_name: string | null; full_name: string | null } | null,
): string {
  return m?.preferred_name ?? m?.full_name ?? 'A member'
}

// ── PATCH /api/connections/[id] ───────────────────────────────────────────────

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: connectionId } = await params
  const supabase = await createClient()

  // 1. Auth
  const ctx = await resolveMemberContext(supabase)
  if (!ctx) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // 2. Parse action
  const body = await req.json().catch(() => ({}))
  const action: unknown = body?.action
  if (action !== 'accept' && action !== 'decline' && action !== 'block') {
    return NextResponse.json({ error: 'action must be accept, decline, or block' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any

  // 3. Fetch the connection
  const { data: conn } = await admin
    .from('member_connections')
    .select(
      `id, status, requester_id, recipient_id, introduced_by,
       requester_accepted, recipient_accepted,
       requester:members!member_connections_requester_id_fkey(id, preferred_name, full_name),
       recipient:members!member_connections_recipient_id_fkey(id, preferred_name, full_name)`,
    )
    .eq('id', connectionId)
    .maybeSingle()

  if (!conn) {
    return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
  }

  // 4. Verify current user is a party
  const isRequester = conn.requester_id === ctx.memberId
  const isRecipient = conn.recipient_id === ctx.memberId
  if (!isRequester && !isRecipient) {
    return NextResponse.json({ error: 'Not a party to this connection' }, { status: 403 })
  }

  if (conn.status === 'blocked') {
    return NextResponse.json({ error: 'Connection is blocked' }, { status: 409 })
  }

  const now = new Date().toISOString()

  // 5. Handle block / decline (same for both modes)
  if (action === 'block') {
    await admin
      .from('member_connections')
      .update({ status: 'blocked', responded_at: now })
      .eq('id', connectionId)
    return NextResponse.json({ ok: true, status: 'blocked' })
  }

  if (action === 'decline') {
    await admin
      .from('member_connections')
      .update({ status: 'declined', responded_at: now })
      .eq('id', connectionId)
    return NextResponse.json({ ok: true, status: 'declined' })
  }

  // 6. Accept — determine mode
  const isNavigatorIntro = !!conn.introduced_by

  if (!isNavigatorIntro) {
    // ── Standard mode: recipient accepts → immediately accepted ──────────────
    if (!isRecipient) {
      return NextResponse.json(
        { error: 'Only the recipient can accept a connection request' },
        { status: 403 },
      )
    }
    if (conn.status !== 'pending') {
      return NextResponse.json(
        { error: `Connection is already ${conn.status}` },
        { status: 409 },
      )
    }

    await admin
      .from('member_connections')
      .update({ status: 'accepted', recipient_accepted: true, responded_at: now })
      .eq('id', connectionId)

    // Notify requester
    const recipientName = displayName(conn.recipient as { preferred_name: string | null; full_name: string | null } | null)
    await admin.from('realtime_notifications').insert({
      member_id: conn.requester_id,
      type: 'system_message',
      title: `${recipientName} accepted your friend request`,
      body: `You can now send messages to ${recipientName}.`,
      severity: 'info',
    })

    return NextResponse.json({ ok: true, status: 'accepted' })
  }

  // ── Navigator-intro dual-accept mode ─────────────────────────────────────
  const update: Record<string, boolean | string> = { responded_at: now }
  if (isRequester) update.requester_accepted = true
  if (isRecipient) update.recipient_accepted = true

  // Both accepted?
  const requesterAccepted = isRequester ? true : (conn.requester_accepted as boolean)
  const recipientAccepted = isRecipient ? true : (conn.recipient_accepted as boolean)
  const bothAccepted = requesterAccepted && recipientAccepted

  if (bothAccepted) update.status = 'accepted'

  await admin
    .from('member_connections')
    .update(update)
    .eq('id', connectionId)

  if (bothAccepted) {
    // Notify both parties that messaging is now enabled
    const nameA = displayName(conn.requester as { preferred_name: string | null; full_name: string | null } | null)
    const nameB = displayName(conn.recipient as { preferred_name: string | null; full_name: string | null } | null)

    await Promise.allSettled([
      admin.from('realtime_notifications').insert({
        member_id: conn.requester_id,
        type: 'system_message',
        title: `You're connected with ${nameB}!`,
        body: `You both accepted the introduction. You can now send messages to ${nameB}.`,
        severity: 'info',
      }),
      admin.from('realtime_notifications').insert({
        member_id: conn.recipient_id,
        type: 'system_message',
        title: `You're connected with ${nameA}!`,
        body: `You both accepted the introduction. You can now send messages to ${nameA}.`,
        severity: 'info',
      }),
    ])

    return NextResponse.json({ ok: true, status: 'accepted' })
  }

  // Only one has accepted so far
  const waitingFor = isRequester
    ? displayName(conn.recipient as { preferred_name: string | null; full_name: string | null } | null)
    : displayName(conn.requester as { preferred_name: string | null; full_name: string | null } | null)
  return NextResponse.json({
    ok: true,
    status: 'pending',
    message: `Waiting for ${waitingFor} to also accept before messaging is enabled.`,
  })
}

// ── GET /api/connections/[id] — fetch one connection ─────────────────────────

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: connectionId } = await params
  const supabase = await createClient()

  const ctx = await resolveMemberContext(supabase)
  if (!ctx) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any
  const { data: conn } = await admin
    .from('member_connections')
    .select(
      `id, created_at, status, intro_note, introduced_by,
       requester_accepted, recipient_accepted,
       requester:members!member_connections_requester_id_fkey(id, preferred_name, full_name),
       recipient:members!member_connections_recipient_id_fkey(id, preferred_name, full_name)`,
    )
    .eq('id', connectionId)
    .maybeSingle()

  if (!conn) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (conn.requester_id !== ctx.memberId && conn.recipient_id !== ctx.memberId) {
    return NextResponse.json({ error: 'Not a party to this connection' }, { status: 403 })
  }

  return NextResponse.json(conn)
}
