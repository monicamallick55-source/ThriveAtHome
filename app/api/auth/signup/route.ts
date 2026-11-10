import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  if (!body.email || !body.password) {
    return NextResponse.json({ error: 'email and password required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: body.email,
    password: body.password,
    options: { data: { full_name: body.full_name ?? '', role: 'member' } },
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
