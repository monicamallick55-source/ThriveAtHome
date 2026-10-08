// app/api/home-safety/checks/[id]/items/route.ts
// GET  — load checklist items for a check
// POST — save/update checklist items (upsert by check_id + item_key)

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { SAFETY_CHECKLIST } from '@/lib/home-safety/checklist'

export { SAFETY_CHECKLIST }

async function resolveUser(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: fm } = await supabase
    .from('family_members')
    .select('id, member_id, role')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()
  return fm
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: checkId } = await params
  const supabase = await createClient()
  const fm = await resolveUser(supabase)
  if (!fm) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: items } = await (admin as any)
    .from('home_safety_items')
    .select('*')
    .eq('check_id', checkId)
    .order('room')

  return NextResponse.json({ items: items ?? [], template: SAFETY_CHECKLIST })
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: checkId } = await params
  const supabase = await createClient()
  const fm = await resolveUser(supabase)
  if (!fm) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  // items: Array<{ room, item_key, result, note?, photo_path? }>
  const { items } = body as { items?: Record<string, string>[] }
  if (!Array.isArray(items)) return NextResponse.json({ error: 'items array required' }, { status: 400 })

  const admin = createAdminClient()

  // Mark check in_progress if still scheduled
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from('home_safety_checks')
    .update({ status: 'in_progress' })
    .eq('id', checkId)
    .eq('status', 'scheduled')

  const rows = items.map((item) => ({
    check_id: checkId,
    room: item.room,
    item_key: item.item_key,
    result: item.result ?? 'na',
    note: item.note ?? null,
    photo_path: item.photo_path ?? null,
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from('home_safety_items')
    .upsert(rows, { onConflict: 'check_id,item_key' })
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data })
}
