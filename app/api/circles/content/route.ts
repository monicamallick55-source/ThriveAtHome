// app/api/circles/content/route.ts
// GET  — list published content items for a circle
// POST — navigator/staff creates a content item

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const circleId = searchParams.get('circle_id')
  if (!circleId) return NextResponse.json({ error: 'circle_id required' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any as any

  const { data: items, error } = await db
    .from('circle_content_items')
    .select(`
      id, created_at, content_type, title, body, url, image_url,
      source_name, tags, is_pinned, published_at,
      posted_by_member:family_members(id, full_name:members(full_name, preferred_name))
    `)
    .eq('circle_id', circleId)
    .eq('is_published', true)
    .order('is_pinned', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: items ?? [] })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { data: isStaff } = await supabase.rpc('is_staff')
  if (!isStaff) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const {
    circle_id, content_type = 'article', title, body: itemBody,
    url, image_url, source_name, tags = [], is_pinned = false,
  } = body as {
    circle_id?: string; content_type?: string; title?: string; body?: string
    url?: string; image_url?: string; source_name?: string
    tags?: string[]; is_pinned?: boolean
  }

  if (!circle_id) return NextResponse.json({ error: 'circle_id required' }, { status: 400 })
  if (!title?.trim()) return NextResponse.json({ error: 'title required' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any as any

  // Get navigator's family_member id
  const { data: fm } = await supabase
    .from('family_members')
    .select('id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  const { data: item, error } = await db
    .from('circle_content_items')
    .insert({
      circle_id,
      posted_by: fm?.id ?? null,
      content_type,
      title: title.trim(),
      body: itemBody ?? null,
      url: url ?? null,
      image_url: image_url ?? null,
      source_name: source_name ?? null,
      tags,
      is_pinned,
      is_published: true,
      published_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item }, { status: 201 })
}
