/**
 * app/api/circle-content/route.ts — G5.6
 * GET  ?circle_id=UUID  — member/public content feed
 * POST               — admin/coordinator post content
 */
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const circleId = new URL(req.url).searchParams.get('circle_id')
    let query = supabase
      .from('circle_content')
      .select('*, community_orgs(name, membership_visibility)')
      .lte('publish_on', new Date().toISOString().split('T')[0])
      .order('publish_on', { ascending: false })
      .limit(50)

    if (circleId) query = query.eq('circle_id', circleId)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: staff } = await supabase
      .from('members')
      .select('id, org_id, role')
      .eq('supabase_auth_id', user.id)
      .single()
    if (!staff || !['admin', 'navigator', 'staff', 'coordinator'].includes(staff.role)) {
      return NextResponse.json({ error: 'Staff access required' }, { status: 403 })
    }

    const body = await req.json()
    const { circle_id, title, body: contentBody, media_url, source_url, publish_on } = body
    if (!circle_id || !title) {
      return NextResponse.json({ error: 'circle_id and title required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('circle_content')
      .insert({
        circle_id,
        org_id: staff.org_id,
        title,
        body: contentBody,
        media_url,
        source_url,
        publish_on: publish_on ?? new Date().toISOString().split('T')[0],
        created_by: staff.id,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
