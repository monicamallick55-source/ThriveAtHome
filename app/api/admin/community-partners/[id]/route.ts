// app/api/admin/community-partners/route.ts
// GET  — list all partners (staff) or active partners (members)
// POST — create a new partner (staff only)
//
// NOTE: Uses `as any` on community_partners queries because migration 096 has
// not yet been applied; once applied and types regenerated these casts can be removed.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function resolveStaffContext(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: fm } = await supabase
    .from('family_members')
    .select('id, role')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  if (!fm || (fm.role !== 'admin' && fm.role !== 'navigator')) return null
  return { familyMemberId: fm.id as string, role: fm.role as string }
}

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  const supabase = await createClient()
  const staff = await resolveStaffContext(supabase)

  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const status   = searchParams.get('status') ?? (staff ? undefined : 'active')

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (admin as any)
    .from('community_partners')
    .select('*')
    .order('name')

  if (status)   query = query.eq('status', status)
  if (category) query = query.eq('category', category)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data ?? [])
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const supabase = await createClient()
  const staff = await resolveStaffContext(supabase)
  if (!staff) return NextResponse.json({ error: 'Staff only' }, { status: 403 })

  const body = await req.json().catch(() => ({}))

  const {
    name, category, description, website_url, phone, email,
    address, city, state, zip, contact_name, status, notes,
  } = body as Record<string, string | undefined>

  if (!name?.trim())     return NextResponse.json({ error: 'name is required' }, { status: 400 })
  if (!category?.trim()) return NextResponse.json({ error: 'category is required' }, { status: 400 })

  const validCategories = ['food','transportation','legal','health','social','home','employment']
  if (!validCategories.includes(category)) {
    return NextResponse.json({ error: `category must be one of: ${validCategories.join(', ')}` }, { status: 400 })
  }

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from('community_partners')
    .insert({
      name: name.trim(),
      category,
      description:  description?.trim()  || null,
      website_url:  website_url?.trim()  || null,
      phone:        phone?.trim()        || null,
      email:        email?.trim()        || null,
      address:      address?.trim()      || null,
      city:         city?.trim()         || null,
      state:        state?.trim()        || null,
      zip:          zip?.trim()          || null,
      contact_name: contact_name?.trim() || null,
      status:       status ?? 'pending_confirmation',
      notes:        notes?.trim()        || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
