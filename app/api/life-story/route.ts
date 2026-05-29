import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { createLifeStoryEntry, getLifeStoryEntries } from '@/lib/data/life-story'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  if (!fm?.member_id) return NextResponse.json({ error: 'No member linked' }, { status: 403 })

  const { data, error } = await getLifeStoryEntries(fm.member_id)
  if (error) return NextResponse.json({ error }, { status: 500 })

  return NextResponse.json({ entries: data ?? [] })
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  if (!fm?.member_id) return NextResponse.json({ error: 'No member linked' }, { status: 403 })

  let body: { title?: string; content?: string; era?: string; entry_type?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { title, content, era, entry_type } = body
  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: 'title and content are required' }, { status: 400 })
  }

  const { data, error } = await createLifeStoryEntry({
    memberId: fm.member_id,
    title: title.trim(),
    content: content.trim(),
    era: era?.trim() || null,
    entryType: entry_type || 'memory',
    createdBy: fm.id,
  })

  if (error || !data) return NextResponse.json({ error: error || 'Failed to create entry' }, { status: 500 })
  return NextResponse.json({ entry: data }, { status: 201 })
}
