import { NextRequest, NextResponse } from 'next/server'
export async function GET() { return NextResponse.json({ balance: 0, allocations: [], currency: 'usd' }) }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    return NextResponse.json({ id: 'ccf_' + Date.now(), ...body, status: 'pending' }, { status: 201 })
  } catch { return NextResponse.json({ error: 'Bad request' }, { status: 400 }) }
}
