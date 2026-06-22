import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth, getUserRole } from '@/lib/auth'

export async function GET() {
  const user = await requireAuth()
  const role = await getUserRole(user.id)
  if (role !== 'employer_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()

  // Get the employer account linked to this admin
  const { data: adminRow } = await admin
    .from('family_members')
    .select('employer_account_id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  if (!adminRow?.employer_account_id) {
    return NextResponse.json({ error: 'No employer account linked' }, { status: 404 })
  }

  const employerId = adminRow.employer_account_id

  const [accountRes, employeesRes, invitationsRes] = await Promise.all([
    admin
      .from('employer_accounts')
      .select('*')
      .eq('id', employerId)
      .maybeSingle(),

    admin
      .from('family_members')
      .select('id, full_name, email, created_at, member_id')
      .eq('employer_account_id', employerId)
      .eq('role', 'family')
      .order('created_at', { ascending: false }),

    admin
      .from('employer_invitations')
      .select('id, email, status, created_at, expires_at, accepted_at')
      .eq('employer_account_id', employerId)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const employees = employeesRes.data ?? []
  const memberIds = employees.map((e) => e.member_id).filter(Boolean) as string[]

  // Aggregate check-in calls and alerts for all enrolled members
  let checkInCount = 0
  let alertCount = 0

  if (memberIds.length > 0) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const [callsRes, alertsRes] = await Promise.all([
      admin
        .from('check_in_calls')
        .select('id', { count: 'exact', head: true })
        .in('member_id', memberIds)
        .eq('status', 'completed')
        .gte('created_at', thirtyDaysAgo),

      admin
        .from('alerts')
        .select('id', { count: 'exact', head: true })
        .in('member_id', memberIds)
        .eq('acknowledged', false),
    ])

    checkInCount = callsRes.count ?? 0
    alertCount = alertsRes.count ?? 0
  }

  const account = accountRes.data
  const seatsUsed = employees.length

  // Sync seats_used if it differs
  if (account && account.seats_used !== seatsUsed) {
    await admin
      .from('employer_accounts')
      .update({ seats_used: seatsUsed })
      .eq('id', employerId)
  }

  return NextResponse.json({
    account: account ? { ...account, seats_used: seatsUsed } : null,
    employees,
    invitations: invitationsRes.data ?? [],
    stats: {
      seats_used: seatsUsed,
      seats_purchased: account?.seats_purchased ?? 0,
      check_in_count_30d: checkInCount,
      open_alerts: alertCount,
      pepm_price_cents: account?.pepm_price_cents ?? 1500,
      billing_cycle: account?.billing_cycle ?? 'monthly',
    },
  })
}
