// app/api/home-safety/checks/[id]/items/route.ts
// GET  — load checklist items for a check
// POST — save/update checklist items (upsert by check_id + item_key)

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Default checklist template — room → items
export const SAFETY_CHECKLIST: Record<string, { key: string; label: string }[]> = {
  'Living Areas': [
    { key: 'loose_rugs', label: 'Loose rugs and cords secured' },
    { key: 'night_lighting', label: 'Night lighting from bedroom to bathroom' },
    { key: 'phone_reachable', label: 'Phone reachable from the floor' },
    { key: 'emergency_numbers', label: 'Emergency numbers posted' },
  ],
  'Bathroom': [
    { key: 'grab_bars_toilet', label: 'Grab bars at toilet' },
    { key: 'grab_bars_shower', label: 'Grab bars at shower/tub' },
    { key: 'non_slip_mats', label: 'Non-slip bath mats' },
  ],
  'Stairs & Entrances': [
    { key: 'stair_rails_both', label: 'Stair rails on both sides' },
    { key: 'entry_lighting', label: 'Working lights at entrances and stairs' },
    { key: 'house_number_visible', label: 'House number visible from street' },
  ],
  'Safety Equipment': [
    { key: 'smoke_alarms', label: 'Smoke alarms present, tested, batteries good' },
    { key: 'co_alarms', label: 'CO alarms present and functioning' },
    { key: 'fire_extinguisher', label: 'Fire extinguisher accessible' },
    { key: 'medication_storage', label: 'Medications stored safely' },
  ],
  'Earthquake Preparedness': [
    { key: 'water_heater_strapped', label: 'Water heater strapped to wall' },
    { key: 'tall_furniture_anchored', label: 'Tall furniture/bookcases anchored' },
    { key: 'heavy_items_low', label: 'Heavy items stored low' },
    { key: 'gas_shutoff_known', label: 'Gas shut-off location known, wrench present' },
    { key: 'cabinet_latches', label: 'Cabinet latches installed' },
    { key: 'emergency_water_food', label: 'Emergency water and food supply (72 hrs)' },
    { key: 'flashlight_by_bed', label: 'Flashlight accessible by bed' },
    { key: 'evacuation_route', label: 'Evacuation route and meeting place agreed' },
  ],
  'Storage': [
    { key: 'reachable_storage', label: 'Frequently used items in reachable storage' },
  ],
}

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
