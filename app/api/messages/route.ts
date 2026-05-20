// Family messages API — sends a message for the authenticated user's member.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createFamilyMessage } from '@/lib/data/messages'

export async function POST(request: NextRequest) {
  // 1. Authenticate
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  // 2. Parse body
  let body: { memberId?: string; body?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { memberId, body: messageBody } = body
  if (!memberId || !messageBody || typeof messageBody !== 'string' || messageBody.trim() === '') {
    return NextResponse.json({ error: 'memberId and body are required' }, { status: 400 })
  }

  // 3. Authorise: confirm this user is linked to the requested member and get family_member id
  const admin = createAdminClient()
  const { data: fm, error: fmError } = await admin
    .from('family_members')
    .select('id, member_id')
    .eq('supabase_auth_id', user.id)
    .eq('member_id', memberId)
    .maybeSingle()

  if (fmError) {
    console.error('[api/messages] family_members check:', fmError)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
  if (!fm) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 4. Create message — sender is the family_member row id
  const { data: message, error: msgError } = await createFamilyMessage(
    memberId,
    fm.id,
    messageBody.trim()
  )

  if (msgError || !message) {
    return NextResponse.json({ error: msgError ?? 'Failed to send message' }, { status: 500 })
  }

  return NextResponse.json({ message }, { status: 201 })
}
