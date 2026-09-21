import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Re-export client-safe types and constants
export type { TrackedItemStatus, TrackedItemCategory, ItemType, TrackedItem } from './tracked-items-types'
export { ITEM_TYPE_DEFAULTS } from './tracked-items-types'

import type { TrackedItem, TrackedItemStatus } from './tracked-items-types'
import { ITEM_TYPE_DEFAULTS } from './tracked-items-types'

// Next occurrence (today or later) of the member's birthday, given date_of_birth (YYYY-MM-DD).
function nextBirthdayDate(dateOfBirth: string): string {
  const dob = new Date(dateOfBirth)
  const today = new Date()
  const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
  let next = new Date(Date.UTC(todayUTC.getUTCFullYear(), dob.getUTCMonth(), dob.getUTCDate()))
  if (next < todayUTC) next = new Date(Date.UTC(todayUTC.getUTCFullYear() + 1, dob.getUTCMonth(), dob.getUTCDate()))
  return next.toISOString().slice(0, 10)
}

/**
 * Pre-populates the member's Important Dates with a recurring Birthday entry
 * derived from their profile date of birth, if one doesn't already exist.
 * Called on page load — idempotent, never throws.
 */
export async function ensureBirthdayTrackedItem(
  memberId: string,
  dateOfBirth: string | null | undefined
): Promise<void> {
  if (!dateOfBirth) return
  const admin = createAdminClient()

  const { data: existing, error: findError } = await admin
    .from('tracked_items')
    .select('id, expiration_or_appointment_date')
    .eq('member_id', memberId)
    .eq('item_type', 'birthday')
    .maybeSingle()

  if (findError) { console.error('[tracked-items/ensureBirthdayTrackedItem] lookup failed:', findError); return }

  const nextDate = nextBirthdayDate(dateOfBirth)

  if (!existing) {
    const defaults = ITEM_TYPE_DEFAULTS.birthday
    const { error: insertError } = await admin.from('tracked_items').insert({
      member_id: memberId,
      item_type: 'birthday',
      category: defaults.category,
      subcategory: 'Birthday',
      item_name: 'Birthday',
      expiration_or_appointment_date: nextDate,
      reminder_lead_days: defaults.reminder_lead_days,
      recurrence_cycle_days: defaults.recurrence_cycle_days,
      is_recurring: defaults.is_recurring,
      status: 'active',
      attachments: [],
      created_by: null,
    })
    if (insertError) console.error('[tracked-items/ensureBirthdayTrackedItem] insert failed:', insertError)
    return
  }

  // Roll last year's date forward once it has passed.
  if (existing.expiration_or_appointment_date < nextDate) {
    const { error: updateError } = await admin
      .from('tracked_items')
      .update({ expiration_or_appointment_date: nextDate, status: 'active' })
      .eq('id', existing.id)
    if (updateError) console.error('[tracked-items/ensureBirthdayTrackedItem] roll-forward failed:', updateError)
  }
}

export async function getTrackedItemsForMember(
  memberId: string,
  statusFilter?: TrackedItemStatus[]
): Promise<{ data: TrackedItem[] | null; error: string | null }> {
  const supabase = await createClient()
  let query = supabase
    .from('tracked_items')
    .select('*')
    .eq('member_id', memberId)
    .order('expiration_or_appointment_date', { ascending: true })

  if (statusFilter && statusFilter.length > 0) {
    query = query.in('status', statusFilter)
  }

  const { data, error } = await query
  if (error) return { data: null, error: error.message }
  return { data: data as TrackedItem[], error: null }
}

export async function getUpcomingTrackedItems(
  memberId: string
): Promise<{ data: TrackedItem[] | null; error: string | null }> {
  return getTrackedItemsForMember(memberId, ['active', 'snoozed'])
}

export async function createTrackedItem(
  memberId: string,
  item: Omit<TrackedItem, 'id' | 'created_at' | 'member_id' | 'last_reminded_at' | 'snoozed_until' | 'attachments'> & { attachments?: string[] }
): Promise<{ data: TrackedItem | null; error: string | null }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tracked_items')
    .insert({
      member_id: memberId,
      ...item,
      attachments: item.attachments ?? [],
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as TrackedItem, error: null }
}

export async function updateTrackedItem(
  id: string,
  updates: Partial<Omit<TrackedItem, 'id' | 'created_at' | 'member_id'>>
): Promise<{ data: TrackedItem | null; error: string | null }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tracked_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as TrackedItem, error: null }
}

export async function deleteTrackedItem(
  id: string
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('tracked_items')
    .delete()
    .eq('id', id)

  return { error: error?.message ?? null }
}

// Admin-only: used by the tracked-item-reminders cron
export async function getItemsDueForReminder(
  today: string
): Promise<{
  data: Array<TrackedItem & { member_id: string }> | null
  error: string | null
}> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('tracked_items')
    .select('*')
    .eq('status', 'active')
    .order('expiration_or_appointment_date', { ascending: true })

  if (error) return { data: null, error: error.message }
  const items = (data as TrackedItem[]).filter(item => {
    const expiryDate = new Date(item.expiration_or_appointment_date)
    const reminderDate = new Date(expiryDate)
    reminderDate.setDate(reminderDate.getDate() - item.reminder_lead_days)
    const todayDate = new Date(today)
    if (todayDate < reminderDate) return false
    if (item.last_reminded_at) {
      const lastReminded = new Date(item.last_reminded_at)
      if (lastReminded.toISOString().slice(0, 10) === today) return false
    }
    if (item.snoozed_until) {
      if (new Date(item.snoozed_until) > todayDate) return false
    }
    return true
  })

  return { data: items, error: null }
}
