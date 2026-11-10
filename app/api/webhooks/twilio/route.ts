import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  return NextResponse.json({ status: 'active', provider: 'twilio' })
}
export async function POST(req: NextRequest) {
  return new Response('<?xml version="1.0" encoding="UTF-8"?><Response><Say>Thank you for calling ThriveAtHome.</Say></Response>', { status: 200, headers: { 'Content-Type': 'text/xml' } })
}
