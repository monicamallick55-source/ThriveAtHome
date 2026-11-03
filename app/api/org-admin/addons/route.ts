import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get('org_id')
  if (!orgId) return NextResponse.json({ error: 'org_id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('org_addons')
    .select('id, addon_id, status, activated_at')
    .eq('org_id', orgId)

  if (error) {
    // Table may not exist yet — return empty gracefully
    return NextResponse.json([])
  }

  return NextResponse.json(
    (data || []).map((a: any) => ({
      id: a.addon_id,
      name: a.addon_id,
      status: a.status,
    }))
  )
}
