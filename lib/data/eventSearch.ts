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

const BAY_AREA_SENIOR_SITES: Record<string, string[]> = {
  '940': [
    'https://www.cityofsanmateo.org/638/Senior-Center',
    'https://www.cityofsancarlos.org/government/departments/recreation/adult-community-center',
    'https://www.fostercity.org/parks-recreation/recreation-programs/senior-programs',
    'https://www.redwoodcity.org/departments/parks-recreation-and-community-services/senior-center',
    'https://www.burlingame.org/departments/parks_recreation/senior_center/index.php',
  ],
  '941': [
    'https://www.sfrecpark.org/senior-services',
  ],
  '945': [
    'https://www.oaklandca.gov/topics/senior-services',
  ],
  '946': [
    'https://www.cityoffremont.org/government/departments/human-services/senior-services',
  ],
}

function getSitesForZip(zip: string): string[] {
  const prefix = zip.slice(0, 3)
  return BAY_AREA_SENIOR_SITES[prefix] ?? BAY_AREA_SENIOR_SITES['940']
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
    if (error) { console.error('[eventSearch/readCache]', error); return null }
    if (!data) return null
    return (data as { results: LiveEventResult[] }).results
  } catch (e) {
    console.error('[eventSearch/readCache]', e); return null
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
    if (error) console.error('[eventSearch/writeCache]', error)
  } catch (e) {
    console.error('[eventSearch/writeCache]', e)
  }
}

interface PageContent {
  url: string
  text: string
}

async function crawlWithApify(urls: string[], apiKey: string): Promise<PageContent[]> {
  const startUrls = urls.map(url => ({ url }))
  const res = await fetch(
    'https://api.apify.com/v2/acts/apify~website-content-crawler/run-sync-get-dataset-items?token=' + apiKey + '&memory=512',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startUrls, maxCrawlPages: 1, crawlerType: 'cheerio' }),
      signal: AbortSignal.timeout(50000),
    }
  )
  if (!res.ok) throw new Error('Apify crawl failed: ' + res.status)
  const data = await res.json()
  return (Array.isArray(data) ? data : []).map((item: { url?: string; text?: string }) => ({
    url: item.url ?? '',
    text: item.text ?? '',
  }))
}

function extractEvents(pages: PageContent[], category: LiveEventCategory): LiveEventResult[] {
  const results: LiveEventResult[] = []
  const seniorKw = ['senior', 'yoga', 'art', 'music', 'dance', 'craft', 'class', 'workshop', 'program', 'activity', 'club', 'social', 'lecture', 'volunteer', 'garden', 'bingo', 'lunch', 'nutrition', 'health', 'wellness', 'exercise', 'swim', 'movie', 'game', 'billiard', 'mahjong', 'bridge', 'pilates', 'zumba', 'pottery', 'painting', 'knitting', 'book', 'computer', 'excursion', 'fitness', 'tai chi']
  const festivalKw = ['festival', 'fair', 'cultural', 'heritage', 'celebration', 'parade', 'concert', 'performance', 'exhibit']
  const dateRe = /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* \d{1,2}(?:,? \d{4})?|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?/i
  const activeKw = category === 'festival' ? festivalKw : seniorKw
  for (const page of pages) {
    if (!page.text || !page.url) continue
    const flat = page.text.replace(/\n+/g, ' ').replace(/\s{2,}/g, ' ')
    const chunks = flat.split(/(?<=[.!?]) +/).map((s: string) => s.trim()).filter((s: string) => s.length > 10 && s.length < 250)
    let pageCount = 0
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      if (!activeKw.some((kw: string) => chunk.toLowerCase().includes(kw))) continue
      const ctx = chunks.slice(Math.max(0, i - 1), i + 3).join(' ')
      const dm = ctx.match(dateRe)
      results.push({
        title: chunk.slice(0, 80),
        date: dm ? dm[0] : 'See website for dates',
        location: page.url.replace(/^https?:\/\//, '').split('/')[0],
        description: chunks.slice(i, i + 2).join(' ').slice(0, 200),
        url: page.url,
        score: 8,
        category,
      })
      if (++pageCount >= 5) break
    }
  }
  const seen = new Set<string>()
  return results.filter(r => {
    const k = r.title.toLowerCase().slice(0, 40)
    if (seen.has(k)) return false
    seen.add(k)
    return true
  }).slice(0, 12)
}

export async function searchLiveEvents(
  category: LiveEventCategory,
  zip: string,
  radius: number
): Promise<{ data: LiveEventResult[] | null; error: string | null; cached: boolean }> {
  const cacheKey = 'apify:' + category + ':' + zip + ':' + radius
  const cached = await readCache(cacheKey, zip)
  if (cached) return { data: cached, error: null, cached: true }
  try {
    const apiKey = process.env.APIFY_API_TOKEN
    if (!apiKey) throw new Error('APIFY_API_TOKEN not configured')
    const sites = getSitesForZip(zip)
    const pages = await crawlWithApify(sites.slice(0, 3), apiKey)
    console.log('[eventSearch] Crawled ' + pages.length + ' pages for zip ' + zip)
    const events = extractEvents(pages, category)
    console.log('[eventSearch] Extracted ' + events.length + ' events')
    if (events.length > 0) await writeCache(cacheKey, zip, events)
    return { data: events, error: null, cached: false }
  } catch (e) {
    console.error('[eventSearch/searchLiveEvents]', e)
    return { data: null, error: e instanceof Error ? e.message : String(e), cached: false }
  }
}

export async function joinLiveEvent(memberId: string, eventUrl: string, eventTitle: string, eventDate: string): Promise<{ error: string | null }> {
  try {
    const admin = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin.from as any)('live_event_rsvps')
      .upsert({ member_id: memberId, event_url: eventUrl, event_title: eventTitle, event_date: eventDate }, { onConflict: 'member_id,event_url', ignoreDuplicates: true })
    if (error) { console.error('[eventSearch/joinLiveEvent]', error); return { error: error.message } }
    return { error: null }
  } catch (e) { return { error: e instanceof Error ? e.message : String(e) } }
}

export async function leaveLiveEvent(memberId: string, eventUrl: string): Promise<{ error: string | null }> {
  try {
    const admin = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin.from as any)('live_event_rsvps').delete().eq('member_id', memberId).eq('event_url', eventUrl)
    if (error) { console.error('[eventSearch/leaveLiveEvent]', error); return { error: error.message } }
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
