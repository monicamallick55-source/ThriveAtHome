// POST /api/org-admin/memberships — record or update an org membership payment.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { upsertOrgMembership, getOrgForAdmin } from '@/lib/data/communityOrgs'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: fm } = await admin.from('family_members').select('role, org_id').eq('supabase_auth_id', user.id).maybeSingle()
  if (!fm || (fm.role !== 'org_admin' && fm.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!fm.org_id) return NextResponse.json({ error: 'No org linked to your account' }, { status: 400 })

  const body = await req.json().catch(() => null)
  if (!body?.member_id?.trim()) return NextResponse.json({ error: 'member_id is required' }, { status: 400 })

  const VALID_TIERS = ['sliding_scale_low', 'sliding_scale_mid', 'standard', 'supporting', 'organizational']
  if (!VALID_TIERS.includes(body.membership_tier)) {
    return NextResponse.json({ error: 'Invalid membership_tier' }, { status: 400 })
  }

  const duesCents = typeof body.annual_dues_paid_cents === 'number' ? body.annual_dues_paid_cents : 0

  const { data, error } = await upsertOrgMembership(body.member_id, fm.org_id as string, {
    membership_tier: body.membership_tier,
    annual_dues_paid_cents: duesCents,
    dues_paid_date: body.dues_paid_date || undefined,
    notes: body.notes?.trim() || undefined,
  })

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
