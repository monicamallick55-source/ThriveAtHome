// Agency workers API — list and create care workers for an agency.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function getCallerAgencyInfo(userId: string): Promise<{ role: string; agency_id: string | null } | null> {
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin.from('family_members').select('role, agency_id').eq('supabase_auth_id', userId).maybeSingle() as any)
  if (!data) return null
  if (data.role !== 'agency_admin' && data.role !== 'admin') return null
  return { role: data.role, agency_id: data.agency_id ?? null }
}

const ALLOWED_ROLES = ['caregiver', 'nurse', 'therapist', 'care_coordinator', 'social_worker', 'other']

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const caller = await getCallerAgencyInfo(user.id)
  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json() as {
    agency_id?: string
    full_name?: string
    email?: string
    phone?: string
    worker_role?: string
    certifications?: string[]
    notes?: string
  }

  if (!body.agency_id || !body.full_name?.trim() || !body.email?.trim()) {
    return NextResponse.json({ error: 'agency_id, full_name, and email are required' }, { status: 400 })
  }
  if (!ALLOWED_ROLES.includes(body.worker_role ?? 'caregiver')) {
    return NextResponse.json({ error: 'Invalid worker_role' }, { status: 400 })
  }
  if (caller.role === 'agency_admin' && caller.agency_id !== body.agency_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await ((admin.from('care_workers') as any)
    .insert({
      agency_id: body.agency_id,
      full_name: body.full_name.trim(),
      email: body.email.trim().toLowerCase(),
      phone: body.phone?.trim() ?? null,
      worker_role: body.worker_role ?? 'caregiver',
      certifications: body.certifications ?? [],
      notes: body.notes?.trim() ?? null,
      is_active: true,
    })
    .select()
    .maybeSingle())

  if (error) {
    console.error('[api/agency/workers]', error)
    return NextResponse.json({ error: error.message ?? 'Failed to create worker' }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}
