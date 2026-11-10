import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const STUB_CIRCLES = Array.from({ length: 24 }, (_, i) => ({
  id: String(i + 1),
  name: ['Book Club', 'Gardening', 'Music', 'Art', 'Walking', 'Cooking', 'Chess', 'Photography',
         'History', 'Travel', 'Technology', 'Yoga', 'Bird Watching', 'Knitting', 'Dance',
         'Movie Club', 'Writing', 'Nature', 'Languages', 'Volunteering', 'Faith', 'Veterans',
         'Crafts', 'Health & Wellness'][i],
  category: ['culture','hobbies','wellness','learning','social'][i % 5],
  member_count: 10 + (i * 3 % 40),
  tags: [],
  joined: false,
}))

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ circles: [] })
  return NextResponse.json({ circles: STUB_CIRCLES, total: STUB_CIRCLES.length })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ ok: true })
}
