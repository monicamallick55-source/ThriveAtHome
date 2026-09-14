import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { createTrackedItem, getTrackedItemsForMember, ITEM_TYPE_DEFAULTS } from '@/lib/data/tracked-items'
import type { ItemType } from '@/lib/data/tracked-items'

const ALLOWED_ITEM_TYPES: ItemType[] = [
  'prescription', 'home_insurance', 'car_insurance', 'health_insurance',
  'drivers_license', 'car_registration', 'aaa_membership', 'passport',
  'gym_membership', 'appointment', 'other',
]

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  if (!fm?.member_id) return NextResponse.json({ error: 'No member found' }, { status: 404 })

  const { data, error } = await getTrackedItemsForMember(fm.member_id)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ items: data })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  if (!fm?.member_id) return NextResponse.json({ error: 'No member found' }, { status: 404 })

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { item_type, item_name, expiration_or_appointment_date, reminder_lead_days, recurrence_cycle_days, is_recurring, renewal_contact_info, notes, category, subcategory, preferred_contact_method } = body as Record<string, unknown>

  const CONTACT_METHODS = ['phone', 'sms', 'email']
  if (preferred_contact_method !== undefined && preferred_contact_method !== null && preferred_contact_method !== '' && !CONTACT_METHODS.includes(preferred_contact_method as string)) {
    return NextResponse.json({ error: 'Invalid preferred_contact_method' }, { status: 400 })
  }
  const ALLOWED_CATEGORIES = ['renewal', 'appointment', 'subscription']
  const resolvedCategory = typeof category === 'string' && ALLOWED_CATEGORIES.includes(category) ? category : null

  if (!item_type || !ALLOWED_ITEM_TYPES.includes(item_type as ItemType)) {
    return NextResponse.json({ error: 'Invalid item_type' }, { status: 400 })
  }
  if (!item_name || typeof item_name !== 'string' || !item_name.trim()) {
    return NextResponse.json({ error: 'item_name is required' }, { status: 400 })
  }
  if (!expiration_or_appointment_date || typeof expiration_or_appointment_date !== 'string') {
    return NextResponse.json({ error: 'expiration_or_appointment_date is required' }, { status: 400 })
  }

  const defaults = ITEM_TYPE_DEFAULTS[item_type as ItemType]
  const { data, error } = await createTrackedItem(fm.member_id, {
    item_type: item_type as ItemType,
    category: (resolvedCategory ?? defaults.category) as 'renewal' | 'appointment' | 'subscription',
    subcategory: typeof subcategory === 'string' ? subcategory.trim() || null : null,
    preferred_contact_method: typeof preferred_contact_method === 'string' ? preferred_contact_method.trim() || null : null,
    item_name: (item_name as string).trim(),
    expiration_or_appointment_date: expiration_or_appointment_date as string,
    reminder_lead_days: typeof reminder_lead_days === 'number' ? reminder_lead_days : defaults.reminder_lead_days,
    recurrence_cycle_days: typeof recurrence_cycle_days === 'number' ? recurrence_cycle_days : defaults.recurrence_cycle_days,
    is_recurring: typeof is_recurring === 'boolean' ? is_recurring : defaults.is_recurring,
    renewal_contact_info: typeof renewal_contact_info === 'string' ? renewal_contact_info.trim() || null : null,
    notes: typeof notes === 'string' ? notes.trim() || null : null,
    status: 'active',
    created_by: fm.id,
  })

  if (error) return NextResponse.json({ error }, { status: 500 })
  // Return under both keys — older clients read `data`, newer read `item`.
  return NextResponse.json({ item: data, data }, { status: 201 })
}
