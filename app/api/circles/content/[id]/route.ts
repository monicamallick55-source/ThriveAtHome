// app/api/circles/content/[id]/route.ts
// PATCH — update (pin/unpin, edit, unpublish)
// DELETE — remove content item (staff only)

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { data: isStaff } = await supabase.rpc('is_staff')
  if (!isStaff) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update: Record<string, any> = {}
  if (body.title !== undefined) update.title = body.title
  if (body.body !== undefined) update.body = body.body
  if (body.url !== undefined) update.url = body.url
  if (body.image_url !== undefined) update.image_url = body.image_url
  if (body.source_name !== undefined) update.source_name = body.source_name
  if (body.tags !== undefined) update.tags = body.tags
  if (body.is_pinned !== undefined) update.is_pinned = body.is_pinned
  if (body.is_published !== undefined) update.is_published = body.is_published
  if (body.content_type !== undefined) update.content_type = body.content_type

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any as any
  const { data: item, error } = await db
    .from('circle_content_items')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { data: isStaff } = await supabase.rpc('is_staff')
  if (!isStaff) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any as any
  const { error } = await db
    .from('circle_content_items')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
