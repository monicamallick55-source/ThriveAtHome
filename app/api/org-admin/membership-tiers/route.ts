// GET /api/org-admin/membership-tiers — list custom tiers for the org.
// POST /api/org-admin/membership-tiers — create a custom membership tier.
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { getOrgMembershipTiers, createOrgMembershipTier } from '@/lib/data/communityOrgs'

async function getOrgId(userId: string): Promise<{ orgId: string | null; role: string | null; error?: string }> {
  const admin = createAdminClient()
  const { data: fm } = await admin.from('family_members').select('role, org_id').eq('supabase_auth_id', userId).maybeSingle()
  if (!fm) return { orgId: null, role: null, error: 'Not found' }
  if (fm.role !== 'org_admin' && fm.role !== 'admin') return { orgId: null, role: fm.role, error: 'Forbidden' }
  return { orgId: fm.org_id ?? null, role: fm.role }
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const { orgId, role, error: roleError } = await getOrgId(user.id)
  if (roleError === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const targetOrgId = (role === 'admin' ? searchParams.get('org_id') : orgId) ?? ''
  if (!targetOrgId) return NextResponse.json({ data: [] })

  const { data, error } = await getOrgMembershipTiers(targetOrgId)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { orgId, role, error: roleError } = await getOrgId(user.id)
  if (roleError === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { org_id, tier_name, amount_cents, description } = body as {
    org_id?: string
    tier_name?: string
    amount_cents?: number
    description?: string
  }

  const targetOrgId = (role === 'admin' ? org_id : orgId) ?? ''
  if (!targetOrgId) return NextResponse.json({ error: 'No org linked' }, { status: 400 })
  if (!tier_name?.trim()) return NextResponse.json({ error: 'tier_name is required' }, { status: 400 })
  if (typeof amount_cents !== 'number' || amount_cents < 0) return NextResponse.json({ error: 'amount_cents must be a non-negative number' }, { status: 400 })

  const { data, error } = await createOrgMembershipTier(targetOrgId, { tier_name: tier_name.trim(), amount_cents, description })
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
