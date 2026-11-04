/**
 * app/api/community-partners/[id]/route.ts — G6.0
 *
 * PATCH /api/community-partners/[id] — staff confirms/pauses/activates a partner
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const updates: Record<string, unknown> = {}

  if (body.status !== undefined) updates.status = body.status
  if (body.phone !== undefined) updates.phone = body.phone
  if (body.website !== undefined) updates.website = body.website
  if (body.mou_signed !== undefined) updates.mou_signed = body.mou_signed
  if (body.eligibility_notes !== undefined) updates.eligibility_notes = body.eligibility_notes

  if (body.status === 'active') {
    updates.confirmed_by = user.id
    updates.confirmed_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('community_partners')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ partner: data })
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('community_partners')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ partner: data })
}
