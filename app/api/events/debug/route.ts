import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.APIFY_API_TOKEN
  if (!apiKey) return NextResponse.json({ error: 'APIFY_API_TOKEN not set' })

  // Test Apify Meetup Events Scraper actor
  const res = await fetch('https://api.apify.com/v2/acts/compass~crawler-google-places/run-sync-get-dataset-items?token=' + apiKey, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      searchStringsArray: ['senior events classes near 94404'],
      maxCrawledPlacesPerSearch: 5,
      language: 'en',
      countryCode: 'us',
    }),
    signal: AbortSignal.timeout(25000),
  })

  const data = await res.json()
  return NextResponse.json({ status: res.status, sample: Array.isArray(data) ? data.slice(0, 2) : data })
}
