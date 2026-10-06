import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: fm } = await supabase.from('family_members').select('member_id').eq('supabase_auth_id', user.id).single()
  if (!fm?.member_id) return NextResponse.json({ error: 'Not found' }, { status: 403 })
  const { data, error } = await supabase.from('veterans_profiles').select('*, vso_chapters(*)').eq('member_id', fm.member_id).single()
  if (error && error.code !== 'PGRST116') return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? null)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: fm } = await supabase.from('family_members').select('member_id').eq('supabase_auth_id', user.id).single()
  if (!fm?.member_id) return NextResponse.json({ error: 'Not found' }, { status: 403 })
  const body = await req.json()
  const { data, error } = await supabase
    .from('veterans_profiles')
    .upsert({ ...body, member_id: fm.member_id }, { onConflict: 'member_id' })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
