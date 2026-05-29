import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { getMemberById } from '@/lib/data/members'
import { createMemoryBook, upsertDraft, getMemoryBooks } from '@/lib/data/life-story'

// GET — list all memory books (including drafts) for the auth user's member
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  if (!fm?.member_id) return NextResponse.json({ error: 'No member linked' }, { status: 404 })

  const { data: books, error } = await getMemoryBooks(fm.member_id)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ books: books ?? [] })
}

// POST — create a new memory book record, OR save/update a draft
export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  if (!fm?.member_id) return NextResponse.json({ error: 'No member linked' }, { status: 404 })

  const { data: member } = await getMemberById(fm.member_id)
  const planTier = member?.plan_tier ?? 'basics'
  const isFree = planTier === 'complete' || planTier === 'premier'

  let body: {
    title?: string
    dedication?: string
    layoutStyle?: string
    formatType?: string
    entryIds?: string[]
    coverPhotoPath?: string | null
    paymentToken?: string
    status?: string
    purchaseDate?: string | null
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const isDraft = body.status === 'draft'

  // Draft: upsert (create or update existing draft)
  if (isDraft) {
    const { data: book, error } = await upsertDraft({
      memberId: fm.member_id,
      title: body.title || `${member?.preferred_name ?? 'My'}'s Memory Book`,
      dedication: body.dedication || null,
      formatType: body.formatType || 'memory_book',
      layoutStyle: body.layoutStyle || 'classic',
      entryIds: body.entryIds || [],
      coverPhotoPath: body.coverPhotoPath || null,
    })
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ book, memberId: fm.member_id, isDraft: true })
  }

  // For paid plans, require a payment token unless bypassed in dev
  if (!isFree && !body.paymentToken && process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Payment required', paymentRequired: true }, { status: 402 })
  }

  const { data: book, error } = await createMemoryBook({
    memberId: fm.member_id,
    title: body.title || `${member?.preferred_name ?? 'My'}'s Memory Book`,
    dedication: body.dedication || null,
    layoutStyle: body.layoutStyle || 'classic',
    formatType: body.formatType || 'memory_book',
    entryIds: body.entryIds || [],
    coverPhotoPath: body.coverPhotoPath || null,
    status: 'pending',
    purchaseDate: body.purchaseDate || null,
  })

  if (error) return NextResponse.json({ error }, { status: 500 })

  return NextResponse.json({
    book,
    memberId: fm.member_id,
    isFree,
    planTier,
  })
}
