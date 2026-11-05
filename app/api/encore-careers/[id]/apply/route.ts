/**
 * app/api/encore-careers/[id]/apply/route.ts
 * POST /api/encore-careers/[id]/apply — member applies for an encore career opportunity
 */
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: member } = await supabase.from('members').select('id').eq('supabase_auth_id', user.id).single()
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

    // Check opportunity exists and is open
    const { data: opp } = await supabase.from('encore_career_opportunities').select('id, status').eq('id', id).single()
    if (!opp || opp.status !== 'open') return NextResponse.json({ error: 'Opportunity not found or closed' }, { status: 404 })

    // Check not already applied
    const { data: existing } = await supabase.from('encore_career_applications').select('id').eq('member_id', member.id).eq('opportunity_id', id).single()
    if (existing) return NextResponse.json({ error: 'Already applied' }, { status: 409 })

    const body = await req.json().catch(() => ({}))
    const { cover_note } = body

    const { data, error } = await supabase.from('encore_career_applications').insert({
      member_id: member.id,
      opportunity_id: id,
      cover_note: cover_note ?? null,
      status: 'submitted',
      applied_at: new Date().toISOString(),
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ application: data }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
