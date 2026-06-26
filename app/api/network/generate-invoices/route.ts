import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateInvoicesForYear, getNetworkOrgs } from '@/lib/data/networks'

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
  const fiscalYear = body?.fiscal_year as number | undefined
  if (!fiscalYear || typeof fiscalYear !== 'number') {
    return NextResponse.json({ error: 'fiscal_year is required' }, { status: 400 })
  }

  const networkId = fm.network_id
  if (!networkId) return NextResponse.json({ error: 'Not linked to a network' }, { status: 400 })

  // Get dues amount from network row
  const { data: network } = await (admin.from as any)('network_accounts').select('dues_per_org_per_year_cents').eq('id', networkId).maybeSingle()
  if (!network) return NextResponse.json({ error: 'Network not found' }, { status: 404 })

  // Get all linked orgs
  const { data: orgs } = await getNetworkOrgs(networkId)
  const orgIds = (orgs ?? []).map((o: { id: string }) => o.id)
  if (orgIds.length === 0) return NextResponse.json({ error: 'No member organizations linked to this network' }, { status: 400 })

  const { created, skipped, error } = await generateInvoicesForYear(networkId, orgIds, fiscalYear, network.dues_per_org_per_year_cents)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ created, skipped, fiscal_year: fiscalYear })
}
