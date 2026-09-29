import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.SEARCHAPI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'SEARCHAPI_API_KEY not set' })

  // Try regular google search instead of google_events
  const url = new URL('https://www.searchapi.io/api/v1/search')
  url.searchParams.set('engine', 'google')
  url.searchParams.set('api_key', apiKey)
  url.searchParams.set('q', 'events this week San Mateo CA site:eventbrite.com OR site:meetup.com')
  url.searchParams.set('gl', 'us')
  url.searchParams.set('hl', 'en')

  const res = await fetch(url.toString())
  const data = await res.json()
  return NextResponse.json({
    status: res.status,
    organic_count: (data.organic_results ?? []).length,
    first3: (data.organic_results ?? []).slice(0, 3).map((r: {title:string;link:string;snippet:string}) => ({
      title: r.title, link: r.link, snippet: r.snippet
    })),
    error: data.error ?? null,
    credits: data.search_information ?? null,
  })
}
