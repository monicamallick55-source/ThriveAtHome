// PATCH /api/org-admin/integrations — save Helpful Village / Mon Ami integration settings
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: fm } = await admin
    .from('family_members')
    .select('role, org_id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  if (!fm || (fm.role !== 'org_admin' && fm.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const orgId = fm.org_id as string | null
  if (!orgId && fm.role !== 'admin') {
    return NextResponse.json({ error: 'No org linked' }, { status: 400 })
  }

  let body: Record<string, unknown>
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { helpful_village_org_id, hv_sync_enabled } = body as {
    helpful_village_org_id?: string | null
    hv_sync_enabled?: boolean
  }

  const updates: Record<string, unknown> = {}
  if (helpful_village_org_id !== undefined) updates.helpful_village_org_id = helpful_village_org_id || null
  if (hv_sync_enabled !== undefined) updates.hv_sync_enabled = hv_sync_enabled

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const { error } = await (admin as any)
    .from('community_orgs')
    .update(updates)
    .eq('id', orgId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// GET — return current integration settings including API key
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: fm } = await admin
    .from('family_members')
    .select('role, org_id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  if (!fm || (fm.role !== 'org_admin' && fm.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const orgId = fm.org_id as string | null
  if (!orgId) return NextResponse.json({ error: 'No org linked' }, { status: 400 })

  const { data: org } = await (admin as any)
    .from('community_orgs')
    .select('helpful_village_org_id, hv_sync_enabled, mon_ami_integration, org_api_key, plan_tier, member_count')
    .eq('id', orgId)
    .maybeSingle()

  if (!org) return NextResponse.json({ error: 'Org not found' }, { status: 404 })

  return NextResponse.json({ data: org })
}
