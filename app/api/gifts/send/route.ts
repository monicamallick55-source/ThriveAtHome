import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/gifts/send — Send a gift to another member.
 * Requires authentication. Returns 401 if not signed in.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { giftId, recipientId } = body

  if (!giftId || !recipientId) {
    return NextResponse.json({ error: 'giftId and recipientId are required' }, { status: 400 })
  }

  // TODO: Implement gift sending logic
  return NextResponse.json({ success: true, message: 'Gift sent' }, { status: 200 })
}
