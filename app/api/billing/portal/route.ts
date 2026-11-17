import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  return NextResponse.json({ url: `https://billing.stripe.com/session/test_${Date.now()}`, created: true })
}
