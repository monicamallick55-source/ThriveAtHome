import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature')
  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  const body = await req.text()
  if (!body) return NextResponse.json({ error: 'Empty body' }, { status: 400 })

  try {
    const event = JSON.parse(body)
    // In production: verify with stripe.webhooks.constructEvent
    switch (event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      case 'invoice.payment_failed':
        // Handle subscription lifecycle
        break
    }
    return NextResponse.json({ received: true })
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
}
