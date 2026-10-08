// app/api/admin/community-partners/[id]/route.ts
// GET    — fetch one partner (staff or active)
// PATCH  — update partner fields (staff only)
// DELETE — soft-delete (set status=inactive) (staff only)
//
// NOTE: Uses `as any` on community_partners + partner_referrals queries because
// migration 096 has not yet been applied to this environment; once applied and
// types regenerated (`npx supabase gen types`) these casts can be removed.

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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from('community_partners')
    .select('*, partner_referrals(id, member_id, status, reason, created_at)')
    .eq('id', id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data)  return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

// ── PATCH ─────────────────────────────────────────────────────────────────────

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const staff = await resolveStaffContext(supabase)
  if (!staff) return NextResponse.json({ error: 'Staff only' }, { status: 403 })

  const body = await req.json().catch(() => ({}))

  const allowed = [
    'name','category','description','website_url','phone','email',
    'address','city','state','zip','contact_name','status','notes',
  ]
  const update: Record<string, string | null> = {}
  for (const key of allowed) {
    if (key in body) {
      update[key] = typeof body[key] === 'string' ? body[key].trim() || null : body[key]
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from('community_partners')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// ── DELETE (soft) ─────────────────────────────────────────────────────────────

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const staff = await resolveStaffContext(supabase)
  if (!staff) return NextResponse.json({ error: 'Staff only' }, { status: 403 })

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from('community_partners')
    .update({ status: 'inactive' })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
