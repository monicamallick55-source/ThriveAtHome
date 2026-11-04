/**
 * lib/events/rideBooking.ts — G5.8
 * Creates outbound + return transport bookings when a member RSVPs to an in-person event.
 * Cancelling the RSVP calls cancelEventRide to cancel both bookings.
 */
import { SupabaseClient } from '@supabase/supabase-js'

export async function createEventRide(
  supabase: SupabaseClient,
  memberId: string,
  orgId: string,
  event: { id: string; location: string; starts_at: string; ends_at?: string }
) {
  const { data: member } = await supabase
    .from('members')
    .select('address, city, state, zip')
    .eq('id', memberId)
    .single()

  if (!member?.address) return null

  const memberAddress = `${member.address}, ${member.city ?? ''}, ${member.state ?? ''} ${member.zip ?? ''}`.trim()
  const eventStart = new Date(event.starts_at)
  eventStart.setMinutes(eventStart.getMinutes() - 15)  // arrive 15 min early

  // Outbound booking
  const { data: outbound } = await supabase
    .from('service_bookings')
    .insert({
      member_id: memberId,
      org_id: orgId,
      service_type: 'transportation',
      status: 'pending',
      event_id: event.id,
      booking_details: {
        pickup_address: memberAddress,
        destination_address: event.location,
        pickup_time: eventStart.toISOString(),
        trip_type: 'outbound',
        event_id: event.id,
      },
    })
    .select('id')
    .single()

  if (!outbound) return null

  // Return booking (linked to outbound)
  const returnTime = event.ends_at
    ? new Date(event.ends_at)
    : new Date(eventStart.getTime() + 3 * 60 * 60 * 1000)

  await supabase.from('service_bookings').insert({
    member_id: memberId,
    org_id: orgId,
    service_type: 'transportation',
    status: 'pending',
    event_id: event.id,
    linked_booking_id: outbound.id,
    booking_details: {
      pickup_address: event.location,
      destination_address: memberAddress,
      pickup_time: returnTime.toISOString(),
      trip_type: 'return',
      event_id: event.id,
    },
  }).then(({ error: _e }: { error: unknown }) => void _e)

  return outbound
}

export async function cancelEventRide(supabase: SupabaseClient, eventId: string, memberId: string) {
  await supabase
    .from('service_bookings')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('event_id', eventId)
    .eq('member_id', memberId)
    .in('status', ['pending', 'confirmed'])
}
