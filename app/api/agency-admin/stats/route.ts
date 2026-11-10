import { NextResponse } from 'next/server'
export async function GET() {
  return NextResponse.json({ workers: 0, clients: 0, hours: 0 })
}
