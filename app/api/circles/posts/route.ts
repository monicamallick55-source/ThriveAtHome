import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { postToCircle, getCirclePosts } from '@/lib/data/circles'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const circleId = searchParams.get('circleId')
  if (!circleId) return NextResponse.json({ error: 'circleId required' }, { status: 400 })

  const posts = await getCirclePosts(circleId)
  return NextResponse.json({ posts })
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  if (!fm?.member_id) return NextResponse.json({ error: 'No member linked' }, { status: 403 })

  const { circleId, content } = await request.json()
  if (!circleId || !content?.trim()) {
    return NextResponse.json({ error: 'circleId and content required' }, { status: 400 })
  }

  const post = await postToCircle(fm.member_id, circleId, content.trim())
  if (!post) return NextResponse.json({ error: 'Failed to post' }, { status: 500 })

  return NextResponse.json({ post })
}
