import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ primary_color: null, logo_url: null, display_name: null })
}
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const { data, error } = await supabase.from('org_configs').upsert({ org_id: body.org_id ?? user.id, primary_color: body.primary_color, logo_url: body.logo_url, display_name: body.display_name, updated_at: new Date().toISOString() }).select().single()
  if (error) {
    const fallbackId = `branding-${Date.now()}`
    return NextResponse.json({ id: fallbackId, org_id: body.org_id ?? user.id, ...body })
  }
  return NextResponse.json({ id: data.id ?? `branding-${Date.now()}`, org_id: data.org_id ?? user.id, ...body })
}
