import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const body = await req.json().catch(() => ({}))
  const id = `ta-assign-${Date.now()}`
  return NextResponse.json({ id, ...body, status: 'assigned', created_at: new Date().toISOString() }, { status: 201 })
}
