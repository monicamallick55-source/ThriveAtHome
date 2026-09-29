import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.APIFY_API_TOKEN
  if (!apiKey) return NextResponse.json({ error: 'APIFY_API_TOKEN not set' })

  // Use Apify Website Content Crawler to scrape San Mateo Senior Center events page
  const res = await fetch('https://api.apify.com/v2/acts/apify~website-content-crawler/run-sync-get-dataset-items?token=' + apiKey + '&memory=256', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      startUrls: [{ url: 'https://www.cityofsanmateo.org/638/Senior-Center' }],
      maxCrawlPages: 1,
      crawlerType: 'cheerio',
    }),
    signal: AbortSignal.timeout(29000),
  })

  const data = await res.json()
  const text = Array.isArray(data) && data[0] ? (data[0].text ?? '').slice(0, 1000) : data
  return NextResponse.json({ status: res.status, text })
}
