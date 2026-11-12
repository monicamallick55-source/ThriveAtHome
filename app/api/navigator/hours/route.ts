import { NextRequest, NextResponse } from 'next/server'
export async function GET() {
  return NextResponse.json({ total_hours: 0, entries: [] })
}
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    return NextResponse.json({ id: 'hr_' + Date.now(), ...body, logged_at: new Date().toISOString() }, { status: 201 })
  } catch { return NextResponse.json({ error: 'Bad request' }, { status: 400 }) }
}
