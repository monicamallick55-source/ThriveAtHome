// PATCH /api/org-admin/member-needs/[needId] — update need status (claim / fulfill / cancel).
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { updateMemberNeedStatus } from '@/lib/data/communityOrgs'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ needId: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: fm } = await admin.from('family_members').select('role, org_id').eq('supabase_auth_id', user.id).maybeSingle()
  if (!fm || (fm.role !== 'org_admin' && fm.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const VALID_STATUSES = ['open', 'claimed', 'fulfilled', 'cancelled']
  if (!body?.status || !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: 'Valid status required: open, claimed, fulfilled, cancelled' }, { status: 400 })
  }

  const { needId } = await params
  const { data, error } = await updateMemberNeedStatus(needId, body.status, {
    fulfillment_notes: body.fulfillment_notes?.trim() || undefined,
  })

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ data })
}
