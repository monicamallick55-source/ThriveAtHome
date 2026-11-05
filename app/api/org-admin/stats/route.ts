/**
 * app/api/org-admin/stats/route.ts
 * Returns aggregate stats for the authenticated org admin's organization.
 */
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get the org this admin belongs to
    const { data: adminLink } = await supabase
      .from('org_admins')
      .select('org_id, role')
      .eq('supabase_auth_id', user.id)
      .single()

    if (!adminLink) return NextResponse.json({ error: 'Not an org admin' }, { status: 403 })
    const orgId = adminLink.org_id

    const [membersRes, orgRes, callsRes] = await Promise.all([
      supabase.from('members').select('id, status, created_at').eq('org_id', orgId),
      supabase.from('organizations').select('plan_name, seats_total, billing_cycle_end, white_label_name').eq('id', orgId).single(),
      supabase.from('call_logs').select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .gte('created_at', new Date(new Date().setDate(1)).toISOString()),
    ])

    const members = membersRes.data ?? []
    const org = orgRes.data
    const callCount = callsRes.count ?? 0

    const stats = {
      total_members: members.length,
      active_members: members.filter(m => m.status === 'active').length,
      pending_invitations: members.filter(m => m.status === 'pending').length,
      calls_this_month: callCount,
      plan_name: org?.plan_name ?? 'Standard',
      seats_used: members.filter(m => m.status !== 'cancelled').length,
      seats_total: org?.seats_total ?? 50,
      billing_cycle_end: org?.billing_cycle_end ?? null,
    }

    return NextResponse.json({ stats })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
