import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { resolveMemberContext } from '@/lib/data/members'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { memberId } = await resolveMemberContext(user.id)
  if (!memberId) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  const { opted_out } = await req.json()
  if (typeof opted_out !== 'boolean') {
    return NextResponse.json({ error: 'opted_out must be boolean' }, { status: 400 })
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('members')
    .update({ celebration_opt_out: opted_out } as any)
    .eq('id', memberId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, celebration_opt_out: opted_out })
}
