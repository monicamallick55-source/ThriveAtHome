// Full request history for the signed-in member: every service booking they've made
// plus every need they've posted to their community org, with current status.
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  let memberId: string | null = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: direct } = await (admin.from as any)('members').select('id').eq('supabase_auth_id', user.id).maybeSingle()
  if (direct?.id) memberId = direct.id
  else {
    const { data: fm } = await admin.from('family_members').select('member_id').eq('supabase_auth_id', user.id).maybeSingle()
    memberId = fm?.member_id ?? null
  }
  if (!memberId) return NextResponse.json({ bookings: [], needs: [] })

  const [{ data: bookings }, { data: needs }] = await Promise.all([
    admin.from('service_bookings')
      .select('id, created_at, service_type, status, requested_for, confirmed_at, completed_at, notes, booking_details')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false })
      .limit(100),
    (admin.from as any)('member_needs')
      .select('id, created_at, need_type, title, description, status, preferred_date, community_context')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  return NextResponse.json({ bookings: bookings ?? [], needs: needs ?? [] })
}
