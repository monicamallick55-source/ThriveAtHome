import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: volunteers, error } = await supabase.from('volunteers').select('id, first_name, last_name, bio, interests, languages, availability').eq('status', 'active').limit(10)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const ranked = (volunteers ?? []).map((v: any) => ({ ...v, match_score: (v.interests?.length ?? 0) * 10 + Math.random() * 5 })).sort((a: any, b: any) => b.match_score - a.match_score)
  return NextResponse.json({ volunteers: ranked, total: ranked.length })
}
