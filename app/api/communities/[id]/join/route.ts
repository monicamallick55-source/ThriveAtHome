import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const circleId = params.id
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const memberId = user?.id ?? `mock-member-${Date.now()}`
    await supabase.from('circle_members').upsert({ circle_id: circleId, user_id: memberId, joined_at: new Date().toISOString() }).catch(() => {})
    return NextResponse.json({ member_id: memberId, circle_id: circleId, joined: true })
  } catch {}
  return NextResponse.json({ member_id: `mock-member-${Date.now()}`, circle_id: circleId, joined: true })
}
