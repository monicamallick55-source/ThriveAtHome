/**
 * app/api/village-referrals/[id]/route.ts
 * PATCH /api/village-referrals/[id] — accept or decline an incoming referral
 */
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: self } = await supabase
      .from('org_admins')
      .select('org_id, role')
      .eq('supabase_auth_id', user.id)
      .single()

    if (!self) return NextResponse.json({ error: 'Not an org admin' }, { status: 403 })
    if (self.role === 'viewer') return NextResponse.json({ error: 'Viewers cannot respond to referrals' }, { status: 403 })

    const { action } = await req.json()
    if (!['accept', 'decline'].includes(action)) {
      return NextResponse.json({ error: 'action must be accept or decline' }, { status: 400 })
    }

    const { data: referral } = await supabase
      .from('village_referrals')
      .select('id, status, referring_village_id, receiving_village_id, member_id')
      .eq('id', id)
      .eq('receiving_village_id', self.org_id)
      .eq('status', 'pending')
      .single()

    if (!referral) {
      return NextResponse.json({ error: 'Referral not found or already responded to' }, { status: 404 })
    }

    const newStatus = action === 'accept' ? 'accepted' : 'declined'

    const { data, error } = await supabase
      .from('village_referrals')
      .update({ status: newStatus, responded_at: new Date().toISOString(), responded_by: user.id })
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    if (action === 'accept') {
      await supabase.from('navigator_tasks').insert({
        task_type: 'village_transfer',
        member_id: referral.member_id,
        notes: 'Village transfer coordination needed — member accepted by receiving village.',
        status: 'pending',
        priority: 'high',
      }).then(() => {})
    }

    return NextResponse.json({ referral: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
