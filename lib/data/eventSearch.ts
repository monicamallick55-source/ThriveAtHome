// FEATURE-002/003 — location-aware live event search: one Google Custom Search
// covering Meetup/Eventbrite/Rec & Parks/city sites, filtered for senior
// relevance by Claude, cached 24h per zip+query to stay within the Google
// Custom Search free tier (100 searches/day).
import Anthropic from '@anthropic-ai/sdk'
import { requireServerEnv } from '../env'
import { createAdminClient } from '../supabase/admin'

export type LiveEventCategory = 'cultural' | 'festival'

export interface LiveEventResult {
  title: string
  date: string
  location: string
  description: string
  url: string
  score: number
  category: string
}

const CACHE_HOURS = 24

let anthropicClient: Anthropic | null = null
function getAnthropicClient(): Anthropic {
  if (!anthropicClient) anthropicClient = new Anthropic({ apiKey: requireServerEnv('ANTHROPIC_API_KEY') })
  return anthropicClient
}

function buildQuery(category: LiveEventCategory, zip: string, radius: number): string {
  const monthYear = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const within = `within ${radius} miles of`
  if (category === 'festival') return `cultural festival celebration ${within} ${zip} ${monthYear}`
  return `senior cultural classes workshops ${within} ${zip} ${monthYear}`
}

// event_search_cache and live_event_rsvps (migrations 081/082) predate the
// generated Supabase types, so table access is cast the same way as other
// not-yet-regenerated tables in this codebase (e.g. lib/data/buddies.ts).
async function readCache(query: string, zip: string): Promise<LiveEventResult[] | null> {
  try {
    const admin = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin.from as any)('event_search_cache')
      .select('results, expires_at')
      .eq('zip_code', zip)
      .eq('query', query)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) {
      console.error('[data/eventSearch/readCache]', error)
      return null
    }
    if (!data) return null
    return (data as { results: LiveEventResult[] }).results
  } catch (e) {
    console.error('[data/eventSearch/readCache] Unexpected error:', e)
    return null
  }
}

async function writeCache(query: string, zip: string, results: LiveEventResult[]): Promise<void> {
  try {
    const admin = createAdminClient()
    const expiresAt = new Date(Date.now() + CACHE_HOURS * 60 * 60 * 1000).toISOString()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin.from as any)('event_search_cache').insert({
      query, zip_code: zip, results, expires_at: expiresAt,
    })
    if (error) console.error('[data/eventSearch/writeCache]', error)
  } catch (e) {
    console.error('[data/eventSearch/writeCache] Unexpected error:', e)
  }
}

interface GoogleSearchItem {
  title?: string
  link?: string
  snippet?: string
}

async function runSearchApiEvents(query: string): Promise<GoogleSearchItem[]> {
  const apiKey = requireServerEnv('SEARCHAPI_API_KEY')
  
  const url = new URL('https://www.searchapi.io/api/v1/search')
  url.searchParams.set('engine', 'google_events')
  url.searchParams.set('api_key', apiKey)
  url.searchParams.set('q', query)
  url.searchParams.set('hl', 'en')
  url.searchParams.set('gl', 'us')
  
  const res = await fetch(url.toString())
  if (!res.ok) {
    const error = await res.text()
    throw new Error(`SearchApi failed: ${res.status} ${error}`)
  }
  
  const data = await res.json()
  
  return (data.events_results ?? []).map((e: {
    title: string
    link?: string
    description?: string
    date?: { start_date?: string; when?: string }
    address?: string[]
    venue?: { name?: string }
  }) => ({
    title: e.title,
    link: e.link ?? '',
    snippet: [
      e.date?.when ?? e.date?.start_date ?? '',
      e.venue?.name ?? '',
      (e.address ?? []).join(', '),
      e.description ?? ''
    ].filter(Boolean).join(' | '),
  }))
}


