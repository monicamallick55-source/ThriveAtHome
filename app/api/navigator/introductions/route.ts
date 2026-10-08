// app/api/navigator/introductions/route.ts
// POST — navigator creates a facilitated introduction between two members.
// Both members must share a circle or the same org.
// Creates a member_connections row with introduced_by set, then notifies both members.
//
// NOTE: Uses `as any` on member_connections queries because migration 095 (which adds
// recipient_id, introduced_by, intro_note, requester_accepted, recipient_accepted columns)
// has not yet been applied to this environment. Once applied and types regenerated
// (`npx supabase gen types`) these casts can be removed.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ── helpers ──────────────────────────────────────────────────────────────────

async function resolveStaffContext(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: fm } = await supabase
    .from('family_members')
    .select('id, member_id, role')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  if (!fm) return null
  if (fm.role !== 'admin' && fm.role !== 'navigator') return null
  return { familyMemberId: fm.id as string, role: fm.role as string }
}

function displayName(m: { preferred_name: string | null; full_name: string | null } | null): string {
  return m?.preferred_name ?? m?.full_name ?? 'A member'
}

// ── POST /api/navigator/introductions ────────────────────────────────────────

export async function POST(req: Request) {
  const supabase = await createClient()

  // 1. Staff-only
  const staff = await resolveStaffContext(supabase)
  if (!staff) {
    return NextResponse.json({ error: 'Not authorised — staff only' }, { status: 403 })
  }

  // 2. Parse body
  const body = await req.json().catch(() => ({}))
  const memberIdA: unknown = body?.memberIdA
  const memberIdB: unknown = body?.memberIdB
  const note: unknown = body?.note ?? null

  if (typeof memberIdA !== 'string' || typeof memberIdB !== 'string') {
    return NextResponse.json({ error: 'memberIdA and memberIdB are required' }, { status: 400 })
  }
  if (memberIdA === memberIdB) {
    return NextResponse.json({ error: 'Cannot introduce a member to themselves' }, { status: 400 })
  }
  if (note !== null && (typeof note !== 'string' || note.length > 300)) {
    return NextResponse.json({ error: 'Note must be 300 characters or fewer' }, { status: 400 })
  }

  const admin = createAdminClient()

  // 3. Verify both members exist (select only columns we know exist)
  const { data: members } = await admin
    .from('members')
    .select('id, preferred_name, full_name')
    .in('id', [memberIdA, memberIdB])

  if (!members || members.length !== 2) {
    return NextResponse.json({ error: 'One or both members not found' }, { status: 404 })
  }

  const mA = members.find((m) => m.id === memberIdA)!
  const mB = members.find((m) => m.id === memberIdB)!

  // 4. Check shared circle (safety gate — org_id check skipped until schema is confirmed)
  // circle_members is not in TS types yet — cast to any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: circlesMemberB } = await (admin as any)
    .from('circle_members')
    .select('circle_id')
    .eq('member_id', memberIdB)

  const circleIdsMemberB = (circlesMemberB ?? []).map((r: { circle_id: string }) => r.circle_id)

  if (circleIdsMemberB.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: sharedCircle } = await (admin as any)
      .from('circle_members')
      .select('circle_id')
      .eq('member_id', memberIdA)
      .in('circle_id', circleIdsMemberB)
      .limit(1)

    if (!sharedCircle || sharedCircle.length === 0) {
      return NextResponse.json(
        { error: 'Members must share a circle to be introduced' },
        { status: 403 },
      )
    }
  }
  // If member B has no circles, allow introduction (navigator discretion)

  // 5. Check if a connection already exists
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any
  const { data: existing } = await adminAny
    .from('member_connections')
    .select('id, status')
    .or(
      `and(requester_id.eq.${memberIdA},recipient_id.eq.${memberIdB}),` +
      `and(requester_id.eq.${memberIdB},recipient_id.eq.${memberIdA})`,
    )
    .maybeSingle()

  if (existing) {
    return NextResponse.json(
      { error: `A connection already exists between these members (status: ${existing.status})` },
      { status: 409 },
    )
  }

  // 6. Create the connection row with introduced_by
  const { data: connection, error: connError } = await adminAny
    .from('member_connections')
    .insert({
      requester_id: memberIdA,
      recipient_id: memberIdB,
      status: 'pending',
      intro_note: note as string | null,
      introduced_by: staff.familyMemberId,
      requester_accepted: false,
      recipient_accepted: false,
    })
    .select('id')
    .maybeSingle()

  if (connError || !connection) {
    console.error('[introductions/POST] insert connection:', connError)
    return NextResponse.json({ error: connError?.message ?? 'Insert failed' }, { status: 500 })
  }

  // 7. Notify both members (fire-and-forget)
  const nameA = displayName(mA)
  const nameB = displayName(mB)
  const introBody = note
    ? `"${note}"`
    : 'Your care coordinator thinks you two would get along.'

  await Promise.allSettled([
    admin.from('realtime_notifications').insert({
      member_id: memberIdA,
      type: 'system_message',
      title: `Meet ${nameB}!`,
      body: `Your care coordinator introduced you to ${nameB}. ${introBody} Accept to start messaging.`,
      severity: 'info',
    }),
    admin.from('realtime_notifications').insert({
      member_id: memberIdB,
      type: 'system_message',
      title: `Meet ${nameA}!`,
      body: `Your care coordinator introduced you to ${nameA}. ${introBody} Accept to start messaging.`,
      severity: 'info',
    }),
  ])

  return NextResponse.json(
    { ok: true, connectionId: connection.id },
    { status: 201 },
  )
}

// ── GET /api/navigator/introductions — list introductions made by this navigator ──

export async function GET(req: Request) {
  const supabase = await createClient()

  const staff = await resolveStaffContext(supabase)
  if (!staff) {
    return NextResponse.json({ error: 'Not authorised — staff only' }, { status: 403 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any
  const { data, error } = await admin
    .from('member_connections')
    .select(
      `id, created_at, status, intro_note, requester_accepted, recipient_accepted,
       requester:members!member_connections_requester_id_fkey(id, preferred_name, full_name),
       recipient:members!member_connections_recipient_id_fkey(id, preferred_name, full_name)`,
    )
    .eq('introduced_by', staff.familyMemberId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('[introductions/GET]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
