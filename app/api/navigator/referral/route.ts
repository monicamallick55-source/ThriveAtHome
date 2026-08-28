import { NextResponse } from 'next/server'
import { getCurrentUser, getUserRole, isNavigatorOrAdmin } from '@/lib/auth'
import { getNavigatorByAuthId, isMemberAssignedToNavigator } from '@/lib/data/navigator'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/database'

type NavigatorNote = Database['public']['Tables']['navigator_notes']['Row']

const REFERRAL_TYPES = [
  'Grief / bereavement counselor',
  'Mental health professional (therapist)',
  'Elder law attorney',
  'Financial advisor / planner',
  'Hospice / palliative care',
  'Social worker',
  'Psychiatric medication support',
  'Other professional support',
]

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = await getUserRole(user.id)
  if (!(await isNavigatorOrAdmin(user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: navigator, error: navError } = await getNavigatorByAuthId(user.id)
  if (navError || !navigator) {
    return NextResponse.json({ error: 'Navigator not found' }, { status: 404 })
  }

  let body: { member_id?: string; referral_type?: string; referral_note?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { member_id, referral_type, referral_note } = body
  if (!member_id || typeof member_id !== 'string') {
    return NextResponse.json({ error: 'member_id is required' }, { status: 400 })
  }
  if (!referral_type || !REFERRAL_TYPES.includes(referral_type)) {
    return NextResponse.json({ error: 'Valid referral_type is required' }, { status: 400 })
  }
  if (!referral_note || typeof referral_note !== 'string' || referral_note.trim().length === 0) {
    return NextResponse.json({ error: 'referral_note is required' }, { status: 400 })
  }

  if (role !== 'admin') {
    const assigned = await isMemberAssignedToNavigator(member_id, navigator.id)
    if (!assigned) {
      return NextResponse.json({ error: 'Not assigned to this member' }, { status: 403 })
    }
  }

  const formattedNote = `[REFERRAL: ${referral_type}] ${referral_note.trim()}`

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('navigator_notes')
    .insert({ member_id, navigator_id: navigator.id, note: formattedNote })
    .select()
    .maybeSingle()

  if (error) {
    console.error('[api/navigator/referral] insert error:', error)
    return NextResponse.json({ error: 'Failed to save referral' }, { status: 500 })
  }

  return NextResponse.json({ note: data as NavigatorNote }, { status: 201 })
}
