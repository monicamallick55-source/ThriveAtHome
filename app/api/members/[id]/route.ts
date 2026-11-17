import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await context.params
  const { data, error } = await supabase.from('members').select('*').eq('id', id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  const parts = (data.full_name || '').split(' ')
  return NextResponse.json({ ...data, first_name: parts[0] || '', last_name: parts.slice(1).join(' ') || '' })
}
