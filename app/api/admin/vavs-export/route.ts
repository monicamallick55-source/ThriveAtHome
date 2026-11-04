/**
 * app/api/admin/vavs-export/route.ts — G5.10
 * GET /api/admin/vavs-export?start=YYYY-MM-DD&end=YYYY-MM-DD
 * Returns CSV: volunteer name, VSO affiliation, date, hours, service type
 * Admin only.
 */
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: staff } = await supabase
      .from('members')
      .select('org_id, role')
      .eq('user_id', user.id)
      .single()
    if (!staff || staff.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const url = new URL(req.url)
    const start = url.searchParams.get('start')
    const end = url.searchParams.get('end')

    let query = supabase
      .from('volunteer_hours')
      .select(`
        id, hours, service_type, logged_at,
        volunteers!inner(
          id, full_name, vso_affiliation,
          members!inner(org_id)
        )
      `)
      .not('volunteers.vso_affiliation', 'is', null)
      .eq('volunteers.members.org_id', staff.org_id)

    if (start) query = query.gte('logged_at', `${start}T00:00:00Z`)
    if (end) query = query.lte('logged_at', `${end}T23:59:59Z`)

    const { data, error } = await query.order('logged_at')
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    const rows = (data ?? []).map((h: any, i: number) => ({
      row: i + 1,
      volunteer_name: h.volunteers?.full_name ?? '',
      vso_affiliation: h.volunteers?.vso_affiliation ?? '',
      date: h.logged_at?.split('T')[0] ?? '',
      hours: h.hours ?? 0,
      service_type: h.service_type ?? '',
    }))

    const headers = ['row', 'volunteer_name', 'vso_affiliation', 'date', 'hours', 'service_type']
    const escape = (v: unknown) => {
      const s = String(v ?? '')
      return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s
    }
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => escape((r as any)[h])).join(','))].join('\n')

    const filename = `vavs-hours-${start ?? 'all'}-${end ?? 'all'}.csv`
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
