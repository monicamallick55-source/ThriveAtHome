// Assign a care worker to a specific agency location.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { assignWorkerToLocation } from '@/lib/data/agencies'

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { worker_id: string; agency_id: string; location_id: string | null }
  if (!body.worker_id || !body.agency_id) {
    return NextResponse.json({ error: 'worker_id and agency_id required' }, { status: 400 })
  }

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: fm } = await (admin.from('family_members').select('role, agency_id').eq('supabase_auth_id', user.id).maybeSingle() as any)
  if (!fm || (fm.role !== 'agency_admin' && fm.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (fm.role === 'agency_admin' && fm.agency_id !== body.agency_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await assignWorkerToLocation(body.worker_id, body.agency_id, body.location_id)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}
