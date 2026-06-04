import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getUserRole } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/volunteers/active?serviceType=tech_help
// Returns active volunteers, optionally filtered by a visit_type value.
// Only navigators and admins can call this.
export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = await getUserRole(user.id)
  if (role !== 'navigator' && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const serviceType = req.nextUrl.searchParams.get('serviceType')

  const admin = createAdminClient()
  let query = admin
    .from('volunteers')
    .select('id, full_name, email, phone, city, state, languages, availability_days, hours_per_week, service_types, interests, rating_average, total_hours_logged, total_seniors_helped, status')
    .eq('status', 'active')
    .order('rating_average', { ascending: false, nullsFirst: false })

  if (serviceType) {
    // Filter volunteers whose service_types enum[] array contains the given value.
    // .contains() sends cs.{"value"} which works for text arrays but not enum arrays.
    // Using .filter() with cs and explicit brace syntax handles the enum cast correctly.
    query = query.filter('service_types', 'cs', `{${serviceType}}`)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ volunteers: data ?? [] })
}
