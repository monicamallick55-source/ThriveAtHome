import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getUserRole } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = await getUserRole(user.id)
  if (role !== 'navigator' && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const city = searchParams.get('city')
  const serviceType = searchParams.get('serviceType')

  const admin = createAdminClient()
  let query = admin
    .from('service_providers')
    .select('*')
    .eq('is_active', true)
    .order('rating_average', { ascending: false, nullsFirst: false })

  if (city) {
    query = query.ilike('city', city)
  }
  if (serviceType) {
    query = query.contains('service_types', [serviceType])
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ providers: data ?? [] })
}
