// app/api/cron/family-summary/route.ts
// Vercel cron endpoint — fires at 7:00 AM Pacific daily
// vercel.json: { "path": "/api/cron/family-summary", "schedule": "0 14 * * *" }

import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 401 })
  }

  // Delegate to the main family-summary API
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? `https://${req.headers.get('host')}`

  const res = await fetch(`${baseUrl}/api/family-summary`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.CRON_SECRET}`,
    },
    body: JSON.stringify({}), // send to all active members
  })

  const data = await res.json().catch(() => ({}))
  return NextResponse.json({ triggered: true, ...data })
}
