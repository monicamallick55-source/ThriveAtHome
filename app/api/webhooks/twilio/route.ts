import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const contentType = req.headers.get('content-type') ?? ''
  let body: Record<string, string> = {}

  if (contentType.includes('application/x-www-form-urlencoded')) {
    const text = await req.text()
    body = Object.fromEntries(new URLSearchParams(text))
  } else {
    body = await req.json().catch(() => ({}))
  }

  const callStatus = body.CallStatus ?? body.call_status
  const transcript = body.SpeechResult ?? body.transcript ?? ''

  // Crisis detection
  const crisisKeywords = ['suicide', 'kill myself', 'end it all', 'want to die', 'cant go on']
  const isCrisis = crisisKeywords.some(k => transcript.toLowerCase().includes(k))

  if (isCrisis) {
    // In production: trigger crisis navigator task
    console.log('Crisis detected in Twilio webhook')
  }

  // TwiML response
  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Thank you for calling ThriveAtHome. A team member will follow up with you shortly.</Say>
</Response>`,
    { headers: { 'Content-Type': 'text/xml' } }
  )
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ status: 'Twilio webhook active' })
}
