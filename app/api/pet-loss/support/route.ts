// M27 Phase 119 — request one-to-one pet-loss support (distinct from the human bereavement path).
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { createAdminClient } from '@/lib/supabase/admin'
import { createPetLossSupportRequest, getPetLossRequestsForMember } from '@/lib/data/pet-loss'

export const runtime = 'nodejs'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  if (!fm?.member_id) return NextResponse.json({ requests: [] })
  const { data, error } = await getPetLossRequestsForMember(fm.member_id)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ requests: data })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  if (!fm?.member_id) return NextResponse.json({ error: 'Please complete onboarding first.' }, { status: 400 })

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  const b = body as Record<string, unknown>

  const admin = createAdminClient()
  const { data: member } = await admin
    .from('members')
    .select('preferred_name')
    .eq('id', fm.member_id)
    .maybeSingle()

  const { data, error } = await createPetLossSupportRequest(
    fm.member_id,
    member?.preferred_name ?? 'The member',
    {
      petId: typeof b.pet_id === 'string' ? b.pet_id : null,
      petName: typeof b.pet_name === 'string' ? b.pet_name : null,
      lossDate: typeof b.loss_date === 'string' ? b.loss_date : null,
      supportType: typeof b.support_type === 'string' ? b.support_type : 'one_to_one',
      message: typeof b.message === 'string' ? b.message : null,
    }
  )
  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json({ request: data }, { status: 201 })
}