async function scoreForSeniorRelevance(
  items: GoogleSearchItem[],
  category: LiveEventCategory
): Promise<LiveEventResult[]> {
  if (items.length === 0) return []
  const listing = items
    .map((it, i) => `${i + 1}. ${it.title ?? 'Untitled'}\n${it.snippet ?? ''}\n${it.link ?? ''}`)
    .join('\n\n')

  const response = await getAnthropicClient().messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 1500,
    system:
      'Score each of these search results 1-10 for relevance to a senior aged 65-85 looking for ' +
      `${category === 'festival' ? 'a cultural festival or celebration' : 'a cultural class, workshop, or community event'} ` +
      'to attend in person. Return only the ones scoring 7 or higher. ' +
      'Respond with ONLY a JSON array (no other text) where each item has exactly these fields: ' +
      'title (string), date (string, best guess from the text or "Check listing" if unknown), ' +
      'location (string, best guess or "Check listing" if unknown), description (string, max 2 sentences), ' +
      'url (string), score (number 1-10), category (one of: cultural, fitness, social, educational, festival).',
    messages: [{ role: 'user', content: listing }],
  })
  const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text')
  if (!textBlock) return []
  const match = textBlock.text.match(/\[[\s\S]*\]/)
  if (!match) return []
  let parsed: unknown
  try {
    parsed = JSON.parse(match[0])
  } catch (e) {
    console.error('[data/eventSearch/scoreForSeniorRelevance] JSON parse failed:', e)
    return []
  }
  if (!Array.isArray(parsed)) return []
  return parsed.filter((r): r is LiveEventResult =>
    typeof r === 'object' && r !== null &&
    typeof (r as LiveEventResult).title === 'string' &&
    typeof (r as LiveEventResult).url === 'string' &&
    typeof (r as LiveEventResult).score === 'number'
  )
}

/**
 * Searches for senior-relevant local events near a zip code, using a cached
 * result if one exists from the last 24 hours. Never throws — callers get
 * {data: null, error} on failure so the UI can show a readable message.
 */
export async function searchLiveEvents(
  category: LiveEventCategory,
  zip: string,
  radius: number
): Promise<{ data: LiveEventResult[] | null; error: string | null; cached: boolean }> {
  const query = buildQuery(category, zip, radius)

  const cached = await readCache(query, zip)
  if (cached) return { data: cached, error: null, cached: true }

  try {
    const items = await runSearchApiEvents(query)
    const events = await scoreForSeniorRelevance(items, category)
    await writeCache(query, zip, events)
    return { data: events, error: null, cached: false }
  } catch (e) {
    console.error('[data/eventSearch/searchLiveEvents] Failed:', e)
    return { data: null, error: e instanceof Error ? e.message : String(e), cached: false }
  }
}

/** Records that a member is going to a live-searched event, keyed by its URL. Idempotent. */
export async function joinLiveEvent(
  memberId: string,
  eventUrl: string,
  eventTitle: string,
  eventDate: string
): Promise<{ error: string | null }> {
  try {
    const admin = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin.from as any)('live_event_rsvps')
      .upsert(
        { member_id: memberId, event_url: eventUrl, event_title: eventTitle, event_date: eventDate },
        { onConflict: 'member_id,event_url', ignoreDuplicates: true }
      )
    if (error) {
      console.error('[data/eventSearch/joinLiveEvent]', error)
      return { error: error.message }
    }
    return { error: null }
  } catch (e) {
    console.error('[data/eventSearch/joinLiveEvent] Unexpected error:', e)
    return { error: e instanceof Error ? e.message : String(e) }
  }
}

/** Removes a member's "I'm going" for a live-searched event. */
export async function leaveLiveEvent(memberId: string, eventUrl: string): Promise<{ error: string | null }> {
  try {
    const admin = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin.from as any)('live_event_rsvps')
      .delete()
      .eq('member_id', memberId)
      .eq('event_url', eventUrl)
    if (error) {
      console.error('[data/eventSearch/leaveLiveEvent]', error)
      return { error: error.message }
    }
    return { error: null }
  } catch (e) {
    console.error('[data/eventSearch/leaveLiveEvent] Unexpected error:', e)
    return { error: e instanceof Error ? e.message : String(e) }
  }
}

/** Returns the total attendee count and whether the given member is going, for a set of event URLs. */
export async function getLiveEventAttendance(
  eventUrls: string[],
  memberId: string | null
): Promise<{ data: Record<string, { count: number; going: boolean }>; error: string | null }> {
  if (eventUrls.length === 0) return { data: {}, error: null }
  try {
    const admin = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin.from as any)('live_event_rsvps')
      .select('event_url, member_id')
      .in('event_url', eventUrls)
    if (error) {
      console.error('[data/eventSearch/getLiveEventAttendance]', error)
      return { data: {}, error: error.message }
    }
    const rows = (data ?? []) as Array<{ event_url: string; member_id: string }>
    const result: Record<string, { count: number; going: boolean }> = {}
    for (const url of eventUrls) result[url] = { count: 0, going: false }
    for (const row of rows) {
      const entry = result[row.event_url] ?? { count: 0, going: false }
      entry.count += 1
      if (memberId && row.member_id === memberId) entry.going = true
      result[row.event_url] = entry
    }
    return { data: result, error: null }
  } catch (e) {
    console.error('[data/eventSearch/getLiveEventAttendance] Unexpected error:', e)
    return { data: {}, error: e instanceof Error ? e.message : String(e) }
  }
}
