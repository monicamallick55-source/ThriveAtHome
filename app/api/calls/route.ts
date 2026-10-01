// Paginated call history API — returns check_in_calls for the authenticated user's member.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { FAMILY_CALL_COLUMNS } from '@/lib/data/calls'

export async function GET(request: NextRequest) {
  // 1. Authenticate
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  // 2. Validate query params
  const { searchParams } = request.nextUrl
  const memberId = searchParams.get('memberId')
  const offset = parseInt(searchParams.get('offset') ?? '0', 10)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 50)

  if (!memberId) {
    return NextResponse.json({ error: 'memberId is required' }, { status: 400 })
  }

  // 3. Authorise: confirm this user is linked to the requested member
  const admin = createAdminClient()
  const { data: fm, error: fmError } = await admin
    .from('family_members')
    .select('member_id')
    .eq('supabase_auth_id', user.id)
    .eq('member_id', memberId)
    .maybeSingle()

  if (fmError) {
    console.error('[api/calls] family_members check:', fmError)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
  if (!fm) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 4. Fetch paginated calls, newest first — family-safe columns only (never the transcript)
  const { data: calls, error: callsError } = await admin
    .from('check_in_calls')
    .select(FAMILY_CALL_COLUMNS.join(', '))
    .eq('member_id', memberId)
    .order('scheduled_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (callsError) {
    console.error('[api/calls] fetch:', callsError)
    return NextResponse.json({ error: 'Unable to load calls' }, { status: 500 })
  }

  return NextResponse.json({ calls: calls ?? [] })
}
