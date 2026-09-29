import { NextResponse } from 'next/server'

export async function GET() {
  // Localist powers community calendars - test known Bay Area instances
  const endpoints = [
    'https://sanmateo.localist.com/api/2/events?days=30&pp=10',
    'https://smccd.localist.com/api/2/events?days=30&pp=10',
    'https://cityofsanmateo.localist.com/api/2/events?days=30&pp=10',
  ]

  const results: Record<string, unknown> = {}
  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, { headers: { 'Accept': 'application/json' } })
      const text = await res.text()
      let data: unknown
      try { data = JSON.parse(text) } catch { data = text.slice(0, 200) }
      results[ep] = { status: res.status, sample: data }
    } catch (e) {
      results[ep] = { error: String(e) }
    }
  }
  return NextResponse.json(results)
}
