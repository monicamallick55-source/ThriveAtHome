import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { BookingStatus } from '@/types/database'

export interface ServiceBooking {
  id: string
  created_at: string
  member_id: string
  service_type: string
  provider_name: string | null
  booking_details: Record<string, unknown>
  status: BookingStatus
  requested_for: string | null
  confirmed_at: string | null
  completed_at: string | null
  provider_booking_id: string | null
  cost_estimate: number | null
  notes: string | null
  volunteer_id: string | null
}

export type ServiceType =
  | 'transport'
  | 'home_service'
  | 'meals'
  | 'telehealth'
  | 'legal_financial'
  | 'tech_help'
  | 'companion'
  | 'companionship'

export async function getServiceBookingsForMember(
  memberId: string,
  statusFilter?: BookingStatus[]
): Promise<{ data: ServiceBooking[] | null; error: string | null }> {
  const supabase = await createClient()
  let query = supabase
    .from('service_bookings')
    .select('*')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false })

  if (statusFilter && statusFilter.length > 0) {
    query = query.in('status', statusFilter)
  }

  const { data, error } = await query
  if (error) return { data: null, error: error.message }
  return { data: data as ServiceBooking[], error: null }
}

export async function getUpcomingServiceBookings(
  memberId: string
): Promise<{ data: ServiceBooking[] | null; error: string | null }> {
  return getServiceBookingsForMember(memberId, ['requested', 'confirmed', 'in_progress'])
}

export async function createServiceBooking(
  memberId: string,
  serviceType: ServiceType,
  bookingDetails: Record<string, unknown>,
  requestedFor: string | null = null,
  notes: string | null = null
): Promise<{ data: ServiceBooking | null; error: string | null }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('service_bookings')
    .insert({
      member_id: memberId,
      service_type: serviceType,
      booking_details: bookingDetails as never,
      requested_for: requestedFor,
      notes,
      status: 'requested',
    })
    .select()
    .limit(1)
    .maybeSingle()

  if (error) return { data: null, error: error.message }
  return { data: data as ServiceBooking, error: null }
}

export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus
): Promise<{ error: string | null }> {
  const supabase = createAdminClient()
  const updates: Record<string, unknown> = { status }
  if (status === 'confirmed') updates.confirmed_at = new Date().toISOString()
  if (status === 'completed') updates.completed_at = new Date().toISOString()

  const { error } = await supabase
    .from('service_bookings')
    .update(updates as never)
    .eq('id', bookingId)

  return { error: error?.message ?? null }
}

export async function getAllBookingsForNavigator(): Promise<{ data: (ServiceBooking & { member_name: string; member_phone: string })[] | null; error: string | null }> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('service_bookings')
    .select(`
      *,
      members!inner ( preferred_name, full_name, phone_number )
    `)
    .in('status', ['requested', 'confirmed', 'in_progress'])
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return { data: null, error: error.message }

  type RawRow = ServiceBooking & { members: { preferred_name: string; full_name: string; phone_number: string } }
  const mapped = (data as RawRow[]).map((row) => ({
    ...row,
    member_name: row.members.preferred_name,
    member_phone: row.members.phone_number,
  }))
  return { data: mapped, error: null }
}
