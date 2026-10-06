import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const profileId = searchParams.get('profile_id')
  let query = supabase
    .from('encore_applications')
    .select('*, encore_opportunities(title, org_name, opportunity_type, city, state)')
    .order('created_at', { ascending: false })
  if (profileId) query = query.eq('encore_profile_id', profileId)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const body = await req.json()
  const { data, error } = await supabase
    .from('encore_applications')
    .insert(body)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
