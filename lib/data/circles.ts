// lib/data/circles.ts
// Data layer for cultural circles, posts, comments, events, and interest groups.
// circle_members is not in Supabase TS types yet — uses (supabase as any) casts.
// circle_event_rsvps — same.

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CulturalCircle {
  id: string
  created_at: string
  circle_name: string
  description: string | null
  community_type: string | null
  primary_language: string | null
  image_placeholder: string | null
  interest_tag: string | null
  membership_visibility: string | null
  member_count: number
  is_active: boolean
}

export interface CircleEvent {
  id: string
  created_at: string
  circle_id: string | null
  circle_ids: string[] | null
  title: string
  description: string | null
  event_date: string
  event_time: string | null
  format: string | null
  is_platform_wide: boolean | null
  is_recurring: boolean | null
  location_address: string | null
  rsvp_count: number
  video_link: string | null
  dial_in_code: string | null
  dial_in_number: string | null
  user_has_rsvped?: boolean
}

export interface CirclePost {
  id: string
  created_at: string
  circle_id: string
  member_id: string
  content: string
  comment_count: number
  is_hidden: boolean
  members: { preferred_name: string | null; full_name: string | null } | null
}

export interface CirclePostComment {
  id: string
  created_at: string
  post_id: string
  member_id: string
  content: string
  is_hidden: boolean
  members: {
    preferred_name: string | null
    full_name: string | null
  } | null
}

// ── Circles ───────────────────────────────────────────────────────────────────

/** Fetch all active circles, ordered by member_count descending. Returns array directly. */
export async function getAllCircles(): Promise<CulturalCircle[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('cultural_circles')
      .select('*')
      .eq('is_active', true)
      .order('member_count', { ascending: false })

    if (error) {
      console.error('[circles/getAllCircles]', error)
      return []
    }
    return (data as unknown as CulturalCircle[]) ?? []
  } catch (e) {
    console.error('[circles/getAllCircles] unexpected:', e)
    return []
  }
}

/** Fetch a single circle by ID. */
export async function getCircleById(circleId: string): Promise<CulturalCircle | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('cultural_circles')
      .select('*')
      .eq('id', circleId)
      .maybeSingle()

    if (error) {
      console.error('[circles/getCircleById]', error)
      return null
    }
    return data as unknown as CulturalCircle | null
  } catch (e) {
    console.error('[circles/getCircleById] unexpected:', e)
    return null
  }
}

/** Fetch the circle IDs the given member has joined. Returns array directly. */
export async function getMemberCircleIds(memberId: string): Promise<string[]> {
  try {
    const supabase = await createClient()
    // circle_members is not in TS types yet — cast to any
    const { data, error } = await (supabase as any)
      .from('circle_members')
      .select('circle_id')
      .eq('member_id', memberId)

    if (error) {
      console.error('[circles/getMemberCircleIds]', error)
      return []
    }
    return ((data ?? []) as Array<{ circle_id: string }>).map((r) => r.circle_id)
  } catch (e) {
    console.error('[circles/getMemberCircleIds] unexpected:', e)
    return []
  }
}

/** Join a circle. Idempotent. */
export async function joinCircle(
  memberId: string,
  circleId: string,
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient()
    const { error } = await (supabase as any)
      .from('circle_members')
      .upsert({ member_id: memberId, circle_id: circleId }, { onConflict: 'member_id,circle_id' })

    if (error) {
      console.error('[circles/joinCircle]', error)
      return { error: error.message }
    }
    return { error: null }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[circles/joinCircle] unexpected:', msg)
    return { error: msg }
  }
}

/** Leave a circle. */
export async function leaveCircle(
  memberId: string,
  circleId: string,
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient()
    const { error } = await (supabase as any)
      .from('circle_members')
      .delete()
      .eq('member_id', memberId)
      .eq('circle_id', circleId)

    if (error) {
      console.error('[circles/leaveCircle]', error)
      return { error: error.message }
    }
    return { error: null }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[circles/leaveCircle] unexpected:', msg)
    return { error: msg }
  }
}

