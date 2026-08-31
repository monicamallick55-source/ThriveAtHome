import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const { preferred_call_time, topics_enjoy, preferred_language, phone_number, check_in_frequency, aria_call_opted_in } = body

  const admin = createAdminClient()

  // Find member — either via direct auth or via family_members link
  let memberId: string | null = null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: directMember } = await (admin.from as any)('members')
    .select('id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  if (directMember?.id) {
    memberId = directMember.id
  } else {
    const { data: fm } = await admin
      .from('family_members')
      .select('member_id')
      .eq('supabase_auth_id', user.id)
      .maybeSingle()
    memberId = fm?.member_id ?? null
  }

  if (!memberId) return NextResponse.json({ error: 'No member found' }, { status: 404 })

  const updates: Record<string, unknown> = {}
  if (preferred_call_time !== undefined) updates.preferred_call_time = preferred_call_time
  if (topics_enjoy !== undefined) updates.topics_enjoy = topics_enjoy
  if (preferred_language !== undefined) updates.preferred_language = preferred_language
  if (phone_number !== undefined) updates.phone_number = phone_number
  if (check_in_frequency !== undefined) updates.check_in_frequency = check_in_frequency
  if (aria_call_opted_in !== undefined) updates.aria_call_opted_in = Boolean(aria_call_opted_in)

  const { error } = await (admin.from as any)('members').update(updates).eq('id', memberId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
