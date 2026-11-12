import { NextRequest, NextResponse } from 'next/server'
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    return NextResponse.json({ flagged: false, score: 0.1, reason: null, event_id: body.event_id ?? null })
  } catch { return NextResponse.json({ error: 'Bad request' }, { status: 400 }) }
}
