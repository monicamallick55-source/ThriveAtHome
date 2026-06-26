// Care plan versions API — GET history, POST to create new version
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCarePlansForMember, createCarePlanVersion, approveCarePlanVersion } from '@/lib/data/clinicalDocs'

async function verifyAgencyAccess(userId: string, agencyId: string): Promise<boolean> {
  const admin = createAdminClient()
  const { data: fm } = await admin.from('family_members').select('role, agency_id').eq('supabase_auth_id', userId).maybeSingle()
  return !!(fm && fm.role === 'agency_admin' && fm.agency_id === agencyId)
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const memberId = req.nextUrl.searchParams.get('memberId')
  const agencyId = req.nextUrl.searchParams.get('agencyId')
  if (!memberId || !agencyId) return NextResponse.json({ error: 'memberId and agencyId required' }, { status: 400 })

  const { data, error } = await getCarePlansForMember(memberId, agencyId)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { member_id, agency_id } = body as { member_id: string; agency_id: string }
  if (!member_id || !agency_id) return NextResponse.json({ error: 'member_id and agency_id required' }, { status: 400 })

  const allowed = await verifyAgencyAccess(user.id, agency_id)
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Handle approve action
  if (body.action === 'approve' && body.plan_id) {
    const { data, error } = await approveCarePlanVersion(
      body.plan_id as string,
      (body.approver_name as string) || 'Agency Admin'
    )
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ data })
  }

  // Create new version
  const { data, error } = await createCarePlanVersion({
    member_id,
    agency_id,
    goals: (body.goals as string) ?? '',
    interventions: (body.interventions as string) ?? '',
    visit_frequency: (body.visit_frequency as string) ?? '',
    diagnoses: (body.diagnoses as string[]) ?? [],
    functional_status: (body.functional_status as string | null) ?? null,
    safety_concerns: (body.safety_concerns as string | null) ?? null,
    effective_date: (body.effective_date as string | null) ?? null,
    review_date: (body.review_date as string | null) ?? null,
    notes: (body.notes as string | null) ?? null,
  })

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
