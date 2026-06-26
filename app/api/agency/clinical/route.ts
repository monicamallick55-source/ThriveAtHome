// SOAP notes API — GET list for a member, POST to create a new note
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createSoapNote, getSoapNotesForMember } from '@/lib/data/clinicalDocs'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const memberId = req.nextUrl.searchParams.get('memberId')
  const agencyId = req.nextUrl.searchParams.get('agencyId')
  if (!memberId || !agencyId) return NextResponse.json({ error: 'memberId and agencyId required' }, { status: 400 })

  const { data, error } = await getSoapNotesForMember(memberId, agencyId)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { member_id, agency_id, subjective, objective, assessment, plan, billing_codes, note_date, visit_type, duration_minutes } = body as {
    member_id: string; agency_id: string; subjective: string; objective: string
    assessment: string; plan: string; billing_codes: string[]; note_date: string
    visit_type: string | null; duration_minutes: number | null
  }

  if (!member_id || !agency_id) return NextResponse.json({ error: 'member_id and agency_id required' }, { status: 400 })

  // Verify caller is agency_admin for this agency
  const admin = createAdminClient()
  const { data: fm } = await admin.from('family_members').select('role, agency_id').eq('supabase_auth_id', user.id).maybeSingle()
  if (!fm || fm.role !== 'agency_admin' || fm.agency_id !== agency_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await createSoapNote({
    member_id,
    agency_id,
    subjective: subjective ?? '',
    objective: objective ?? '',
    assessment: assessment ?? '',
    plan: plan ?? '',
    billing_codes: billing_codes ?? [],
    note_date: note_date ?? new Date().toISOString().split('T')[0],
    visit_type: visit_type ?? null,
    duration_minutes: duration_minutes ?? null,
  })

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
