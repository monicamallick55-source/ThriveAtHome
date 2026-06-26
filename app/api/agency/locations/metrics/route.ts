// Per-location or aggregate metrics for an agency.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getLocationMetrics } from '@/lib/data/agencies'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const agencyId = req.nextUrl.searchParams.get('agencyId')
  const locationId = req.nextUrl.searchParams.get('locationId') // null = aggregate

  if (!agencyId) return NextResponse.json({ error: 'agencyId required' }, { status: 400 })

  // Verify caller is agency_admin or admin
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: fm } = await (admin.from('family_members').select('role, agency_id').eq('supabase_auth_id', user.id).maybeSingle() as any)
  if (!fm || (fm.role !== 'agency_admin' && fm.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (fm.role === 'agency_admin' && fm.agency_id !== agencyId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await getLocationMetrics(agencyId, locationId)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ data })
}
