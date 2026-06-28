// Agency wellness API — returns agency clients with Aria call data, alerts, and visit history.
// Agency admin only. No PHI aggregation — individual member data (agency has signed BAA).
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function getAgencyAdmin() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  const admin = createAdminClient()
  const { data: fm } = await admin
    .from('family_members')
    .select('role, agency_id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()
  if (!fm || fm.role !== 'agency_admin' || !fm.agency_id) return null
  return { admin, agencyId: fm.agency_id as string }
}

export async function GET() {
  const ctx = await getAgencyAdmin()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { admin, agencyId } = ctx

  // Get distinct member_ids served by this agency (from care_visits)
  const { data: visitMembers } = await (admin as any)
    .from('care_visits')
    .select('member_id')
    .eq('agency_id', agencyId)

  const rawVisitMembers: { member_id: string }[] = (visitMembers ?? []) as { member_id: string }[]
  const memberIds: string[] = [...new Set(rawVisitMembers.map(v => v.member_id))]

  if (memberIds.length === 0) {
    return NextResponse.json({ clients: [], total: 0 })
  }

  // Fetch member basics (no DOB, address — only wellness-relevant fields)
  const { data: members } = await admin
    .from('members')
    .select('id, preferred_name, full_name, status, check_in_frequency')
    .in('id', memberIds)
    .eq('status', 'active')

  const activeMemberIds = (members ?? []).map((m: { id: string }) => m.id)

  // Last Aria check-in call per member
  const { data: calls } = await admin
    .from('check_in_calls')
    .select('member_id, created_at, mood_score, status')
    .in('member_id', activeMemberIds)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })

  const lastCallByMember: Record<string, { created_at: string; mood_score: number | null }> = {}
  for (const c of (calls ?? []) as { member_id: string; created_at: string; mood_score: number | null }[]) {
    if (!lastCallByMember[c.member_id]) lastCallByMember[c.member_id] = { created_at: c.created_at, mood_score: c.mood_score }
  }

  // Previous Aria call for mood trend arrow
  const prevCallByMember: Record<string, number | null> = {}
  const seenFirst = new Set<string>()
  for (const c of (calls ?? []) as { member_id: string; mood_score: number | null }[]) {
    if (!seenFirst.has(c.member_id)) { seenFirst.add(c.member_id); continue }
    if (!(c.member_id in prevCallByMember)) prevCallByMember[c.member_id] = c.mood_score
  }

  // Unacknowledged alerts
  const { data: alerts } = await admin
    .from('alerts')
    .select('member_id, severity')
    .in('member_id', activeMemberIds)
    .eq('acknowledged', false)

  const alertsByMember: Record<string, number> = {}
  for (const a of (alerts ?? []) as { member_id: string; severity: string }[]) {
    alertsByMember[a.member_id] = (alertsByMember[a.member_id] ?? 0) + 1
  }

  // Last care_visit per member
  const { data: lastVisits } = await (admin as any)
    .from('care_visits')
    .select('member_id, scheduled_date, visit_type')
    .eq('agency_id', agencyId)
    .in('member_id', activeMemberIds)
    .eq('status', 'completed')
    .order('scheduled_date', { ascending: false })

  const lastVisitByMember: Record<string, { scheduled_date: string; visit_type: string }> = {}
  for (const v of (lastVisits ?? []) as { member_id: string; scheduled_date: string; visit_type: string }[]) {
    if (!lastVisitByMember[v.member_id]) lastVisitByMember[v.member_id] = { scheduled_date: v.scheduled_date, visit_type: v.visit_type }
  }

  const clients = (members ?? []).map((m: { id: string; preferred_name: string; full_name: string }) => {
    const lastCall = lastCallByMember[m.id]
    const prevMood = prevCallByMember[m.id] ?? null
    const currMood = lastCall?.mood_score ?? null
    const trend = currMood !== null && prevMood !== null
      ? currMood > prevMood ? 'up' : currMood < prevMood ? 'down' : 'stable'
      : 'unknown'
    return {
      id: m.id,
      preferred_name: m.preferred_name,
      full_name: m.full_name,
      last_aria_call_at: lastCall?.created_at ?? null,
      last_mood_score: currMood,
      mood_trend: trend,
      alert_count: alertsByMember[m.id] ?? 0,
      last_visit_date: lastVisitByMember[m.id]?.scheduled_date ?? null,
      last_visit_type: lastVisitByMember[m.id]?.visit_type ?? null,
    }
  })

  return NextResponse.json({ clients, total: clients.length })
}
