// Network Federation data layer — Phase 66
import { createAdminClient } from '../supabase/admin'

export interface NetworkAccountRow {
  id: string
  created_at: string
  name: string
  network_type: string
  contact_name: string
  contact_email: string
  website: string | null
  dues_per_org_per_year_cents: number
  member_org_count: number
  total_members_served: number
  status: string
}

export interface NetworkOrgRow {
  id: string
  org_name: string
  org_type: string
  city: string | null
  state: string | null
  network_id: string | null
}

export interface NetworkDuesRow {
  id: string
  created_at: string
  network_id: string
  org_id: string
  fiscal_year: number
  amount_cents: number
  due_date: string
  paid_date: string | null
  status: string
  payment_notes: string | null
  community_orgs?: { org_name: string; city: string | null; state: string | null }
}

export interface NetworkStats {
  member_org_count: number
  orgs_by_type: Record<string, number>
  total_members_across_network: number
  dues_paid_this_year: number
  dues_outstanding_this_year: number
  dues_revenue_cents: number
}

export async function getNetworkForAdmin(
  authUserId: string
): Promise<{ data: NetworkAccountRow | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data: fm } = await admin
      .from('family_members')
      .select('role, network_id')
      .eq('supabase_auth_id', authUserId)
      .maybeSingle()
    if (!fm) return { data: null, error: 'No family_members row found' }
    if (fm.role !== 'network_admin' && fm.role !== 'admin') return { data: null, error: 'Not a network admin' }
    if (fm.role === 'admin') {
      // Platform admin — return first network for now
      const { data } = await (admin.from as any)('network_accounts').select('*').limit(1).maybeSingle()
      return { data: data as NetworkAccountRow | null, error: null }
    }
    if (!fm.network_id) return { data: null, error: 'No network linked' }
    const { data } = await (admin.from as any)('network_accounts').select('*').eq('id', fm.network_id).maybeSingle()
    return { data: data as NetworkAccountRow | null, error: null }
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}

export async function getNetworkOrgs(
  networkId: string,
  limit = 100
): Promise<{ data: NetworkOrgRow[]; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await (admin.from as any)('community_orgs')
      .select('id, org_name, org_type, city, state, network_id')
      .eq('network_id', networkId)
      .limit(limit)
    if (error) return { data: [], error: error.message }
    return { data: (data ?? []) as NetworkOrgRow[], error: null }
  } catch (e) {
    return { data: [], error: e instanceof Error ? e.message : String(e) }
  }
}

export async function getNetworkDues(
  networkId: string,
  fiscalYear?: number
): Promise<{ data: NetworkDuesRow[]; error: string | null }> {
  try {
    const admin = createAdminClient()
    const year = fiscalYear ?? new Date().getFullYear()
    const { data, error } = await (admin.from as any)('network_dues')
      .select('*, community_orgs(org_name, city, state)')
      .eq('network_id', networkId)
      .eq('fiscal_year', year)
      .order('due_date', { ascending: true })
    if (error) return { data: [], error: error.message }
    return { data: (data ?? []) as NetworkDuesRow[], error: null }
  } catch (e) {
    return { data: [], error: e instanceof Error ? e.message : String(e) }
  }
}

export async function getNetworkStats(
  networkId: string
): Promise<{ data: NetworkStats; error: string | null }> {
  try {
    const admin = createAdminClient()
    const year = new Date().getFullYear()

    const [orgsRes, duesRes] = await Promise.all([
      (admin.from as any)('community_orgs').select('id, org_type').eq('network_id', networkId),
      (admin.from as any)('network_dues').select('status, amount_cents').eq('network_id', networkId).eq('fiscal_year', year),
    ])

    const orgs = (orgsRes.data ?? []) as { id: string; org_type: string }[]
    const dues = (duesRes.data ?? []) as { status: string; amount_cents: number }[]

    const orgsByType: Record<string, number> = {}
    for (const org of orgs) {
      orgsByType[org.org_type] = (orgsByType[org.org_type] ?? 0) + 1
    }

    const duesPaid = dues.filter(d => d.status === 'paid')
    const duesOutstanding = dues.filter(d => d.status === 'unpaid' || d.status === 'overdue')
    const revenueTotal = duesPaid.reduce((sum, d) => sum + (d.amount_cents ?? 0), 0)

    return {
      data: {
        member_org_count: orgs.length,
        orgs_by_type: orgsByType,
        total_members_across_network: 0,
        dues_paid_this_year: duesPaid.length,
        dues_outstanding_this_year: duesOutstanding.length,
        dues_revenue_cents: revenueTotal,
      },
      error: null,
    }
  } catch (e) {
    return {
      data: { member_org_count: 0, orgs_by_type: {}, total_members_across_network: 0, dues_paid_this_year: 0, dues_outstanding_this_year: 0, dues_revenue_cents: 0 },
      error: e instanceof Error ? e.message : String(e),
    }
  }
}

export async function recordDuesPayment(
  networkId: string,
  orgId: string,
  fiscalYear: number,
  amountCents: number
): Promise<{ data: NetworkDuesRow | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await (admin.from as any)('network_dues')
      .upsert({
        network_id: networkId,
        org_id: orgId,
        fiscal_year: fiscalYear,
        amount_cents: amountCents,
        due_date: `${fiscalYear}-01-31`,
        paid_date: today,
        status: 'paid',
      }, { onConflict: 'network_id,org_id,fiscal_year' })
      .select()
      .maybeSingle()
    if (error) return { data: null, error: error.message }
    return { data: data as NetworkDuesRow | null, error: null }
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}

export async function generateInvoicesForYear(
  networkId: string,
  orgIds: string[],
  fiscalYear: number,
  amountCents: number
): Promise<{ created: number; skipped: number; error: string | null }> {
  try {
    const admin = createAdminClient()
    let created = 0
    let skipped = 0
    for (const orgId of orgIds) {
      // Check if a dues record already exists for this org + year
      const { data: existing } = await (admin.from as any)('network_dues')
        .select('id')
        .eq('network_id', networkId)
        .eq('org_id', orgId)
        .eq('fiscal_year', fiscalYear)
        .maybeSingle()
      if (existing) { skipped++; continue }
      const { error } = await (admin.from as any)('network_dues').insert({
        network_id: networkId,
        org_id: orgId,
        fiscal_year: fiscalYear,
        amount_cents: amountCents,
        due_date: `${fiscalYear}-01-31`,
        status: 'unpaid',
      })
      if (!error) created++
    }
    return { created, skipped, error: null }
  } catch (e) {
    return { created: 0, skipped: 0, error: e instanceof Error ? e.message : String(e) }
  }
}

export async function linkOrgToNetwork(
  orgId: string,
  networkId: string
): Promise<{ error: string | null }> {
  try {
    const admin = createAdminClient()
    const { error } = await (admin.from as any)('community_orgs').update({ network_id: networkId }).eq('id', orgId)
    if (error) return { error: error.message }
    return { error: null }
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) }
  }
}
