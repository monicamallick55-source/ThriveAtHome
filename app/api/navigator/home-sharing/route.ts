// app/api/navigator/home-sharing/route.ts
// GET — list all active home sharing referrals for navigator console

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { data: fm } = await supabase
    .from('family_members')
    .select('id, role')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  if (!fm || !['admin', 'navigator'].includes(fm.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: referrals } = await (admin as any)
    .from('home_sharing_referrals')
    .select(`
      id, role, status, created_at, updated_at,
      home_description, rent_expectation, preferred_move_in,
      budget_description, desired_location, move_in_by,
      notes, navigator_notes,
      member:members!home_sharing_referrals_member_id_fkey(id, full_name, preferred_name, phone, city, state),
      matched_member:members!home_sharing_referrals_matched_member_id_fkey(id, full_name, preferred_name),
      navigator:members!home_sharing_referrals_navigator_id_fkey(id, full_name, preferred_name)
    `)
    .not('status', 'in', '("closed")')
    .order('created_at', { ascending: false })

  return NextResponse.json({ referrals: referrals ?? [] })
}
