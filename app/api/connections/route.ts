// app/api/connections/route.ts
// GET  — list this user's connections
// POST — send a connection request
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: fm } = await supabase
      .from('family_members')
      .select('member_id')
      .eq('supabase_auth_id', user.id)
      .single()

    if (!fm?.member_id) return NextResponse.json([], { status: 200 })

    const { data, error } = await (supabase as any)
      .from('member_connections')
      .select('*, connected_member:members!member_connections_connected_member_id_fkey(id, full_name, photo_url)')
      .eq('member_id', fm.member_id)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch (err) {
    console.error('[connections GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: fm } = await supabase
      .from('family_members')
      .select('member_id')
      .eq('supabase_auth_id', user.id)
      .single()

    if (!fm?.member_id) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

    const body = await req.json()
    const { connected_member_id } = body
    if (!connected_member_id) return NextResponse.json({ error: 'connected_member_id required' }, { status: 400 })

    const { data, error } = await (supabase as any)
      .from('member_connections')
      .insert({ member_id: fm.member_id, connected_member_id, status: 'pending' })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('[connections POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
