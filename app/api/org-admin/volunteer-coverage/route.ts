// Org admin / navigator view of volunteer weekly-availability coverage (Batch 3, item 3).
// Returns, per day of week, how many volunteers have published any availability and
// the union of covered hours, plus a flag for days with no coverage at all.
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: fm } = await admin
    .from('family_members')
    .select('role')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()
  if (!fm || !['org_admin', 'admin', 'navigator'].includes(fm.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: shifts } = await (admin.from as any)('volunteer_shifts')
    .select('volunteer_id, day_of_week, start_time, end_time')

  const byDay = DAY_NAMES.map((name: any, dow: number) => {
    const rows = (shifts ?? []).filter((s: { day_of_week: number }) => s.day_of_week === dow)
    const volunteers = new Set(rows.map((r: { volunteer_id: string }) => r.volunteer_id))
    // Union of covered clock-hours (0-23).
    const hours = new Set<number>()
    for (const r of rows as { start_time: string; end_time: string }[]) {
      const start = parseInt(r.start_time.slice(0, 2), 10)
      const end = parseInt(r.end_time.slice(0, 2), 10)
      for (let h = start; h < end; h++) hours.add(h)
    }
    return {
      day_of_week: dow,
      day: name,
      volunteer_count: volunteers.size,
      covered_hours: [...hours].sort((a, b) => a - b),
      gap: volunteers.size === 0,
    }
  })

  const totalVolunteers = new Set((shifts ?? []).map((s: { volunteer_id: string }) => s.volunteer_id)).size
  return NextResponse.json({ coverage: byDay, volunteers_with_availability: totalVolunteers })
}
