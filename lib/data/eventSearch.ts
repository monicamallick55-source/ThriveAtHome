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

interface ApifyPlace {
  title?: string
  website?: string
  address?: string
  categoryName?: string
}

async function findSeniorCentersNearZip(zip: string, apiKey: string): Promise<ApifyPlace[]> {
  const res = await fetch(
    \`https://api.apify.com/v2/acts/compass~crawler-google-places/run-sync-get-dataset-items?token=\${apiKey}&memory=256\`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        searchStringsArray: [
          \`senior center near \${zip}\`,
          \`community center classes seniors near \${zip}\`,
          \`adult education 55+ near \${zip}\`,
        ],
        maxCrawledPlacesPerSearch: 5,
        language: 'en',
        countryCode: 'us',
      }),
      signal: AbortSignal.timeout(28000),
    }
  )
  if (!res.ok) throw new Error(\`Apify Places failed: \${res.status}\`)
  const data = await res.json()
  return (Array.isArray(data) ? data : []) as ApifyPlace[]
}

interface PageContent {
  url: string
  text: string
}

async function crawlEventPages(websites: string[], apiKey: string): Promise<PageContent[]> {
  const startUrls = websites.slice(0, 5).map(url => ({ url }))
  const res = await fetch(
    \`https://api.apify.com/v2/acts/apify~website-content-crawler/run-sync-get-dataset-items?token=\${apiKey}&memory=512\`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startUrls,
        maxCrawlPages: 2,
        crawlerType: 'cheerio',
        includeUrlGlobs: ['*event*', '*class*', '*program*', '*activit*', '*calendar*', '*recreation*'],
      }),
      signal: AbortSignal.timeout(28000),
    }
  )
  if (!res.ok) throw new Error(\`Apify Crawler failed: \${res.status}\`)
  const data = await res.json()
  return (Array.isArray(data) ? data : []).map((item: { url?: string; text?: string }) => ({
    url: item.url ?? '',
    text: item.text ?? '',
  }))
}

function extractEventsFromText(pages: PageContent[], category: LiveEventCategory): LiveEventResult[] {
  const results: LiveEventResult[] = []
  const seniorKeywords = ['senior', 'adult', '55+', '60+', 'elder', 'fitness', 'yoga', 'art', 'music', 'dance', 'craft', 'class', 'workshop', 'program', 'activity', 'club', 'social', 'lecture', 'trip', 'volunteer', 'garden', 'bingo', 'lunch', 'nutrition', 'health', 'wellness']
  const festivalKeywords = ['festival', 'fair', 'cultural', 'heritage', 'celebration', 'parade', 'concert', 'performance', 'exhibit']
  const datePattern = /(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:,\s*\d{4})?|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?/gi

  for (const page of pages) {
    if (!page.text || !page.url) continue
    const lines = page.text.split(/\n+/).map((l: string) => l.trim()).filter((l: string) => l.length > 10)
    const activeKeywords = category === 'festival' ? festivalKeywords : seniorKeywords
    let pageCount = 0

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const lowerLine = line.toLowerCase()
      const hasKeyword = activeKeywords.some((kw: string) => lowerLine.includes(kw))
      if (!hasKeyword || line.length > 200) continue
      const context = lines.slice(Math.max(0, i - 1), Math.min(lines.length, i + 3)).join(' ')
      const dateMatch = context.match(datePattern)
      const date = dateMatch ? dateMatch[0] : 'See website for dates'
      const description = lines.slice(i, Math.min(lines.length, i + 2)).join(' ').slice(0, 200)
      results.push({
        title: line.slice(0, 80),
        date,
        location: page.url.replace(/^https?:\/\//, '').split('/')[0],
        description,
        url: page.url,
        score: 8,
        category,
      })
      pageCount++
      if (pageCount >= 4) break
    }
  }

  const seen = new Set<string>()
  return results.filter(r => {
    const key = r.title.toLowerCase().slice(0, 40)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).slice(0, 12)
}

async function runApifyPipeline(category: LiveEventCategory, zip: string): Promise<LiveEventResult[]> {
  const apiKey = process.env.APIFY_API_TOKEN
  if (!apiKey) throw new Error('APIFY_API_TOKEN not configured')
  const places = await findSeniorCentersNearZip(zip, apiKey)
  console.log(\`[eventSearch] Found \${places.length} places near \${zip}\`)
  const websites = places
    .map((p: ApifyPlace) => p.website)
    .filter((w: string | undefined): w is string => !!w && w.startsWith('http'))
  if (websites.length === 0) throw new Error('No senior center websites found near ' + zip)
  const pages = await crawlEventPages(websites, apiKey)
  console.log(\`[eventSearch] Crawled \${pages.length} pages\`)
  const events = extractEventsFromText(pages, category)
  console.log(\`[eventSearch] Extracted \${events.length} events\`)
  return events
}

export async function searchLiveEvents(
  category: LiveEventCategory,
  zip: string,
  radius: number
): Promise<{ data: LiveEventResult[] | null; error: string | null; cached: boolean }> {
  const cacheKey = \`apify:\${category}:\${zip}:\${radius}\`
  const cached = await readCache(cacheKey, zip)
  if (cached) return { data: cached, error: null, cached: true }
  try {
    const events = await runApifyPipeline(category, zip)
    if (events.length > 0) await writeCache(cacheKey, zip, events)
    return { data: events, error: null, cached: false }
  } catch (e) {
    console.error('[eventSearch/searchLiveEvents]', e)
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
    if (error) { console.error('[eventSearch/joinLiveEvent]', error); return { error: error.message } }
    return { error: null }
  } catch (e) {
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
    if (error) { console.error('[eventSearch/leaveLiveEvent]', error); return { error: error.message } }
    return { error: null }
  } catch (e) {
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
  } catch (e) {
    return { data: {}, error: e instanceof Error ? e.message : String(e) }
  }
}
