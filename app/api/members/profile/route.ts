/**
 * app/api/members/profile/route.ts — Member Profile API
 * TC-MBA002 (/api/members/profile responds)
 * TC-MBA001 (profile has birthday / date_of_birth field)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('members')
    .select(`
      id, first_name, last_name, email, phone, zip_code,
      date_of_birth, plan_tier, cultural_preference,
      celebration_opt_out, preferred_contact_method, bio
    `)
    .eq('supabase_auth_id', user.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  // Only allow safe fields to be updated
  const allowed = ['first_name', 'last_name', 'phone', 'zip_code', 'date_of_birth',
    'cultural_preference', 'celebration_opt_out', 'preferred_contact_method', 'bio']
  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }

  const { data, error } = await supabase
    .from('members')
    .update(update)
    .eq('supabase_auth_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
