// app/api/admin/volunteers/vavs-export/route.ts
// GET — download VAVS hours export CSV
// Columns: volunteer name, VSO, date, hours, service type
// Filters: ?from=YYYY-MM-DD&to=YYYY-MM-DD&vso=vfw (all optional)

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  const { data: isStaff } = await supabase.rpc('is_staff')
  if (!isStaff) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const vso = searchParams.get('vso')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any

  // Load volunteer_hours joined to volunteers + members
  let query = admin
    .from('volunteer_hours')
    .select(`
      id,
      service_date,
      hours,
      service_type,
      notes,
      volunteer:volunteers(
        id,
        vso_affiliation,
        vso_member_number,
        member:members(full_name, preferred_name)
      )
    `)
    .order('service_date', { ascending: false })

  if (from) query = query.gte('service_date', from)
  if (to) query = query.lte('service_date', to)

  const { data: rows, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Filter by VSO if requested (post-filter since it's on the join)
  const filtered = (rows ?? []).filter((r: Record<string, unknown>) => {
    const vol = r.volunteer as Record<string, unknown> | null
    if (!vol) return false
    if (vso && vol.vso_affiliation !== vso) return false
    // Only include volunteers with a VSO affiliation (exclude 'none')
    return vol.vso_affiliation !== 'none'
  })

  // Build CSV
  const VSO_LABELS: Record<string, string> = {
    vfw: 'VFW',
    american_legion: 'American Legion',
    dav: 'DAV',
    amvets: 'AMVETS',
    moaa: 'MOAA',
    uso: 'USO',
    other: 'Other',
    none: '',
  }

  const headers = ['Volunteer Name', 'VSO', 'VSO Member #', 'Date', 'Hours', 'Service Type', 'Notes']
  const csvRows = [headers.join(',')]

  for (const row of filtered) {
    const r = row as Record<string, unknown>
    const vol = r.volunteer as Record<string, unknown> | null
    const member = vol?.member as Record<string, string> | null
    const name = member?.preferred_name ?? member?.full_name ?? ''
    const vsoLabel = VSO_LABELS[String(vol?.vso_affiliation ?? '')] ?? ''
    const memberNum = String(vol?.vso_member_number ?? '')
    const date = String(r.service_date ?? '')
    const hours = String(r.hours ?? '')
    const serviceType = String(r.service_type ?? '')
    const notes = String(r.notes ?? '').replace(/"/g, '""')

    csvRows.push([
      `"${name}"`,
      `"${vsoLabel}"`,
      `"${memberNum}"`,
      date,
      hours,
      `"${serviceType}"`,
      `"${notes}"`,
    ].join(','))
  }

  const csv = csvRows.join('\n')
  const filename = `vavs-hours-${new Date().toISOString().split('T')[0]}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
