import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const SOURCES = [
  { zip: '94403', url: 'https://www.cityofsanmateo.org/640/Senior-Center-Programming' },
  { zip: '94403', url: 'https://www.cityofsanmateo.org/Archive.aspx?AMID=37' },
  { zip: '94404', url: 'https://www.pjcc.org/programs/fitness/' },
  { zip: '94404', url: 'https://www.pjcc.org/programs/arts-culture/' },
  { zip: '94025', url: 'https://ageup.org/events/' },
  { zip: '94063', url: 'https://www.redwoodcity.org/departments/parks-recreation-and-community-services/senior-center/senior-center-programs' },
  { zip: '94402', url: 'https://www.smcgov.org/hsa/senior-nutrition-program' },
  { zip: '94070', url: 'https://www.cityofsancarlos.org/government/departments/recreation/adult-community-center/adult-community-center-classes' },
]

const CACHE_HOURS = 25

export async function GET(req: Request) {
  const secret = req.headers.get('x-cron-secret') ?? new URL(req.url).searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.APIFY_API_TOKEN
  if (!apiKey) return NextResponse.json({ error: 'APIFY_API_TOKEN not set' })

  const startUrls = SOURCES.map((s: any) => ({ url: s.url }))

  let pages: Array<{ url: string; text: string }> = []
  try {
    const res = await fetch(
      'https://api.apify.com/v2/acts/apify~website-content-crawler/run-sync-get-dataset-items?token=' + apiKey + '&memory=1024',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startUrls, maxCrawlPages: 1, crawlerType: 'cheerio' }),
        signal: AbortSignal.timeout(280000),
      }
    )
    const data = await res.json()
    pages = (Array.isArray(data) ? data : []).map((item: { url?: string; text?: string }) => ({
      url: item.url ?? '',
      text: item.text ?? '',
    }))
  } catch (e) {
    return NextResponse.json({ error: 'Apify failed: ' + String(e) })
  }

  const seniorKw = ['senior', 'yoga', 'art', 'music', 'dance', 'class', 'workshop', 'program', 'activity', 'club', 'bingo', 'lunch', 'health', 'wellness', 'exercise', 'swim', 'movie', 'game', 'billiard', 'mahjong', 'pilates', 'zumba', 'pottery', 'painting', 'knitting', 'book', 'fitness', 'tai chi', 'lecture', 'trip', 'volunteer']
  const dateRe = /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* \d{1,2}(?:,? \d{4})?|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?/i

  // Group results by zip
  const byZip: Record<string, Array<{ title: string; date: string; location: string; description: string; url: string; score: number; category: string }>> = {}

  for (const page of pages) {
    if (!page.text || !page.url) continue
    const source = SOURCES.find(s => page.url.includes(new URL(s.url).hostname))
    const zip = source?.zip ?? '94404'
    if (!byZip[zip]) byZip[zip] = []
    const flat = page.text.replace(/\n+/g, ' ').replace(/\s{2,}/g, ' ')
    const chunks = flat.split(/(?<=[.!?]) +/).map((s: string) => s.trim()).filter((s: string) => s.length > 10 && s.length < 250)
    let count = 0
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      if (!seniorKw.some(kw => chunk.toLowerCase().includes(kw))) continue
      const ctx = chunks.slice(Math.max(0, i - 1), i + 3).join(' ')
      const dm = ctx.match(dateRe)
      byZip[zip].push({
        title: chunk.slice(0, 80),
        date: dm ? dm[0] : 'See website for dates',
        location: page.url.replace(/^https?:\/\//, '').split('/')[0],
        description: chunks.slice(i, i + 2).join(' ').slice(0, 200),
        url: page.url,
        score: 8,
        category: 'cultural',
      })
      if (++count >= 5) break
    }
  }

  // Deduplicate and also store for nearby zips
  const admin = createAdminClient()
  const expiresAt = new Date(Date.now() + CACHE_HOURS * 60 * 60 * 1000).toISOString()
  const stored: string[] = []

  // Merge all events into a single pool for radius-based lookup
  const allEvents = Object.values(byZip).flat()
  const seen = new Set<string>()
  const deduped = allEvents.filter(e => {
    const k = e.title.toLowerCase().slice(0, 40)
    if (seen.has(k)) return false
    seen.add(k)
    return true
  }).slice(0, 20)

  // Store under each zip that has sources
  const zips = [...new Set(SOURCES.map((s: any) => s.zip))]
  for (const zip of zips) {
    const cacheKey = 'searchapi:cultural:' + zip + ':25'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin.from as any)('event_search_cache').delete().eq('zip_code', zip).eq('query', cacheKey)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin.from as any)('event_search_cache').insert({ query: cacheKey, zip_code: zip, results: deduped, expires_at: expiresAt })
    stored.push(zip)
  }

  return NextResponse.json({ ok: true, pagesScraped: pages.length, eventsFound: deduped.length, zipsUpdated: stored })
}