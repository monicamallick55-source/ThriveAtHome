import { createClient } from '@/lib/supabase/server'

export interface CulturalCircle {
  id: string
  circle_name: string
  primary_language: string
  description: string
  member_count: number
  is_active: boolean
  image_placeholder: string | null
  interest_tag: string | null
  community_type: string
}

export interface CirclePost {
  id: string
  created_at: string
  circle_id: string
  member_id: string
  content: string
  post_type: string
  member_name?: string
}

export interface CircleEvent {
  id: string
  circle_id: string | null
  circle_ids: string[]
  title: string
  description: string | null
  event_date: string
  event_time: string | null
  format: string
  dial_in_number: string | null
  dial_in_code: string | null
  video_link: string | null
  location_address: string | null
  rsvp_count: number
  is_recurring: boolean
  is_platform_wide: boolean
  user_has_rsvped?: boolean
}

export async function getAllCircles(): Promise<CulturalCircle[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cultural_circles')
    .select('*')
    .eq('is_active', true)
    .order('circle_name')
  if (error) {
    console.error('[circles] getAllCircles error:', error.message)
    return []
  }
  return data ?? []
}

export async function getCircleById(circleId: string): Promise<CulturalCircle | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cultural_circles')
    .select('*')
    .eq('id', circleId)
    .maybeSingle()
  if (error) {
    console.error('[circles] getCircleById error:', error.message)
    return null
  }
  return data
}

export async function getMemberCircleIds(memberId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('circle_memberships')
    .select('circle_id')
    .eq('member_id', memberId)
  if (error) {
    console.error('[circles] getMemberCircleIds error:', error.message)
    return []
  }
  return (data ?? []).map(r => r.circle_id)
}

export async function joinCircle(memberId: string, circleId: string): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('circle_memberships')
    .insert({ member_id: memberId, circle_id: circleId })
  if (error) {
    console.error('[circles] joinCircle error:', error.message)
    return false
  }
  // Increment member_count
  const { data: circle } = await supabase
    .from('cultural_circles')
    .select('member_count')
    .eq('id', circleId)
    .maybeSingle()
  if (circle) {
    await supabase
      .from('cultural_circles')
      .update({ member_count: (circle.member_count ?? 0) + 1 })
      .eq('id', circleId)
  }
  return true
}

export async function leaveCircle(memberId: string, circleId: string): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('circle_memberships')
    .delete()
    .eq('member_id', memberId)
    .eq('circle_id', circleId)
  if (error) {
    console.error('[circles] leaveCircle error:', error.message)
    return false
  }
  // Decrement member_count
  const { data: circle } = await supabase
    .from('cultural_circles')
    .select('member_count')
    .eq('id', circleId)
    .maybeSingle()
  if (circle && circle.member_count > 0) {
    await supabase
      .from('cultural_circles')
      .update({ member_count: circle.member_count - 1 })
      .eq('id', circleId)
  }
  return true
}

export async function getCirclePosts(circleId: string): Promise<CirclePost[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('circle_posts')
    .select('*, members(preferred_name, full_name)')
    .eq('circle_id', circleId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) {
    console.error('[circles] getCirclePosts error:', error.message)
    return []
  }
  return (data ?? []).map((p: Record<string, unknown>) => ({
    id: p.id as string,
    created_at: p.created_at as string,
    circle_id: p.circle_id as string,
    member_id: p.member_id as string,
    content: p.content as string,
    post_type: p.post_type as string,
    member_name: ((p.members as Record<string, string> | null)?.preferred_name
      ?? (p.members as Record<string, string> | null)?.full_name?.split(' ')[0]
      ?? 'Community member'),
  }))
}

export async function postToCircle(memberId: string, circleId: string, content: string): Promise<CirclePost | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('circle_posts')
    .insert({ member_id: memberId, circle_id: circleId, content, post_type: 'update' })
    .select()
    .maybeSingle()
  if (error) {
    console.error('[circles] postToCircle error:', error.message)
    return null
  }
  return data
}

