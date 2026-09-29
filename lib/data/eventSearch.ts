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

function buildQuery(category: LiveEventCategory, zip: string, _radius: number): string {
  if (category === 'festival') return `cultural festival seniors near ${zip} site:eventbrite.com OR site:meetup.com`
  return `senior adults 55+ cultural arts classes community near ${zip} site:eventbrite.com OR site:meetup.com`
}

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
    if (error) { console.error('[data/eventSearch/readCache]', error); return null }
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
  url.searchParams.set('engine', 'google')
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
  return (data.organic_results ?? []).map((e: { title?: string; link?: string; snippet?: string }) => ({
    title: e.title ?? '',
    link: e.link ?? '',
    snippet: e.snippet ?? '',
  }))
}

async function scoreForSeniorRelevance(
  items: GoogleSearchItem[],
  _category: LiveEventCategory
): Promise<LiveEventResult[]> {
  return items.slice(0, 10).map(it => ({
    title: it.title ?? 'Untitled',
    date: 'Check listing',
    location: 'Check listing',
    description: it.snippet ?? '',
    url: it.link ?? '',
    score: 8,
    category: 'cultural',
  }))
}

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
    if (error) { console.error('[data/eventSearch/joinLiveEvent]', error); return { error: error.message } }
    return { error: null }
  } catch (e) {
    console.error('[data/eventSearch/joinLiveEvent] Unexpected error:', e)
    return { error: e instanceof Error ? e.message : String(e) }
  }
}

export async function leaveLiveEvent(memberId: string, eventUrl: string): Promise<{ error: string | null }> {
  try {
    const admin = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin.from as any)('live_event_rsvps')
      .delete()
      .eq('member_id', memberId)
      .eq('event_url', eventUrl)
    if (error) { console.error('[data/eventSearch/leaveLiveEvent]', error); return { error: error.message } }
    return { error: null }
  } catch (e) {
    console.error('[data/eventSearch/leaveLiveEvent] Unexpected error:', e)
    return { error: e instanceof Error ? e.message : String(e) }
  }
}

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
    if (error) { console.error('[data/eventSearch/getLiveEventAttendance]', error); return { data: {}, error: error.message } }
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
