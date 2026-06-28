// Admin API — referral_partners CRUD. Admin role required.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  const admin = createAdminClient()
  const { data: fm } = await admin
    .from('family_members')
    .select('role')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()
  if (fm?.role !== 'admin') return null
  return admin
}

export async function GET() {
  const admin = await assertAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await (admin as any)
    .from('referral_partners')
    .select('id, org_name, contact, partner_type, notes, is_active, created_at')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ partners: data ?? [] })
}

export async function POST(req: NextRequest) {
  const admin = await assertAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { org_name?: string; contact?: string; partner_type?: string; notes?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }) }

  const { org_name, contact, partner_type, notes } = body
  if (!org_name?.trim()) return NextResponse.json({ error: 'org_name is required' }, { status: 400 })

  const { data, error } = await (admin as any)
    .from('referral_partners')
    .insert({
      org_name: org_name.trim(),
      contact: contact?.trim() || null,
      partner_type: partner_type?.trim() || 'hospice',
      notes: notes?.trim() || null,
    })
    .select('id, org_name, contact, partner_type, notes, is_active, created_at')
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ partner: data }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const admin = await assertAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { id?: string; is_active?: boolean }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }) }

  if (!body.id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const { error } = await (admin as any)
    .from('referral_partners')
    .update({ is_active: body.is_active })
    .eq('id', body.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
