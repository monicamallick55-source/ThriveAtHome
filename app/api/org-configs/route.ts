/**
 * app/api/org-configs/route.ts — Organization Configuration
 * TC-OA002
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const orgId = searchParams.get('org_id')

  if (!orgId) return NextResponse.json({ error: 'org_id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('org_configs')
    .select('*')
    .eq('org_id', orgId)
    .single()

  if (error) return NextResponse.json({ config: {} })
  return NextResponse.json({ config: data })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body?.org_id) return NextResponse.json({ error: 'org_id required' }, { status: 400 })

  const { org_id, ...updates } = body
  const { data, error } = await supabase
    .from('org_configs')
    .upsert({ org_id, ...updates })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ config: data })
}
