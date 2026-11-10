import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { status, assigned_to, resolution_notes } = await req.json()
    const admin = createAdminClient() as any
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (status) update.status = status
    if (assigned_to) update.assigned_to = assigned_to
    if (resolution_notes) update.resolution_notes = resolution_notes
    if (status === 'resolved' || status === 'closed') update.resolved_at = new Date().toISOString()
    const { error } = await admin.from('support_tickets').update(update).eq('id', params.id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('PATCH /api/admin/support/[id] error:', err)
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 })
  }
}
