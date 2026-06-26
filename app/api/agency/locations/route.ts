// Agency locations API — list all locations and create new ones.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getLocationsForAgency, createAgencyLocation } from '@/lib/data/agencies'
import type { AgencyLocationInsert } from '@/types/database'

async function getAgencyAdmin(userId: string): Promise<string | null> {
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin.from('family_members').select('agency_id, role').eq('supabase_auth_id', userId).maybeSingle() as any)
  if (!data || (data.role !== 'agency_admin' && data.role !== 'admin')) return null
  return data.agency_id ?? null
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const agencyId = req.nextUrl.searchParams.get('agencyId')
  if (!agencyId) return NextResponse.json({ error: 'agencyId required' }, { status: 400 })

  const callerAgencyId = await getAgencyAdmin(user.id)
  if (!callerAgencyId && callerAgencyId !== agencyId) {
    // Allow admin role regardless of agency_id
    const admin = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: fm } = await (admin.from('family_members').select('role').eq('supabase_auth_id', user.id).maybeSingle() as any)
    if (!fm || fm.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await getLocationsForAgency(agencyId)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as Partial<AgencyLocationInsert>
  if (!body.agency_id || !body.location_name?.trim()) {
    return NextResponse.json({ error: 'agency_id and location_name are required' }, { status: 400 })
  }

  const callerAgencyId = await getAgencyAdmin(user.id)
  if (callerAgencyId !== body.agency_id) {
    const admin = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: fm } = await (admin.from('family_members').select('role').eq('supabase_auth_id', user.id).maybeSingle() as any)
    if (!fm || fm.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await createAgencyLocation({
    agency_id: body.agency_id,
    location_name: body.location_name.trim(),
    address: body.address ?? null,
    city: body.city ?? null,
    state: body.state ?? null,
    zip_code: body.zip_code ?? null,
    phone: body.phone ?? null,
    is_headquarters: body.is_headquarters ?? false,
    is_active: body.is_active ?? true,
    manager_name: body.manager_name ?? null,
    manager_email: body.manager_email ?? null,
    notes: body.notes ?? null,
  })
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
