import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const NAMES = ['Book Club','Gardening','Music Appreciation','Art & Crafts','Walking Group',
  'Cooking Circle','Chess Club','Photography','History Buffs','Travel Stories',
  'Technology Help','Yoga & Wellness','Bird Watching','Knitting & Sewing','Dance',
  'Movie Club','Creative Writing','Nature Walks','Language Learning','Volunteering Together',
  'Faith & Reflection','Veterans Connect','Crafts & Hobbies','Health & Wellness']

const STUB_CIRCLES = NAMES.map((name, i) => ({
  id: String(i + 1), name,
  category: ['culture','hobbies','wellness','learning','social'][i % 5],
  member_count: 10 + (i * 3 % 40), tags: [], joined: false,
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
