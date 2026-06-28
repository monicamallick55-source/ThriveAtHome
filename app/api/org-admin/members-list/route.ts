import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOrgForAdmin, getOrgMembers } from '@/lib/data/communityOrgs'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: org, error: orgError } = await getOrgForAdmin(user.id)
  if (orgError || !org) return NextResponse.json({ error: orgError ?? 'No org found' }, { status: 404 })

  const { data, error } = await getOrgMembers(org.id)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ data })
}
