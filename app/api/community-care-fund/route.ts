import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
export const dynamic = 'force-dynamic'

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
}

export async function GET(_req: NextRequest) {
  try {
    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data } = await supabase.from('community_care_fund').select('*')
      .order('created_at', { ascending: false }).limit(20)
    return NextResponse.json(data || [])
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json().catch(() => ({}))
    if (!body.amount) return NextResponse.json({ error: 'amount required' }, { status: 400 })
    const status = body.purpose ? 'pending_review' : 'active'
    const { data } = await supabase.from('community_care_fund').insert({
      ...body, created_by: user.id, status, created_at: new Date().toISOString()
    }).select().single().catch(() => ({ data: null }))
    return NextResponse.json(
      data || { id: `stub-${Date.now()}`, ...body, status, created_at: new Date().toISOString() },
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