// ── Posts ─────────────────────────────────────────────────────────────────────

/** Fetch visible posts for a circle, newest-first. Returns array directly. */
export async function getCirclePosts(circleId: string): Promise<CirclePost[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('circle_posts')
      .select('*, members(preferred_name, full_name)')
      .eq('circle_id', circleId)
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[circles/getCirclePosts]', error)
      return []
    }
    return (data as unknown as CirclePost[]) ?? []
  } catch (e) {
    console.error('[circles/getCirclePosts] unexpected:', e)
    return []
  }
}

/** Post a new message to a circle. Returns the created row. */
export async function postToCircle(
  memberId: string,
  circleId: string,
  content: string,
): Promise<{ data: CirclePost | null; error: string | null }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('circle_posts')
      .insert({ member_id: memberId, circle_id: circleId, content })
      .select('*, members(preferred_name, full_name)')
      .maybeSingle()

    if (error) {
      console.error('[circles/postToCircle]', error)
      return { data: null, error: error.message }
    }
    if (!data) return { data: null, error: 'Insert returned no row' }
    return { data: data as unknown as CirclePost, error: null }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[circles/postToCircle] unexpected:', msg)
    return { data: null, error: msg }
  }
}

// ── Events ────────────────────────────────────────────────────────────────────

/** Fetch upcoming events for a circle, soonest-first. Returns array directly.
 *  memberId param accepted but currently unused (reserved for RSVP status join). */
export async function getCircleEvents(
  circleId: string,
  _memberId?: string,
): Promise<CircleEvent[]> {
  try {
    const supabase = await createClient()
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('circle_events')
      .select('*')
      .eq('circle_id', circleId)
      .gte('event_date', now)
      .order('event_date', { ascending: true })

    if (error) {
      console.error('[circles/getCircleEvents]', error)
      return []
    }
    return (data as unknown as CircleEvent[]) ?? []
  } catch (e) {
    console.error('[circles/getCircleEvents] unexpected:', e)
    return []
  }
}

/** Fetch platform-wide upcoming events, soonest-first, limit 20. Returns array directly.
 *  memberId param accepted but currently unused (reserved for RSVP status join). */
export async function getPlatformWideEvents(_memberId?: string): Promise<CircleEvent[]> {
  try {
    const supabase = await createClient()
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('circle_events')
      .select('*')
      .gte('event_date', now)
      .order('event_date', { ascending: true })
      .limit(20)

    if (error) {
      console.error('[circles/getPlatformWideEvents]', error)
      return []
    }
    return (data as unknown as CircleEvent[]) ?? []
  } catch (e) {
    console.error('[circles/getPlatformWideEvents] unexpected:', e)
    return []
  }
}

/** RSVP to a circle event. Idempotent. */
export async function rsvpToCircleEvent(
  memberId: string,
  eventId: string,
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient()
    const { error } = await (supabase as any)
      .from('circle_event_rsvps')
      .upsert({ member_id: memberId, event_id: eventId }, { onConflict: 'member_id,event_id' })

    if (error) {
      console.error('[circles/rsvpToCircleEvent]', error)
      return { error: error.message }
    }
    return { error: null }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[circles/rsvpToCircleEvent] unexpected:', msg)
    return { error: msg }
  }
}

/** Cancel RSVP to a circle event. */
export async function cancelRsvpToCircleEvent(
  memberId: string,
  eventId: string,
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient()
    const { error } = await (supabase as any)
      .from('circle_event_rsvps')
      .delete()
      .eq('member_id', memberId)
      .eq('event_id', eventId)

    if (error) {
      console.error('[circles/cancelRsvpToCircleEvent]', error)
      return { error: error.message }
    }
    return { error: null }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[circles/cancelRsvpToCircleEvent] unexpected:', msg)
    return { error: msg }
  }
}

