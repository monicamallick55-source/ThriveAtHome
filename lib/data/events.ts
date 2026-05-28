import { createAdminClient } from '@/lib/supabase/admin'
import type { Database, EventFormat, EventStatus } from '@/types/database'

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
      if (rsvps) rsvpedEventIds = new Set(rsvps.map(r => r.event_id))
    }

    const result: EventWithRsvp[] = events.map(evt => ({
      ...evt,
      user_has_rsvped: rsvpedEventIds.has(evt.id),
    }))

    return { data: result, error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

export async function rsvpToEvent(eventId: string, memberId: string): Promise<{ error: string | null }> {
  try {
    const admin = createAdminClient()

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
