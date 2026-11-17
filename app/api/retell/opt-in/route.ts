import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const opted_in = body.opted_in ?? true
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('members')
        .update({ aria_call_opted_in: opted_in, updated_at: new Date().toISOString() })
        .eq('supabase_auth_id', user.id)
    }
  } catch {}
  return NextResponse.json({ aria_call_opted_in: opted_in })
}