// ── Interest Groups ───────────────────────────────────────────────────────────

/** Fetch active interest groups (circles filtered by community_type). Returns array directly. */
export async function getInterestGroups(): Promise<CulturalCircle[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('cultural_circles')
      .select('*')
      .eq('is_active', true)
      .eq('community_type', 'interest_group')
      .order('member_count', { ascending: false })

    if (error) {
      console.error('[circles/getInterestGroups]', error)
      return []
    }
    return (data as unknown as CulturalCircle[]) ?? []
  } catch (e) {
    console.error('[circles/getInterestGroups] unexpected:', e)
    return []
  }
}

// ── Admin ─────────────────────────────────────────────────────────────────────

/** Admin: create a new circle. */
export async function createCommunityCircle(
  fields: Omit<CulturalCircle, 'id' | 'created_at' | 'member_count'>,
): Promise<{ data: CulturalCircle | null; error: string | null }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any
    const { data, error } = await admin
      .from('cultural_circles')
      .insert(fields)
      .select()
      .maybeSingle()

    if (error) {
      console.error('[circles/createCommunityCircle]', error)
      return { data: null, error: error.message }
    }
    if (!data) return { data: null, error: 'Insert returned no row' }
    return { data: data as CulturalCircle, error: null }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[circles/createCommunityCircle] unexpected:', msg)
    return { data: null, error: msg }
  }
}

/** Admin: create a circle event. */
export async function createCircleEvent(
  fields: Omit<CircleEvent, 'id' | 'created_at' | 'rsvp_count' | 'user_has_rsvped'>,
): Promise<{ data: CircleEvent | null; error: string | null }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any
    const { data, error } = await admin
      .from('circle_events')
      .insert(fields)
      .select()
      .maybeSingle()

    if (error) {
      console.error('[circles/createCircleEvent]', error)
      return { data: null, error: error.message }
    }
    if (!data) return { data: null, error: 'Insert returned no row' }
    return { data: data as CircleEvent, error: null }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[circles/createCircleEvent] unexpected:', msg)
    return { data: null, error: msg }
  }
}

// ── Comments (G2.1) ───────────────────────────────────────────────────────────

/** Fetch all visible comments for a post, oldest-first. */
export async function getPostComments(
  postId: string,
): Promise<{ data: CirclePostComment[] | null; error: string | null }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('circle_post_comments')
      .select('*, members(preferred_name, full_name)')
      .eq('post_id', postId)
      .eq('is_hidden', false)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[circles/getPostComments]', error)
      return { data: null, error: error.message }
    }
    return { data: (data as unknown as CirclePostComment[]) ?? [], error: null }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[circles/getPostComments] unexpected:', msg)
    return { data: null, error: msg }
  }
}

/** Insert a new comment on a post. Returns the created row. */
export async function addPostComment(
  memberId: string,
  postId: string,
  content: string,
): Promise<{ data: CirclePostComment | null; error: string | null }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('circle_post_comments')
      .insert({ member_id: memberId, post_id: postId, content })
      .select('*, members(preferred_name, full_name)')
      .maybeSingle()

    if (error) {
      console.error('[circles/addPostComment]', error)
      return { data: null, error: error.message }
    }
    if (!data) return { data: null, error: 'Insert returned no row' }
    return { data: data as unknown as CirclePostComment, error: null }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[circles/addPostComment] unexpected:', msg)
    return { data: null, error: msg }
  }
}

/** Hard-delete a comment by ID. RLS enforces ownership at DB level. */
export async function deletePostComment(
  commentId: string,
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('circle_post_comments')
      .delete()
      .eq('id', commentId)

    if (error) {
      console.error('[circles/deletePostComment]', error)
      return { error: error.message }
    }
    return { error: null }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[circles/deletePostComment] unexpected:', msg)
    return { error: msg }
  }
}
