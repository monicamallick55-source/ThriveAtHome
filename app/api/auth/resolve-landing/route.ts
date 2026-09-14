// After sign-in the client asks this route where to go. Centralises role routing
// for all role types in one server-side place. If the user holds more than one
// role it returns multi=true and the client sends them to /select-role.
import { NextResponse } from 'next/server'
import { getCurrentUser, getAllRolesForAuth } from '@/lib/auth'
import { ROLE_HOME } from '@/lib/roles'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const roles = await getAllRolesForAuth(user.id)

  // A senior who signed up for themselves has a 'family' family_members row AND a
  // linked members row — that is still a single destination (the member portal),
  // not a multi-role situation.
  if (roles.length === 1 && roles[0] === 'family') {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const from = createAdminClient().from as any
    const { data: memberRow } = await from('members').select('id').eq('supabase_auth_id', user.id).maybeSingle()
    return NextResponse.json({ path: memberRow ? '/member-portal' : '/dashboard', multi: false, roles })
  }

  if (roles.length <= 1) {
    return NextResponse.json({ path: ROLE_HOME[roles[0] ?? 'family'] ?? '/dashboard', multi: false, roles })
  }

  return NextResponse.json({ path: '/select-role', multi: true, roles })
}
