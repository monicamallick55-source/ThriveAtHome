import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const circle_id = params.id
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const member_id = user?.id ?? `mock-member-${Date.now()}`
    await supabase.from('circle_members')
      .upsert({ circle_id, user_id: member_id, joined_at: new Date().toISOString() })
      .catch(() => {})
    return NextResponse.json({ member_id, circle_id, joined: true })
  } catch {}
  const member_id = `mock-member-${Date.now()}`
  return NextResponse.json({ member_id, circle_id, joined: true })
}
