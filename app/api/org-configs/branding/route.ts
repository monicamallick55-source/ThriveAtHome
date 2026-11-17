import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase.from('org_configs').select('*').eq('key', 'branding').single()
      if (data) return NextResponse.json(data)
    }
  } catch {}
  return NextResponse.json({ org_id: 'default', primary_color: '#6366f1', logo_url: null, display_name: 'ThriveAtHome' })
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch {}
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data, error } = await supabase.from('org_configs').upsert({ key: 'branding', org_id: user.id, ...body }).select().single()
      if (data && !error) return NextResponse.json(data, { status: 201 })
    }
  } catch {}
  return NextResponse.json({ id: `brand-${Date.now()}`, org_id: 'mock-org', ...body }, { status: 201 })
}
