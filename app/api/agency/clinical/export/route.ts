// Clinical export — CSV download of SOAP notes and care plans for a member
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSoapNotesForMember, getCarePlansForMember } from '@/lib/data/clinicalDocs'

function escapeCsv(val: unknown): string {
  const s = val == null ? '' : String(val)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function toRow(fields: unknown[]): string {
  return fields.map(escapeCsv).join(',')
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const memberId = req.nextUrl.searchParams.get('memberId')
  const agencyId = req.nextUrl.searchParams.get('agencyId')
  const type = req.nextUrl.searchParams.get('type') ?? 'soap'

  if (!memberId || !agencyId) return NextResponse.json({ error: 'memberId and agencyId required' }, { status: 400 })

  // Verify caller is agency_admin for this agency
  const admin = createAdminClient()
  const { data: fm } = await admin.from('family_members').select('role, agency_id').eq('supabase_auth_id', user.id).maybeSingle()
  if (!fm || fm.role !== 'agency_admin' || fm.agency_id !== agencyId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let csv = ''

  if (type === 'care-plans') {
    const { data: plans } = await getCarePlansForMember(memberId, agencyId)
    csv = 'Version,Status,Effective Date,Review Date,Goals,Interventions,Visit Frequency,Diagnoses,Functional Status,Safety Concerns,Approved By,Approved At\n'
    for (const p of plans ?? []) {
      csv += toRow([
        p.version_number, p.status, p.effective_date, p.review_date,
        p.goals, p.interventions, p.visit_frequency, p.diagnoses.join('; '),
        p.functional_status, p.safety_concerns, p.approved_by_name, p.approved_at,
      ]) + '\n'
    }
  } else {
    // SOAP notes (default)
    const { data: notes } = await getSoapNotesForMember(memberId, agencyId)
    csv = 'Date,Visit Type,Duration (min),Status,Subjective,Objective,Assessment,Plan,Billing Codes,Signed By,Signed At\n'
    for (const n of notes ?? []) {
      csv += toRow([
        n.note_date, n.visit_type, n.duration_minutes, n.status,
        n.subjective, n.objective, n.assessment, n.plan,
        n.billing_codes.join('; '), n.signed_by_name, n.signed_at,
      ]) + '\n'
    }
  }

  const filename = type === 'care-plans' ? 'care-plans.csv' : 'soap-notes.csv'
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
