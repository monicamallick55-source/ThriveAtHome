import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getVolunteerByAuthId } from '@/lib/data/volunteers'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: volunteer, error: volError } = await getVolunteerByAuthId(user.id)
  if (volError || !volunteer || volunteer.status !== 'active') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  if (!body?.need_id) return NextResponse.json({ error: 'need_id is required' }, { status: 400 })

  const admin = createAdminClient()

  // Verify the need is still open
  const { data: need } = await (admin.from as any)('member_needs')
    .select('id, status')
    .eq('id', body.need_id)
    .eq('status', 'open')
    .maybeSingle()

  if (!need) return NextResponse.json({ error: 'Need not found or already claimed' }, { status: 404 })

  const { data, error } = await (admin.from as any)('member_needs')
    .update({
      status: 'claimed',
      claimed_by_volunteer_id: volunteer.id,
      claimed_at: new Date().toISOString(),
    })
    .eq('id', body.need_id)
    .eq('status', 'open')
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
