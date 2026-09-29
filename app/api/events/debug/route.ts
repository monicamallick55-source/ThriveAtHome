import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.APIFY_API_TOKEN
  try {
    const res = await fetch(
      'https://api.apify.com/v2/acts/apify~website-content-crawler/run-sync-get-dataset-items?token=' + apiKey + '&memory=512',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startUrls: [{ url: 'https://www.cityofsanmateo.org/638/Senior-Center' }],
          maxCrawlPages: 1,
          crawlerType: 'cheerio',
        }),
        signal: AbortSignal.timeout(55000),
      }
    )
    const data = await res.json()
    const text = Array.isArray(data) && data[0] ? (data[0].text ?? '').slice(0, 500) : JSON.stringify(data).slice(0, 500)
    return NextResponse.json({ ok: res.ok, status: res.status, textPreview: text })
  } catch (e) {
    return NextResponse.json({ error: String(e) })
  }
}