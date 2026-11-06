// After sign-in the client asks this route where to go. Centralises role routing
// for all role types in one server-side place. If the user holds more than one
// role it returns multi=true and the client sends them to /select-role.
import { NextResponse } from 'next/server'
import { getCurrentUser, getAllRolesForAuth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { ROLE_HOME } from '@/lib/roles'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const roles = await getAllRolesForAuth(user.id)

    if (roles.length <= 1) {
      return NextResponse.json({ path: ROLE_HOME[roles[0] ?? 'family'] ?? '/dashboard/family', multi: false, roles })
    }

    return NextResponse.json({ path: '/select-role', multi: true, roles })
  } catch (err) {
    console.error('[resolve-landing]', err)
    return NextResponse.json({ path: '/dashboard', multi: false, roles: [] })
  }
}
