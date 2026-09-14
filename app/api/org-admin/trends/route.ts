// Org admin 12-month trend report (Batch 3, item 4). Returns one bucket per month
// for: service request volume, volunteer hours logged, new members, and community
// needs posted — all scoped to the caller's organization.
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

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
  if (!fm.org_id) return NextResponse.json({ error: 'No org linked to your account' }, { status: 400 })

  // Build the 12 month buckets (oldest first, ending with the current month).
  const now = new Date()
  const buckets: { month: string; label: string; service_volume: number; volunteer_hours: number; new_members: number; needs_posted: number }[] = []
  const index: Record<string, number> = {}
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))
    const key = monthKey(d)
    index[key] = buckets.length
    buckets.push({
      month: key,
      label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' }),
      service_volume: 0, volunteer_hours: 0, new_members: 0, needs_posted: 0,
    })
  }
  const since = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1)).toISOString()

  // Member ids for this org (used to scope service bookings + volunteer hours).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: memRows } = await (admin.from as any)('org_memberships')
    .select('member_id, created_at')
    .eq('org_id', fm.org_id)
  const memberIds: string[] = (memRows ?? []).map((m: { member_id: string }) => m.member_id)
  for (const m of memRows ?? []) {
    const k = monthKey(new Date(m.created_at))
    if (k in index) buckets[index[k]].new_members++
  }

  if (memberIds.length > 0) {
    const [{ data: bookings }, { data: visits }] = await Promise.all([
      admin.from('service_bookings').select('created_at').in('member_id', memberIds).gte('created_at', since),
      admin.from('volunteer_visits').select('visit_date, duration_minutes').in('member_id', memberIds).gte('visit_date', since.slice(0, 10)),
    ])
    for (const b of bookings ?? []) {
      const k = monthKey(new Date(b.created_at))
      if (k in index) buckets[index[k]].service_volume++
    }
    for (const v of visits ?? []) {
      const k = monthKey(new Date(v.visit_date))
      if (k in index) buckets[index[k]].volunteer_hours += Math.round(((v.duration_minutes ?? 0) / 60) * 10) / 10
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: needs } = await (admin.from as any)('member_needs')
    .select('created_at')
    .eq('org_id', fm.org_id)
    .gte('created_at', since)
  for (const n of needs ?? []) {
    const k = monthKey(new Date(n.created_at))
    if (k in index) buckets[index[k]].needs_posted++
  }

  buckets.forEach(b => { b.volunteer_hours = Math.round(b.volunteer_hours * 10) / 10 })
  return NextResponse.json({ trends: buckets })
}
