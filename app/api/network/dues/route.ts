import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { recordDuesPayment } from '@/lib/data/networks'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: fm } = await admin.from('family_members').select('role, network_id').eq('supabase_auth_id', user.id).maybeSingle()
  if (!fm || (fm.role !== 'network_admin' && fm.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  if (!body?.org_id) return NextResponse.json({ error: 'org_id is required' }, { status: 400 })
  if (!body?.fiscal_year) return NextResponse.json({ error: 'fiscal_year is required' }, { status: 400 })
  if (!body?.amount_cents || body.amount_cents <= 0) return NextResponse.json({ error: 'amount_cents is required' }, { status: 400 })

  // For network_admin, verify the org belongs to their network
  const networkId = fm.network_id
  if (fm.role === 'network_admin' && networkId) {
    const { data: org } = await (admin.from as any)('community_orgs')
      .select('network_id')
      .eq('id', body.org_id)
      .maybeSingle()
    if (!org || org.network_id !== networkId) {
      return NextResponse.json({ error: 'Org not in your network' }, { status: 403 })
    }
  }

  // For admin role, use org's network_id
  let resolvedNetworkId = networkId
  if (fm.role === 'admin' || !resolvedNetworkId) {
    const { data: org } = await (admin.from as any)('community_orgs').select('network_id').eq('id', body.org_id).maybeSingle()
    resolvedNetworkId = org?.network_id
  }
  if (!resolvedNetworkId) return NextResponse.json({ error: 'Org not linked to any network' }, { status: 400 })

  const { data, error } = await recordDuesPayment(resolvedNetworkId, body.org_id, body.fiscal_year, body.amount_cents)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ data }, { status: 200 })
}
