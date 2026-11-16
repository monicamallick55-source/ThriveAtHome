import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const newStatus = body.action === 'verify' ? 'verified' : body.action === 'reject' ? 'rejected' : body.status || 'active'
  const { data } = await supabase.from('university_affiliates').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', params.id).select().single().catch(() => ({ data: null }))
  return NextResponse.json(data || { id: params.id, status: newStatus, updated_at: new Date().toISOString() })
}
