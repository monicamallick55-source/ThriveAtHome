// Client-safe types and constants for tracked items.
// No server imports — this file is safe to use in client components.

export type TrackedItemStatus = 'active' | 'snoozed' | 'completed' | 'cancelled'
export type TrackedItemCategory = 'renewal' | 'appointment'

export type ItemType =
  | 'prescription'
  | 'home_insurance'
  | 'car_insurance'
  | 'health_insurance'
  | 'drivers_license'
  | 'car_registration'
  | 'aaa_membership'
  | 'passport'
  | 'gym_membership'
  | 'appointment'
  | 'other'

export interface TrackedItem {
  id: string
  created_at: string
  member_id: string
  item_type: ItemType
  category: TrackedItemCategory
  item_name: string
  expiration_or_appointment_date: string
  reminder_lead_days: number
  recurrence_cycle_days: number | null
  is_recurring: boolean
  renewal_contact_info: string | null
  attachments: string[]
  status: TrackedItemStatus
  last_reminded_at: string | null
  snoozed_until: string | null
  notes: string | null
  created_by: string | null
}

export const ITEM_TYPE_DEFAULTS: Record<ItemType, {
  reminder_lead_days: number
  recurrence_cycle_days: number | null
  is_recurring: boolean
  category: TrackedItemCategory
  emoji: string
  label: string
}> = {
  prescription:     { reminder_lead_days: 5,  recurrence_cycle_days: 28,  is_recurring: true,  category: 'renewal',      emoji: '💊', label: 'Prescription' },
  home_insurance:   { reminder_lead_days: 30, recurrence_cycle_days: 365, is_recurring: true,  category: 'renewal',      emoji: '🏠', label: 'Home Insurance' },
  car_insurance:    { reminder_lead_days: 30, recurrence_cycle_days: 365, is_recurring: true,  category: 'renewal',      emoji: '🚗', label: 'Car Insurance' },
  health_insurance: { reminder_lead_days: 30, recurrence_cycle_days: 365, is_recurring: true,  category: 'renewal',      emoji: '🏥', label: 'Health Insurance' },
  drivers_license:  { reminder_lead_days: 30, recurrence_cycle_days: 365, is_recurring: true,  category: 'renewal',      emoji: '🪪', label: "Driver's License" },
  car_registration: { reminder_lead_days: 30, recurrence_cycle_days: 365, is_recurring: true,  category: 'renewal',      emoji: '📋', label: 'Car Registration' },
  aaa_membership:   { reminder_lead_days: 14, recurrence_cycle_days: 365, is_recurring: true,  category: 'renewal',      emoji: '🛣️', label: 'AAA Membership' },
  passport:         { reminder_lead_days: 90, recurrence_cycle_days: null, is_recurring: false, category: 'renewal',      emoji: '✈️', label: 'Passport' },
  gym_membership:   { reminder_lead_days: 14, recurrence_cycle_days: 365, is_recurring: true,  category: 'renewal',      emoji: '🏋️', label: 'Gym Membership' },
  appointment:      { reminder_lead_days: 1,  recurrence_cycle_days: null, is_recurring: false, category: 'appointment',  emoji: '📅', label: 'Appointment' },
  other:            { reminder_lead_days: 30, recurrence_cycle_days: null, is_recurring: false, category: 'renewal',      emoji: '➕', label: 'Other' },
}
