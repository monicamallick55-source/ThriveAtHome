import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/database'
type EventFormat = any
type EventStatus = any

type EventRow = Database['public']['Tables']['events']['Row']
type EventInsert = Database['public']['Tables']['events']['Insert']

export interface EventWithRsvp extends EventRow {
  user_has_rsvped: boolean
}

export async function getUpcomingEvents(memberId?: string): Promise<{ data: EventWithRsvp[] | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    const today = new Date().toISOString().split('T')[0]

    const { data: events, error } = await admin
      .from('events')
      .select('*')
      .in('status', ['upcoming', 'live'])
      .gte('event_date', today)
      .order('event_date', { ascending: true })
      .order('event_time', { ascending: true })

    if (error) return { data: null, error: error.message }
    if (!events) return { data: [], error: null }

    let rsvpedEventIds = new Set<string>()
    if (memberId) {
      const { data: rsvps } = await admin
        .from('event_rsvps')
        .select('event_id')
        .eq('member_id', memberId)
      if (rsvps) rsvpedEventIds = new Set(rsvps.map((r: any) => r.event_id))
    }

    const result: EventWithRsvp[] = events.map((evt: any) => ({
      ...evt,
      user_has_rsvped: rsvpedEventIds.has(evt.id),
    }))

    return { data: result, error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

export async function rsvpToEvent(
  eventId: string,
  memberId: string
): Promise<{ error: string | null; full?: boolean }> {
  try {
    const admin = createAdminClient()

    // Capacity check — if the event is full, tell the caller so they can offer the waitlist.
    const { data: evtCap } = await admin
      .from('events')
      .select('rsvp_count, max_capacity')
      .eq('id', eventId)
      .maybeSingle()
    if (evtCap?.max_capacity && (evtCap.rsvp_count ?? 0) >= evtCap.max_capacity) {
      // Already RSVPed? then it's fine.
      const { data: mine } = await admin
        .from('event_rsvps')
        .select('id')
        .eq('event_id', eventId)
        .eq('member_id', memberId)
        .maybeSingle()
      if (!mine) return { error: 'This event is full.', full: true }
    }

    const { error: insertError } = await admin
      .from('event_rsvps')
      .insert({ event_id: eventId, member_id: memberId })

    if (insertError) {
      if (insertError.code === '23505') return { error: null } // already rsvped
      return { error: insertError.message }
    }

    // increment rsvp_count
    const { data: evt } = await admin.from('events').select('rsvp_count').eq('id', eventId).maybeSingle()
    if (evt) {
      await admin.from('events').update({ rsvp_count: evt.rsvp_count + 1 }).eq('id', eventId)
    }

    return { error: null }
  } catch (err) {
    return { error: String(err) }
  }
}

/** Add a member to an event's waitlist. */
export async function joinEventWaitlist(
  eventId: string,
  memberId: string
): Promise<{ error: string | null }> {
  try {
    const admin = createAdminClient()
    const { error } = await (admin.from as any)('event_waitlist')
      .upsert({ event_id: eventId, member_id: memberId, status: 'waiting', notified_at: null }, { onConflict: 'event_id,member_id' })
    return { error: error?.message ?? null }
  } catch (err) {
    return { error: String(err) }
  }
}

export async function leaveEventWaitlist(
  eventId: string,
  memberId: string
): Promise<{ error: string | null }> {
  try {
    const admin = createAdminClient()
    const { error } = await (admin.from as any)('event_waitlist')
      .delete().eq('event_id', eventId).eq('member_id', memberId)
    return { error: error?.message ?? null }
  } catch (err) {
    return { error: String(err) }
  }
}

/** After a cancellation frees a seat, offer it to the earliest waitlister. */
async function promoteFromWaitlist(eventId: string): Promise<void> {
  const admin = createAdminClient()
  const { data: evt } = await admin
    .from('events')
    .select('rsvp_count, max_capacity, title')
    .eq('id', eventId)
    .maybeSingle()
  if (!evt?.max_capacity || (evt.rsvp_count ?? 0) >= evt.max_capacity) return

  const { data: next } = await (admin.from as any)('event_waitlist')
    .select('id, member_id')
    .eq('event_id', eventId)
    .eq('status', 'waiting')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (!next) return

  await (admin.from as any)('event_waitlist')
    .update({ status: 'offered', notified_at: new Date().toISOString() })
    .eq('id', next.id)

  try {
    await admin.from('realtime_notifications').insert({
      member_id: next.member_id,
      type: 'celebration_upcoming' as const,
      severity: 'info' as const,
      title: 'A spot opened up',
      body: `A place is now free for "${evt.title ?? 'an event'}" you were waitlisted for. RSVP from the events page to claim it.`,
    })
  } catch { /* best-effort */ }
  console.log(`[Waitlist] Offered freed seat for event ${eventId} to member ${next.member_id}`)
}

export async function cancelEventRsvp(eventId: string, memberId: string): Promise<{ error: string | null }> {
  try {
    const admin = createAdminClient()

    const { error: deleteError } = await admin
      .from('event_rsvps')
      .delete()
      .eq('event_id', eventId)
      .eq('member_id', memberId)

    if (deleteError) return { error: deleteError.message }

    const { data: evt } = await admin.from('events').select('rsvp_count').eq('id', eventId).maybeSingle()
    if (evt && evt.rsvp_count > 0) {
      await admin.from('events').update({ rsvp_count: evt.rsvp_count - 1 }).eq('id', eventId)
    }

    // A seat just freed — offer it to the next person on the waitlist.
    await promoteFromWaitlist(eventId)

    return { error: null }
  } catch (err) {
    return { error: String(err) }
  }
}

export interface CreateEventParams {
  title: string
  description?: string
  event_type?: string
  host_name?: string
  event_date: string
  event_time: string
  timezone?: string
  duration_minutes?: number
  format: EventFormat
  dial_in_number?: string
  dial_in_code?: string
  video_link?: string
  location_address?: string
  max_capacity?: number
  is_recurring?: boolean
  recurrence_pattern?: string
}

export async function createEvent(params: CreateEventParams): Promise<{ data: EventRow | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('events')
      .insert({ ...params, status: 'upcoming' as EventStatus })
      .select()
      .maybeSingle()

    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}
