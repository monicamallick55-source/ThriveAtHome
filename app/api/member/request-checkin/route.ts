import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { callProvider } from '@/lib/providers'
import type { CallContext } from '@/lib/interfaces/CallProvider'

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const body = await req.json().catch(() => ({}))
  const { preferred_time, notes, immediate = false } = body

  let memberId: string | null = null
  let memberName = 'A member'
  let memberPhone = ''
  let memberLang = 'english'
  let memberInterests: string[] = []

  const { data: directMember } = await (admin.from as any)('members')
    .select('id, preferred_name, phone_number, preferred_language, topics_enjoy')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  if (directMember?.id) {
    memberId = directMember.id
    memberName = directMember.preferred_name ?? memberName
    memberPhone = directMember.phone_number ?? ''
    memberLang = directMember.preferred_language ?? 'english'
    memberInterests = directMember.topics_enjoy ?? []
  } else {
    const { data: fm } = await admin
      .from('family_members')
      .select('member_id')
      .eq('supabase_auth_id', user.id)
      .maybeSingle()
    if (fm?.member_id) {
      memberId = fm.member_id
      const { data: m } = await admin
        .from('members')
        .select('preferred_name, phone_number, preferred_language, topics_enjoy')
        .eq('id', fm.member_id)
        .maybeSingle()
      memberName = m?.preferred_name ?? memberName
      memberPhone = m?.phone_number ?? ''
      memberLang = m?.preferred_language ?? 'english'
      memberInterests = m?.topics_enjoy ?? []
    }
  }

  if (!memberId) return NextResponse.json({ error: 'No member found' }, { status: 404 })

  const { data: cbReq, error: cbErr } = await (admin.from as any)('callback_requests').insert({
    member_id: memberId,
    requested_via: 'dashboard',
    preferred_time: preferred_time ?? null,
    notes: notes ?? null,
    status: immediate ? 'triggered' : 'pending',
    triggered_at: immediate ? new Date().toISOString() : null,
  }).select('id').single()

  if (cbErr) {
    console.error('[request-checkin] callback_requests insert failed:', cbErr)
    return NextResponse.json({ error: 'Could not save your request.' }, { status: 500 })
  }

  if (immediate && memberPhone) {
    try {
      const ctx: CallContext = {
        preferredName: memberName,
        interests: memberInterests,
        priorCallSummaries: [],
        preferredLanguage: memberLang,
      }

      const callId = await callProvider.scheduleCall(memberId, memberPhone, ctx)

      await (admin.from as any)('callback_requests')
        .update({ call_id: callId })
        .eq('id', cbReq.id)

      await admin.from('check_in_calls').insert({
        member_id: memberId,
        call_type: 'check_in',
        status: 'scheduled',
        scheduled_at: new Date().toISOString(),
        retell_call_id: callId,
      })

      console.log(`[request-checkin] Immediate Aria call triggered for ${memberName} (${memberId})`)
      return NextResponse.json({ success: true, mode: 'immediate', call_id: callId })
    } catch (e) {
      console.error('[request-checkin] Retell trigger failed:', e)
      return NextResponse.json({ success: true, mode: 'queued', note: 'Call queued — will be placed shortly.' })
    }
  }

  console.log(`[request-checkin] ${memberName} scheduled callback for ${preferred_time ?? 'next available'}`)
  return NextResponse.json({ success: true, mode: 'scheduled', request_id: cbReq.id })
}
