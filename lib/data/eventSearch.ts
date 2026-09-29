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
    if (error) { console.error('[eventSearch/readCache]', error); return null }
    if (!data) return null
    return (data as { results: LiveEventResult[] }).results
  } catch (e) { return null }
}

async function writeCache(query: string, zip: string, results: LiveEventResult[]): Promise<void> {
  try {
    const admin = createAdminClient()
    const expiresAt = new Date(Date.now() + CACHE_HOURS * 60 * 60 * 1000).toISOString()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin.from as any)('event_search_cache').insert({ query, zip_code: zip, results, expires_at: expiresAt })
  } catch (e) { console.error('[eventSearch/writeCache]', e) }
}

async function searchSeniorEvents(zip: string, category: LiveEventCategory): Promise<LiveEventResult[]> {
  const apiKey = process.env.SEARCHAPI_API_KEY
  if (!apiKey) throw new Error('SEARCHAPI_API_KEY not configured')

  const queries = category === 'festival'
    ? ['cultural festival fair seniors near ' + zip, 'senior cultural events concert near ' + zip]
    : ['senior center classes programs near ' + zip + ' schedule', 'community center adult 55+ activities near ' + zip]

  const allResults: LiveEventResult[] = []

  for (const q of queries) {
    const url = new URL('https://www.searchapi.io/api/v1/search')
    url.searchParams.set('engine', 'google')
    url.searchParams.set('api_key', apiKey)
    url.searchParams.set('q', q)
    url.searchParams.set('gl', 'us')
    url.searchParams.set('hl', 'en')
    url.searchParams.set('num', '10')
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) })
    if (!res.ok) continue
    const data = await res.json()
    const organic = (data.organic_results ?? []) as Array<{ title?: string; link?: string; snippet?: string; date?: string }>
    for (const item of organic) {
      if (!item.link || !item.title) continue
      // Filter out generic aggregator pages, keep actual center/program pages
      const link = item.link.toLowerCase()
      const isGeneric = link.includes('yelp.com') || link.includes('yellowpages') || link.includes('tripadvisor')
      if (isGeneric) continue
      allResults.push({
        title: item.title,
        date: item.date ?? 'See website for dates',
        location: item.link.replace(/^https?:\/\//, '').split('/')[0],
        description: item.snippet ?? '',
        url: item.link,
        score: 8,
        category,
      })
    }
    if (allResults.length >= 8) break
  }

  // Deduplicate by domain
  const seen = new Set<string>()
  return allResults.filter(r => {
    const domain = r.url.replace(/^https?:\/\//, '').split('/')[0]
    if (seen.has(domain)) return false
    seen.add(domain)
    return true
  }).slice(0, 10)
}

export async function searchLiveEvents(
  category: LiveEventCategory,
  zip: string,
  radius: number
): Promise<{ data: LiveEventResult[] | null; error: string | null; cached: boolean }> {
  const cacheKey = 'searchapi:' + category + ':' + zip + ':' + radius
  const cached = await readCache(cacheKey, zip)
  if (cached) return { data: cached, error: null, cached: true }
  try {
    const events = await searchSeniorEvents(zip, category)
    if (events.length > 0) await writeCache(cacheKey, zip, events)
    return { data: events, error: null, cached: false }
  } catch (e) {
    console.error('[eventSearch]', e)
    return { data: null, error: e instanceof Error ? e.message : String(e), cached: false }
  }
}

export async function joinLiveEvent(memberId: string, eventUrl: string, eventTitle: string, eventDate: string): Promise<{ error: string | null }> {
  try {
    const admin = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin.from as any)('live_event_rsvps')
      .upsert({ member_id: memberId, event_url: eventUrl, event_title: eventTitle, event_date: eventDate }, { onConflict: 'member_id,event_url', ignoreDuplicates: true })
    if (error) return { error: error.message }
    return { error: null }
  } catch (e) { return { error: e instanceof Error ? e.message : String(e) } }
}

export async function leaveLiveEvent(memberId: string, eventUrl: string): Promise<{ error: string | null }> {
  try {
    const admin = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin.from as any)('live_event_rsvps').delete().eq('member_id', memberId).eq('event_url', eventUrl)
    if (error) return { error: error.message }
    return { error: null }
  } catch (e) { return { error: e instanceof Error ? e.message : String(e) } }
}

export async function getLiveEventAttendance(eventUrls: string[], memberId: string | null): Promise<{ data: Record<string, { count: number; going: boolean }>; error: string | null }> {
  if (eventUrls.length === 0) return { data: {}, error: null }
  try {
    const admin = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin.from as any)('live_event_rsvps').select('event_url, member_id').in('event_url', eventUrls)
    if (error) return { data: {}, error: error.message }
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
  } catch (e) { return { data: {}, error: e instanceof Error ? e.message : String(e) } }
}
