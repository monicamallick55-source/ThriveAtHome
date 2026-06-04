import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: Promise<{ companionId: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { companionId } = await params
  const body = await req.json().catch(() => null)
  if (!body || typeof body.rating !== 'number' || body.rating < 1 || body.rating > 5) {
    return NextResponse.json({ error: 'Rating must be 1–5' }, { status: 400 })
  }

  console.log(`[STUB][Companion] Rating ${body.rating}/5 submitted for companion ${companionId} by user ${user.id}. Will update rating_average when Stripe Connect is live.`)
  return NextResponse.json({ success: true })
}
