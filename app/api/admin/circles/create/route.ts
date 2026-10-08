// app/api/admin/circles/create/route.ts
// POST — admin creates a new cultural circle.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function resolveAdminContext(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: fm } = await supabase
    .from('family_members')
    .select('id, role')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()
  if (!fm || fm.role !== 'admin') return null
  return fm
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const staff = await resolveAdminContext(supabase)
  if (!staff) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const body = await req.json().catch(() => ({}))

  const {
    circle_name, description, community_type, primary_language,
    image_placeholder, interest_tag, membership_visibility,
  } = body as Record<string, string | undefined>

  if (!circle_name?.trim()) {
    return NextResponse.json({ error: 'circle_name is required' }, { status: 400 })
  }

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from('cultural_circles')
    .insert({
      circle_name: circle_name.trim(),
      description: description?.trim() || null,
      community_type: community_type?.trim() || null,
      primary_language: primary_language?.trim() || null,
      image_placeholder: image_placeholder?.trim() || null,
      interest_tag: interest_tag?.trim() || null,
      membership_visibility: membership_visibility?.trim() || 'public',
      is_active: true,
      member_count: 0,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
