/**
 * app/api/fraud-flags/route.ts — Fraud Flags API
 * TC-FS002
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('fraud_flags')
    .select('*')
    .eq('member_supabase_auth_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ flags: [] })
  return NextResponse.json({ flags: data ?? [] })
}
