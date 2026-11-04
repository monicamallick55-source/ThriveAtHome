/**
 * app/api/home-sharing/referrals/[id]/route.ts — G6.2
 *
 * PATCH /api/home-sharing/referrals/[id] — update participation_status + notes
 *                                           (navigator or member self-report)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const VALID_STATUSES = [
  'referred', 'application_submitted', 'enrolled', 'completed', 'withdrawn', 'not_eligible'
]

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { participation_status, notes } = body

  if (participation_status && !VALID_STATUSES.includes(participation_status)) {
    return NextResponse.json({ error: 'Invalid participation_status' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  if (participation_status) {
    updates.participation_status = participation_status
    updates.participation_updated_at = new Date().toISOString()
  }
  if (notes !== undefined) updates.notes = notes

  const { data, error } = await supabase
    .from('home_sharing_referrals')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ referral: data })
}
