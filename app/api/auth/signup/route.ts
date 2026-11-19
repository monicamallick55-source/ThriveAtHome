import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { emailProvider } from '@/lib/services/ResendEmailProvider'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  if (!body.email || !body.password) {
    return NextResponse.json({ error: 'email and password required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email: body.email,
    password: body.password,
    options: { data: { full_name: body.full_name ?? '', role: 'member' } },
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Send welcome email
  try {
    await emailProvider.sendWelcome(body.email, body.full_name ?? 'there')
  } catch (e) {
    console.error('Welcome email failed:', e)
  }

  return NextResponse.json({ ok: true })
}
