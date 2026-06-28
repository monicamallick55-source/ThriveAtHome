// Phase 85 — Member Ambassador API
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { nominateMemberAsAmbassador, getActiveAmbassadors } from '@/lib/data/m21Volunteers'

async function getNavigatorId(userId: string): Promise<string | null> {
  const admin = createAdminClient()
  const { data } = await admin.from('care_navigators').select('id').eq('supabase_auth_id', userId).maybeSingle()
  return data?.id ?? null
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await getActiveAmbassadors()
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify admin or navigator role
  const admin = createAdminClient()
  const { data: fm } = await admin.from('family_members').select('role').eq('supabase_auth_id', user.id).maybeSingle()
  if (!fm || !['admin', 'navigator'].includes(fm.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: { memberId?: string; specialties?: string[]; notes?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  if (!body.memberId) return NextResponse.json({ error: 'memberId required' }, { status: 400 })

  const navigatorId = await getNavigatorId(user.id)
  const { data, error } = await nominateMemberAsAmbassador(
    body.memberId,
    navigatorId ?? user.id,
    body.specialties ?? [],
    body.notes
  )
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ data })
}
