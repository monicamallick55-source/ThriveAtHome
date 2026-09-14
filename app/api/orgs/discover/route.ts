// Public-to-members community-org search. Returns active orgs matching a name / city /
// zip query so a member can find and request to join one without a navigator.
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  const admin = createAdminClient()

  let query = (admin.from as any)('community_orgs')
    .select('id, org_name, org_type, city, state, zip_code, description, service_area_description, member_count')
    .eq('is_active', true)
    .order('member_count', { ascending: false })
    .limit(25)

  if (q) {
    // name OR city OR zip prefix
    query = query.or(`org_name.ilike.%${q}%,city.ilike.%${q}%,zip_code.ilike.${q}%`)
  }

  const { data, error } = await query
  if (error) {
    console.error('[api/orgs/discover]', error)
    return NextResponse.json({ orgs: [] })
  }
  return NextResponse.json({ orgs: data ?? [] })
}