export async function getCircleEvents(circleId: string, memberId?: string): Promise<CircleEvent[]> {
  const supabase = await createClient()
  // Fetch events where this circle is the primary circle OR in the multi-circle array
  const { data: events, error } = await supabase
    .from('circle_events')
    .select('*')
    .or(`circle_id.eq.${circleId},circle_ids.cs.{${circleId}}`)
    .gte('event_date', new Date().toISOString().slice(0, 10))
    .order('event_date')
  if (error) {
    console.error('[circles] getCircleEvents error:', error.message)
    return []
  }

  let rsvpedIds = new Set<string>()
  if (memberId && events && events.length > 0) {
    const eventIds = events.map(e => e.id)
    const { data: rsvps } = await supabase
      .from('circle_event_rsvps')
      .select('event_id')
      .eq('member_id', memberId)
      .in('event_id', eventIds)
    rsvpedIds = new Set((rsvps ?? []).map(r => r.event_id))
  }

  return (events ?? []).map(e => ({
    ...e,
    circle_ids: e.circle_ids ?? [],
    user_has_rsvped: rsvpedIds.has(e.id),
  }))
}

export async function rsvpToCircleEvent(memberId: string, eventId: string): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('circle_event_rsvps')
    .insert({ member_id: memberId, event_id: eventId })
  if (error) {
    console.error('[circles] rsvpToCircleEvent error:', error.message)
    return false
  }
  const { data: ev } = await supabase
    .from('circle_events')
    .select('rsvp_count')
    .eq('id', eventId)
    .maybeSingle()
  if (ev) {
    await supabase
      .from('circle_events')
      .update({ rsvp_count: (ev.rsvp_count ?? 0) + 1 })
      .eq('id', eventId)
  }
  return true
}

export async function cancelRsvpToCircleEvent(memberId: string, eventId: string): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('circle_event_rsvps')
    .delete()
    .eq('member_id', memberId)
    .eq('event_id', eventId)
  if (error) {
    console.error('[circles] cancelRsvpToCircleEvent error:', error.message)
    return false
  }
  const { data: ev } = await supabase
    .from('circle_events')
    .select('rsvp_count')
    .eq('id', eventId)
    .maybeSingle()
  if (ev && ev.rsvp_count > 0) {
    await supabase
      .from('circle_events')
      .update({ rsvp_count: ev.rsvp_count - 1 })
      .eq('id', eventId)
  }
  return true
}

export async function getPlatformWideEvents(memberId?: string): Promise<CircleEvent[]> {
  const supabase = await createClient()
  const { data: events, error } = await supabase
    .from('circle_events')
    .select('*')
    .eq('is_platform_wide', true)
    .gte('event_date', new Date().toISOString().slice(0, 10))
    .order('event_date')
  if (error) {
    console.error('[circles] getPlatformWideEvents error:', error.message)
    return []
  }

  let rsvpedIds = new Set<string>()
  if (memberId && events && events.length > 0) {
    const eventIds = events.map(e => e.id)
    const { data: rsvps } = await supabase
      .from('circle_event_rsvps')
      .select('event_id')
      .eq('member_id', memberId)
      .in('event_id', eventIds)
    rsvpedIds = new Set((rsvps ?? []).map(r => r.event_id))
  }

  return (events ?? []).map(e => ({
    ...e,
    circle_ids: e.circle_ids ?? [],
    location_address: e.location_address ?? null,
    is_platform_wide: e.is_platform_wide ?? true,
    user_has_rsvped: rsvpedIds.has(e.id),
  }))
}

export async function createCircleEvent(event: {
  circle_id?: string | null
  circle_ids?: string[]
  title: string
  description?: string
  event_date: string
  event_time?: string
  format?: string
  dial_in_number?: string
  dial_in_code?: string
  video_link?: string
  location_address?: string
  is_platform_wide?: boolean
  is_recurring?: boolean
}): Promise<CircleEvent | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('circle_events')
    .insert({
      ...event,
      circle_ids: event.circle_ids ?? [],
    })
    .select()
    .maybeSingle()
  if (error) {
    console.error('[circles] createCircleEvent error:', error.message)
    return null
  }
  return data ? { ...data, circle_ids: data.circle_ids ?? [] } : null
}

export async function createCommunityCircle(circle: {
  circle_name: string
  description: string
  primary_language: string
  interest_tag?: string | null
  community_type?: string
}): Promise<CulturalCircle | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cultural_circles')
    .insert({
      circle_name: circle.circle_name,
      description: circle.description,
      primary_language: circle.primary_language,
      interest_tag: circle.interest_tag ?? null,
      community_type: circle.community_type ?? 'cultural',
      is_active: true,
      member_count: 0,
    })
    .select()
    .maybeSingle()
  if (error) {
    console.error('[circles] createCommunityCircle error:', error.message)
    return null
  }
  return data
}
