import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.SEARCHAPI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'SEARCHAPI_API_KEY not set' })

  const results: Record<string, unknown> = {}
  for (const q of [
    'events in San Mateo CA',
    'senior events Bay Area',
    'events near 94404',
  ]) {
    const url = new URL('https://www.searchapi.io/api/v1/search')
    url.searchParams.set('engine', 'google_events')
    url.searchParams.set('api_key', apiKey)
    url.searchParams.set('q', q)
    url.searchParams.set('hl', 'en')
    url.searchParams.set('gl', 'us')
    const res = await fetch(url.toString())
    const data = await res.json()
    results[q] = {
      count: (data.events_results ?? []).length,
      first2: (data.events_results ?? []).slice(0, 2).map((e: {title:string; date?: {when?:string}; venue?: {name?:string}}) => ({
        title: e.title, when: e.date?.when, venue: e.venue?.name
      })),
      error: data.error ?? null
    }
  }
  return NextResponse.json(results)
}
