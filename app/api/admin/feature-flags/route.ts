import { NextRequest, NextResponse } from 'next/server'
const flags: Record<string, boolean> = { marketplace: false, celebrations_v2: true, grief_support: true, ai_calls: true }
export async function GET() { return NextResponse.json({ flags }) }
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    Object.assign(flags, body)
    return NextResponse.json({ flags })
  } catch { return NextResponse.json({ error: 'Bad request' }, { status: 400 }) }
}
