import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkOutVisitor } from '@/lib/data/seniorCenters'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { dropin_id } = body
    if (!dropin_id) return NextResponse.json({ error: 'dropin_id is required' }, { status: 400 })

    // Verify the dropin belongs to a center this user admins
    const admin = createAdminClient()
    const { data: dropin } = await (admin.from as any)('center_dropins')
      .select('center_id')
      .eq('id', dropin_id)
      .maybeSingle()
    if (!dropin) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { data: fm } = await admin
      .from('family_members')
      .select('role, senior_center_id')
      .eq('supabase_auth_id', user.id)
      .maybeSingle()
    const isAdmin = fm?.role === 'admin' || (fm?.role === 'senior_center_admin' && fm.senior_center_id === dropin.center_id)
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data, error } = await checkOutVisitor(dropin_id)
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
