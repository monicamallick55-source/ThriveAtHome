// app/api/admin/home-safety/volunteers/route.ts
// GET  — list volunteers for a program
// POST — add a volunteer to a program

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function resolveAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
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

export async function GET(req: Request) {
  const supabase = await createClient()
  const staff = await resolveAdmin(supabase)
  if (!staff) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const programId = searchParams.get('program_id')
  if (!programId) return NextResponse.json({ error: 'program_id required' }, { status: 400 })

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from('safety_program_volunteers')
    .select(`
      *,
      volunteer:members(id, full_name, preferred_name, phone)
    `)
    .eq('program_id', programId)
    .order('created_at')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const staff = await resolveAdmin(supabase)
  if (!staff) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const { program_id, volunteer_id, max_households } = body

  if (!program_id) return NextResponse.json({ error: 'program_id required' }, { status: 400 })
  if (!volunteer_id) return NextResponse.json({ error: 'volunteer_id required' }, { status: 400 })

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from('safety_program_volunteers')
    .insert({
      program_id,
      volunteer_id,
      max_households: max_households ?? 5,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Volunteer already added to this program' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data, { status: 201 })
}
