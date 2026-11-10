import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
export async function GET(req: NextRequest) {
  try {
    const status = req.nextUrl.searchParams.get('status') ?? 'open'
    const admin = createAdminClient() as any
    let query = admin.from('support_tickets')
      .select('id,created_at,submitter_name,submitter_email,portal_type,category,priority,subject,description,status,assigned_to,sla_breach_at,resolved_at')
      .order('created_at', { ascending: false }).limit(100)
    if (status !== 'all') query = query.eq('status', status)
    const { data, error } = await query
    if (error) throw error
    return NextResponse.json({ tickets: data ?? [] })
  } catch (err) {
    console.error('GET /api/admin/support error:', err)
    return NextResponse.json({ tickets: [], error: 'Failed to load tickets' }, { status: 500 })
  }
}
