import { NextResponse } from 'next/server'
import { getCurrentUser, getUserRole, isNavigatorOrAdmin } from '@/lib/auth'
import { getNavigatorByAuthId, isMemberAssignedToNavigator } from '@/lib/data/navigator'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/database'

type NavigatorNote = Database['public']['Tables']['navigator_notes']['Row']

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = user.id

  const role = await getUserRole(userId)
  if (!(await isNavigatorOrAdmin(userId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: navigator, error: navError } = await getNavigatorByAuthId(userId)
  if (navError || !navigator) {
    return NextResponse.json({ error: 'Navigator not found' }, { status: 404 })
  }

  let body: { member_id?: string; note?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { member_id, note } = body
  if (!member_id || typeof member_id !== 'string') {
    return NextResponse.json({ error: 'member_id is required' }, { status: 400 })
  }
  if (!note || typeof note !== 'string' || note.trim().length === 0) {
    return NextResponse.json({ error: 'note is required' }, { status: 400 })
  }

  if (role !== 'admin') {
    const assigned = await isMemberAssignedToNavigator(member_id, navigator.id)
    if (!assigned) {
      return NextResponse.json({ error: 'Not assigned to this member' }, { status: 403 })
    }
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('navigator_notes')
    .insert({ member_id, navigator_id: navigator.id, note: note.trim() })
    .select()
    .maybeSingle()

  if (error) {
    console.error('[api/navigator/notes] insert error:', error)
    return NextResponse.json({ error: 'Failed to save note' }, { status: 500 })
  }

  return NextResponse.json({ note: data as NavigatorNote }, { status: 201 })
}
