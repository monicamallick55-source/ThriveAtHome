import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') ?? 'open'
    const category = searchParams.get('category')
    const zip = searchParams.get('zip')
    const myApps = searchParams.get('my_applications') === 'true'
    const { data: { user } } = await supabase.auth.getUser()
    if (myApps && user) {
      const { data: applications, error } = await supabase
        .from('volunteer_applications')
        .select('id, opportunity_id, status, created_at, volunteer:volunteers(id, member_id)')
        .eq('volunteer.user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ applications: applications ?? [] })
    }
    let query = supabase.from('volunteer_opportunities')
      .select('id, title, description, category, required_specialty, zip_code, schedule_text, commitment_hours_per_week, status, filled_at, created_at')
      .order('created_at', { ascending: false })
    if (status !== 'all') query = query.eq('status', status)
    if (category) query = query.eq('category', category)
    if (zip) query = query.eq('zip_code', zip)
    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ opportunities: data ?? [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()
    const { title, description, category, required_specialty, zip_code, schedule_text, commitment_hours_per_week } = body
    if (!title || !category) return NextResponse.json({ error: 'title and category are required' }, { status: 400 })
    const { data, error } = await supabase.from('volunteer_opportunities')
      .insert({ title, description, category, required_specialty: required_specialty ?? null, zip_code: zip_code ?? null, schedule_text: schedule_text ?? null, commitment_hours_per_week: commitment_hours_per_week ?? null, status: 'open', created_by: user.id })
      .select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ opportunity: data }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
