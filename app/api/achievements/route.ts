import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ achievements: [], total: 0 })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json().catch(() => ({}))
    const { member_id, type } = body as { member_id?: string; type?: string }
    if (!type) return NextResponse.json({ error: 'type is required' }, { status: 400 })
    return NextResponse.json({
      achievement: {
        id: 'ach_' + Date.now(),
        member_id: member_id ?? 'unknown',
        type,
        awarded_by: 'navigator',
        created_at: new Date().toISOString(),
      }
    }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
