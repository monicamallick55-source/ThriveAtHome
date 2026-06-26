import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserRole } from '@/lib/auth'
import { getAAAForAdmin, upsertClientAssessment } from '@/lib/data/aaa'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = await getUserRole(user.id)
  if (role !== 'aaa_admin' && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: aaa } = await getAAAForAdmin(user.id)
  if (!aaa) return NextResponse.json({ error: 'No AAA found for this user' }, { status: 400 })

  const body = await req.json()
  const { member_id, ...fields } = body

  if (!member_id) return NextResponse.json({ error: 'member_id is required' }, { status: 400 })

  const { data, error } = await upsertClientAssessment(member_id, aaa.id, fields)
  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json({ data }, { status: 200 })
}
