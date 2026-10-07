import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getUserRole } from '@/lib/auth'
import { updateVolunteerStatus } from '@/lib/data/volunteers'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Enums } from '@/types/database'
type VolunteerStatus = Enums<'volunteer_status'>

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = await getUserRole(user.id)
  if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const { status } = body as { status: VolunteerStatus }

  const allowed: VolunteerStatus[] = ['pending', 'background_check', 'active', 'inactive', 'suspended']
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const { error } = await updateVolunteerStatus(id, status)
  if (error) return NextResponse.json({ error }, { status: 500 })

  // When activating a volunteer, auto-link their Supabase auth account and
  // create a family_members row with role='volunteer' so middleware routing works.
  if (status === 'active') {
    const admin = createAdminClient()
    const { data: vol } = await admin
      .from('volunteers')
      .select('id, email, full_name, supabase_auth_id')
      .eq('id', id)
      .maybeSingle()

    if (vol) {
      let authUserId = vol.supabase_auth_id

      // Find auth user by email if not yet linked
      if (!authUserId) {
        const { data: authList } = await admin.auth.admin.listUsers()
        const authUser = authList?.users?.find(
          (u) => u.email?.toLowerCase() === vol.email.toLowerCase()
        )
        if (authUser) {
          authUserId = authUser.id
          await admin
            .from('volunteers')
            .update({ supabase_auth_id: authUserId })
            .eq('id', vol.id)
        }
      }

      // Create family_members row with role='volunteer' if it doesn't exist
      if (authUserId) {
        const { data: existing } = await admin
          .from('family_members')
          .select('id')
          .eq('supabase_auth_id', authUserId)
          .maybeSingle()

        if (!existing) {
          await admin.from('family_members').insert({
            supabase_auth_id: authUserId,
            full_name: vol.full_name,
            email: vol.email,
            relationship: 'volunteer',
            role: 'volunteer',
          })
        } else {
          // Ensure existing row has role='volunteer'
          await admin
            .from('family_members')
            .update({ role: 'volunteer' })
            .eq('supabase_auth_id', authUserId)
        }
      }
    }
  }

  return NextResponse.json({ ok: true })
}
