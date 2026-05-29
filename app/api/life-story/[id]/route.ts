import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { updateLifeStoryEntry, deleteLifeStoryEntry } from '@/lib/data/life-story'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  if (!fm?.member_id) return NextResponse.json({ error: 'No member linked' }, { status: 403 })

  const { id } = await params

  let body: { title?: string; content?: string; era?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { title, content, era } = body
  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: 'title and content are required' }, { status: 400 })
  }

  const { data, error } = await updateLifeStoryEntry({
    id,
    memberId: fm.member_id,
    title: title.trim(),
    content: content.trim(),
    era: era?.trim() || null,
  })

  if (error || !data) return NextResponse.json({ error: error || 'Not found' }, { status: 404 })
  return NextResponse.json({ entry: data })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  if (!fm?.member_id) return NextResponse.json({ error: 'No member linked' }, { status: 403 })

  const { id } = await params

  const { error } = await deleteLifeStoryEntry({ id, memberId: fm.member_id })
  if (error) return NextResponse.json({ error }, { status: 500 })

  return NextResponse.json({ success: true })
}
