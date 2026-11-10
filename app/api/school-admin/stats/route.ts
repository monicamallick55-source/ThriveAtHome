import { NextResponse } from 'next/server'
export async function GET() {
  return NextResponse.json({ programs: 0, volunteers: 0, hours: 0 })
}
