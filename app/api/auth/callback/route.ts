// Supabase Auth callback — exchanges a one-time code for a user session.
// Required by Supabase Auth for magic-link and OAuth flows.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    console.error('[api/auth/callback] exchangeCodeForSession failed:', error)
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
