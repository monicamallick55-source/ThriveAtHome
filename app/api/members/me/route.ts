import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('members')
    .select('*')
    .or(`supabase_auth_id.eq.${user.id},auth_id.eq.${user.id}`)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  // Derive first_name/last_name from full_name for API consumers
  const parts = (data.full_name || '').split(' ')
  return NextResponse.json({ ...data, first_name: parts[0] || '', last_name: parts.slice(1).join(' ') || '' })
}
