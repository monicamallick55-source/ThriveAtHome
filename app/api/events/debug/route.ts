import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.SEARCHAPI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'SEARCHAPI_API_KEY not set' })

  const query = 'senior cultural classes workshops within 25 miles of 94404 October 2026'
  const url = new URL('https://www.searchapi.io/api/v1/search')
  url.searchParams.set('engine', 'google_events')
  url.searchParams.set('api_key', apiKey)
  url.searchParams.set('q', query)
  url.searchParams.set('hl', 'en')
  url.searchParams.set('gl', 'us')

  const res = await fetch(url.toString())
  const data = await res.json()
  return NextResponse.json({
    status: res.status,
    count: (data.events_results ?? []).length,
    first3: (data.events_results ?? []).slice(0, 3),
    error: data.error ?? null,
  })
}
