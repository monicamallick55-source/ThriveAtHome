// POST /api/org-admin/programs — create a new org program.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createOrgProgram } from '@/lib/data/communityOrgs'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: fm } = await admin.from('family_members').select('role, org_id').eq('supabase_auth_id', user.id).maybeSingle()
  if (!fm || (fm.role !== 'org_admin' && fm.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!fm.org_id) return NextResponse.json({ error: 'No org linked to your account' }, { status: 400 })

  const body = await req.json().catch(() => null)
  if (!body?.program_name?.trim()) return NextResponse.json({ error: 'program_name is required' }, { status: 400 })

  const VALID_TYPES = ['social', 'transport', 'meals', 'technology', 'health', 'education', 'advocacy', 'home_maintenance', 'general']
  if (!VALID_TYPES.includes(body.program_type)) return NextResponse.json({ error: 'Invalid program_type' }, { status: 400 })

  const { data, error } = await createOrgProgram(fm.org_id as string, {
    program_name: body.program_name.trim(),
    description: body.description?.trim() || undefined,
    program_type: body.program_type,
    volunteers_needed: typeof body.volunteers_needed === 'number' ? body.volunteers_needed : 0,
    schedule_description: body.schedule_description?.trim() || undefined,
    contact_name: body.contact_name?.trim() || undefined,
    contact_phone: body.contact_phone?.trim() || undefined,
  })

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
