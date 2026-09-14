import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // Find member ID
  let memberId: string | null = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: directMember } = await (admin.from as any)('members').select('id').eq('supabase_auth_id', user.id).maybeSingle()
  if (directMember?.id) {
    memberId = directMember.id
  } else {
    const { data: fm } = await admin.from('family_members').select('member_id').eq('supabase_auth_id', user.id).maybeSingle()
    memberId = fm?.member_id ?? null
  }

  if (!memberId) return NextResponse.json({ data: null })

  // Get org membership
  const { data: membership } = await (admin.from as any)('org_memberships')
    .select('id, tier, amount_cents, payment_date, org_id')
    .eq('member_id', memberId)
    .order('payment_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!membership?.org_id) return NextResponse.json({ data: null })

  // Get org details + programs
  const { data: org } = await (admin.from as any)('community_orgs')
    .select('id, name:org_name, description, dues_description')
    .eq('id', membership.org_id)
    .maybeSingle()

  const { data: programs } = await (admin.from as any)('org_programs')
    .select('id, name:program_name, program_type, description, schedule_description, contact_person:contact_name')
    .eq('org_id', membership.org_id)
    .order('created_at', { ascending: true })
    .limit(10)

  return NextResponse.json({ data: { membership, org, programs: programs ?? [] } })
}
