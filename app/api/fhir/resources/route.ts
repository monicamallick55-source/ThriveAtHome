// app/api/fhir/resources/route.ts
// GET — fetch cached FHIR resources for the authenticated member

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any
  const { data: member } = await db.from('members').select('id').eq('supabase_auth_id', user.id).maybeSingle()
  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const resourceType = searchParams.get('type')

  let query = db
    .from('fhir_resources')
    .select('id, resource_type, resource_id, resource_data, recorded_at')
    .eq('member_id', member.id)
    .order('recorded_at', { ascending: false })

  if (resourceType) query = query.eq('resource_type', resourceType)

  const { data: resources, error } = await query.limit(100)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ resources: resources ?? [] })
}
