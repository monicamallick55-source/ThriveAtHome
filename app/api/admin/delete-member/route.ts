// Admin-only endpoint: hard-delete all data for a member.
// Requires role=admin and a confirmationCode matching the member's full_name (case-insensitive).
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getUserRole } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { writeAuditLog } from '@/lib/data/audit'

export async function DELETE(req: NextRequest) {
  // 1. Auth — must be authenticated and admin
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = await getUserRole(user.id)
  if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // 2. Parse body
  let memberId: string
  let confirmationCode: string
  try {
    const body = await req.json()
    memberId = body.memberId
    confirmationCode = body.confirmationCode
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!memberId || !confirmationCode) {
    return NextResponse.json({ error: 'memberId and confirmationCode are required' }, { status: 400 })
  }

  const admin = createAdminClient()

  // 3. Verify member exists and confirmation code matches full_name
  const { data: member, error: memberError } = await admin
    .from('members')
    .select('id, full_name')
    .eq('id', memberId)
    .maybeSingle()

  if (memberError || !member) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }

  if (confirmationCode.trim().toLowerCase() !== member.full_name.trim().toLowerCase()) {
    return NextResponse.json({ error: 'Confirmation code does not match member name' }, { status: 400 })
  }

  // 4. Write audit log BEFORE deletion (survives after member data is gone)
  await writeAuditLog('member_deleted', 'member', memberId, user.id)

  // 5. Collect Supabase auth user IDs linked to this member (for auth deletion later)
  const { data: familyRows } = await admin
    .from('family_members')
    .select('supabase_auth_id, id')
    .eq('member_id', memberId)

  const authUserIds: string[] = (familyRows ?? [])
    .map((r) => r.supabase_auth_id)
    .filter((id): id is string => !!id)

  // 6. Hard-delete all PHI in dependency order (child tables first)
  const tables: string[] = [
    'check_in_calls',
    'alerts',
    'realtime_notifications',
    'notification_log',
    'emergency_log',
    'navigator_notes',
    'navigator_tasks',
    'navigator_assignments',
    'family_task_items',
    'family_messages',
    'document_vault_items',
    'medication_schedules',
    'subscriptions',
    'family_members',
    'members',
  ]

  const errors: string[] = []

  for (const table of tables) {
    const col = table === 'members' ? 'id' : 'member_id'
    const { error } = await admin.from(table as never).delete().eq(col, memberId)
    if (error) {
      console.error(`[delete-member] Failed to delete from ${table}:`, error.message)
      errors.push(table)
    }
  }

  // 7. Delete Supabase Auth users
  for (const authId of authUserIds) {
    const { error } = await admin.auth.admin.deleteUser(authId)
    if (error) {
      console.error(`[delete-member] Failed to delete auth user ${authId}:`, error.message)
    }
  }

  if (errors.length > 0) {
    return NextResponse.json(
      { success: false, error: `Partial deletion — failed tables: ${errors.join(', ')}` },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    message: `All data for member ${member.full_name} has been permanently deleted.`,
    tablesCleared: tables.length,
    authUsersDeleted: authUserIds.length,
  })
}
