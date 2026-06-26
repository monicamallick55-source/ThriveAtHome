// API route for agency brand configuration — GET (load) and PUT (save).
// Used by the /agency-admin/branding page.
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getBrandConfigForAgency, upsertBrandConfig } from '@/lib/data/brandConfigs'

async function getAgencyIdForUser(authUserId: string): Promise<string | null> {
  const admin = createAdminClient()
  const { data, error } = await (admin
    .from('family_members')
    .select('agency_id, role')
    .eq('supabase_auth_id', authUserId)
    .maybeSingle() as unknown as Promise<{ data: { agency_id: string | null; role: string } | null; error: unknown }>)
  if (error || !data) return null
  if (data.role !== 'agency_admin' && data.role !== 'admin') return null
  return data.agency_id
}

export async function GET(request: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const agencyId = await getAgencyIdForUser(user.id)
  if (!agencyId) return NextResponse.json({ error: 'No agency linked or insufficient permissions' }, { status: 403 })

  const { data, error } = await getBrandConfigForAgency(agencyId)
  if (error && error !== 'Not found') return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ data })
}

export async function PUT(request: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const agencyId = await getAgencyIdForUser(user.id)
  if (!agencyId) return NextResponse.json({ error: 'No agency linked or insufficient permissions' }, { status: 403 })

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Only allow safe fields — powered_by_label is always enforced server-side
  const allowed = ['agency_display_name', 'primary_color', 'secondary_color', 'logo_url', 'logo_storage_path', 'tagline']
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  const { data, error } = await upsertBrandConfig(agencyId, updates)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ data })
}
