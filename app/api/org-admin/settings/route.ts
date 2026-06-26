// PATCH /api/org-admin/settings — update community org fee structure and description.
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { updateOrgFeeSettings } from '@/lib/data/communityOrgs'

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: fm } = await admin.from('family_members').select('role, org_id').eq('supabase_auth_id', user.id).maybeSingle()
  if (!fm || (fm.role !== 'org_admin' && fm.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!fm.org_id && fm.role !== 'admin') {
    return NextResponse.json({ error: 'No org linked to your account' }, { status: 400 })
  }

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { org_id, annual_dues_standard_cents, annual_dues_sliding_low_cents, annual_dues_sliding_mid_cents, dues_description } = body as {
    org_id?: string
    annual_dues_standard_cents?: number
    annual_dues_sliding_low_cents?: number
    annual_dues_sliding_mid_cents?: number
    dues_description?: string | null
  }

  const targetOrgId = (fm.role === 'admin' ? org_id : fm.org_id) as string | undefined
  if (!targetOrgId) return NextResponse.json({ error: 'org_id required' }, { status: 400 })

  if (
    typeof annual_dues_standard_cents !== 'number' ||
    typeof annual_dues_sliding_low_cents !== 'number' ||
    typeof annual_dues_sliding_mid_cents !== 'number'
  ) {
    return NextResponse.json({ error: 'Fee amounts are required numbers' }, { status: 400 })
  }
  if (annual_dues_standard_cents < 0 || annual_dues_sliding_low_cents < 0 || annual_dues_sliding_mid_cents < 0) {
    return NextResponse.json({ error: 'Fee amounts cannot be negative' }, { status: 400 })
  }

  const { data, error } = await updateOrgFeeSettings(targetOrgId, {
    annual_dues_standard_cents,
    annual_dues_sliding_low_cents,
    annual_dues_sliding_mid_cents,
    dues_description: dues_description ?? null,
  })
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ data })
}
