/**
 * app/api/service-requests/[id]/route.ts
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('service_requests')
    .select('*')
    .eq('id', id)
    .eq('member_id', user.id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json({ request: data })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { status, notes } = body

  const { data, error } = await supabase
    .from('service_requests')
    .update({ ...(status && { status }), ...(notes && { notes }) })
    .eq('id', id)
    .eq('member_id', user.id)
    .select()
    .single()

  if (error || !data) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json({ request: data })
}
