// Member document view API — returns org documents shared with members (visibility='members')
// and member-specific docs (scope='member') for the authenticated member.
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // Get member and org_id — direct-auth senior first, then family_members linkage
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: directMember } = await (admin.from as any)('members')
    .select('id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  const { data: fm } = await admin
    .from('family_members')
    .select('member_id, org_id, role')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  const memberId: string | null = directMember?.id ?? fm?.member_id ?? null
  const orgId: string | null = fm?.org_id ?? null

  if (!memberId) {
    return NextResponse.json({ data: [] })
  }

  const selectCols = 'id, created_at, title, description, file_name, file_type, file_size_bytes, category, scope, uploaded_by_name'

  // Fetch org-shared documents + member-specific documents
  const queries: Promise<{ data: unknown[] | null; error: unknown }>[] = []

  // Org-shared documents (visibility='members')
  if (orgId) {
    queries.push(
      (admin.from as any)('platform_documents')
        .select(selectCols)
        .eq('org_id', orgId)
        .eq('visibility', 'members')
        .order('created_at', { ascending: false })
    )
  }

  // Member-specific documents visible to family
  queries.push(
    (admin.from as any)('platform_documents')
      .select(selectCols)
      .eq('member_id', memberId)
      .eq('scope', 'member')
      .in('visibility', ['members', 'care_team'])
      .order('created_at', { ascending: false })
  )

  const results = await Promise.all(queries)
  const allDocs = results.flatMap(r => (r.data ?? []) as Record<string, unknown>[])

  return NextResponse.json({ data: allDocs })
}
