import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { deletePostComment } from '@/lib/data/circles'

interface Ctx { params: Promise<{ commentId: string }> }

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { commentId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: fm } = await supabase
    .from('family_members')
    .select('member_id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()
  if (!fm) return NextResponse.json({ error: 'No member' }, { status: 403 })

  const ok = await deletePostComment(commentId, fm.member_id!)
  if (!ok) return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
