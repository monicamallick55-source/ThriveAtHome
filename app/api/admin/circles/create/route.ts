import { NextResponse } from 'next/server'
import { getCurrentUser, getUserRole } from '@/lib/auth'
import { createCommunityCircle } from '@/lib/data/circles'

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = await getUserRole(user.id)
  if (role !== 'admin' && role !== 'navigator') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { circle_name, description, primary_language, interest_tag } = body

  if (!circle_name || typeof circle_name !== 'string' || !circle_name.trim()) {
    return NextResponse.json({ error: 'circle_name is required' }, { status: 400 })
  }
  if (!description || typeof description !== 'string' || !description.trim()) {
    return NextResponse.json({ error: 'description is required' }, { status: 400 })
  }

  const circle = await createCommunityCircle({
    circle_name: (circle_name as string).trim(),
    description: (description as string).trim(),
    primary_language: typeof primary_language === 'string' && primary_language.trim()
      ? primary_language.trim()
      : 'english',
    interest_tag: typeof interest_tag === 'string' && interest_tag.trim()
      ? interest_tag.trim()
      : null,
  })

  if (!circle) return NextResponse.json({ error: 'Failed to create community' }, { status: 500 })

  return NextResponse.json({ circle })
}
