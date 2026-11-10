import { NextResponse } from 'next/server'
export async function GET() {
  return NextResponse.json({ members: 0, events: 0, volunteers: 0 })
}
