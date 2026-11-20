import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export async function POST(_req: NextRequest) {
  return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', { headers: { 'Content-Type': 'text/xml' } })
}
export async function GET(_req: NextRequest) {
  return NextResponse.json({ status: 'active', provider: 'twilio' })
}
