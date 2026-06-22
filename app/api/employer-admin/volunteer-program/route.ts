import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getUserRole } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  getCorporateProgramByEmployer,
  getProgramVolunteerSummaries,
  getAllHoursForExport,
  getCorporateProgramTotals,
} from '@/lib/data/corporate-volunteers'

// GET /api/employer-admin/volunteer-program?export=benevity|yourcause
// Returns program details + volunteer roster, or triggers CSV export
export async function GET(req: NextRequest) {
  const user = await requireAuth()
  const role = await getUserRole(user.id)
  if (role !== 'employer_admin' && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { data: fm } = await admin
    .from('family_members')
    .select('employer_account_id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  const employerId = fm?.employer_account_id ?? null
  if (!employerId && role !== 'admin') {
    return NextResponse.json({ error: 'No employer account linked' }, { status: 400 })
  }

  const searchParams = req.nextUrl.searchParams
  const exportFormat = searchParams.get('export') // 'benevity' | 'yourcause' | null

  // For admin users without employer_id, return empty
  if (!employerId) {
    return NextResponse.json({ program: null, summaries: [], totals: { totalHours: 0, totalMatchedValue: 0, volunteerCount: 0 } })
  }

  const { data: program } = await getCorporateProgramByEmployer(employerId)

  if (!program) {
    return NextResponse.json({ program: null, summaries: [], totals: { totalHours: 0, totalMatchedValue: 0, volunteerCount: 0 } })
  }

  if (exportFormat === 'benevity' || exportFormat === 'yourcause') {
    const { data: hours } = await getAllHoursForExport(program.id)
    const rows = hours ?? []

    let csv = ''
    if (exportFormat === 'benevity') {
      // Benevity import format
      csv = 'Employee Email,Organization Name,Hours,Date,Activity Description,Verification Status\n'
      for (const row of rows) {
        const verStatus = row.verified ? 'Verified' : 'Unverified'
        const activity = row.visit_type ? row.visit_type.replace(/_/g, ' ') : 'Volunteer service'
        csv += `"${row.volunteer_email}","ThriveAtHome",${row.hours_logged},"${row.logged_date}","${activity}","${verStatus}"\n`
      }
    } else {
      // YourCause import format
      csv = 'Employee Name,Email,Volunteer Date,Activity,Hours,Status,Organization Name\n'
      for (const row of rows) {
        const status = row.export_status === 'matched' ? 'Matched' : row.export_status === 'exported' ? 'Submitted' : 'Pending'
        const activity = row.visit_type ? row.visit_type.replace(/_/g, ' ') : 'Volunteer service'
        csv += `"${row.volunteer_name}","${row.volunteer_email}","${row.logged_date}","${activity}",${row.hours_logged},"${status}","ThriveAtHome"\n`
      }
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="volunteer-hours-${exportFormat}-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  }

  const [summaries, totals] = await Promise.all([
    getProgramVolunteerSummaries(program.id),
    getCorporateProgramTotals(program.id),
  ])

  return NextResponse.json({
    program,
    summaries: summaries.data ?? [],
    totals,
  })
}
