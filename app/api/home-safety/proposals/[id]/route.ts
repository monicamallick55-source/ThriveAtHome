// app/api/home-safety/proposals/[id]/route.ts
// PATCH — member responds to a proposal (accept_all / accept_some / decline)
//         or staff updates proposal status

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(
  req: Request,
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
  const isStaff = fm.role === 'admin' || fm.role === 'navigator'

  // Load proposal + enrollment to check ownership
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: proposal } = await (admin as any)
    .from('safety_proposals')
    .select('id, enrollment_id, status, safety_program_enrollments(member_id)')
    .eq('id', id)
    .maybeSingle()

  if (!proposal) return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })

  const enrollmentMemberId = proposal.safety_program_enrollments?.member_id
  const isOwner = fm.member_id === enrollmentMemberId
  if (!isOwner && !isStaff) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({}))

  // Member responds: provide line_decisions: { [lineId]: true|false }
  if (body.line_decisions && typeof body.line_decisions === 'object') {
    const decisions = body.line_decisions as Record<string, boolean>
    // Update each line
    for (const [lineId, accepted] of Object.entries(decisions)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any)
        .from('safety_proposal_lines')
        .update({ accepted })
        .eq('id', lineId)
        .eq('proposal_id', id)
    }

    // Determine proposal status from lines
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: lines } = await (admin as any)
      .from('safety_proposal_lines')
      .select('accepted')
      .eq('proposal_id', id)

    const allAccepted = lines?.every((l: { accepted: boolean | null }) => l.accepted === true)
    const anyAccepted = lines?.some((l: { accepted: boolean | null }) => l.accepted === true)
    const allDeclined = lines?.every((l: { accepted: boolean | null }) => l.accepted === false)

    const newStatus = allDeclined ? 'declined' : allAccepted ? 'accepted_all' : anyAccepted ? 'accepted_some' : proposal.status

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updated, error } = await (admin as any)
      .from('safety_proposals')
      .update({ status: newStatus, responded_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(updated)
  }

  // Staff updates: status, sent_at, etc.
  if (isStaff) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const patch: Record<string, any> = {}
    if (body.status) patch.status = body.status
    if (body.sent_at !== undefined) patch.sent_at = body.sent_at

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updated, error } = await (admin as any)
      .from('safety_proposals')
      .update(patch)
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(updated)
  }

  return NextResponse.json({ error: 'No valid update provided' }, { status: 400 })
}
