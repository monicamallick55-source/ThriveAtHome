import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.SEARCHAPI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'no key' })

  // SearchApi google_events supports 'location' as a separate param
  const url = new URL('https://www.searchapi.io/api/v1/search')
  url.searchParams.set('engine', 'google_events')
  url.searchParams.set('api_key', apiKey)
  url.searchParams.set('q', 'senior community events classes')
  url.searchParams.set('location', 'San Mateo, California, United States')
  url.searchParams.set('hl', 'en')
  url.searchParams.set('gl', 'us')

  const res = await fetch(url.toString())
  const data = await res.json()
  return NextResponse.json({
    count: (data.events_results ?? []).length,
    first3: (data.events_results ?? []).slice(0, 3).map((e: {title:string;date?:{when?:string};venue?:{name?:string};link?:string}) => ({
      title: e.title, when: e.date?.when, venue: e.venue?.name, link: e.link
    })),
    error: data.error ?? null
  })
}
