/**
 * app/api/org-admin/members/bulk/route.ts — 16.4 B2B Bulk Operations
 *
 * POST /api/org-admin/members/bulk
 * body: { member_ids: string[], action: 'deactivate' | 'reactivate' | 'resend_invite' | 'export' }
 */
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const VALID_ACTIONS = ['deactivate', 'reactivate', 'resend_invite', 'export'] as const
type BulkAction = typeof VALID_ACTIONS[number]

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: self } = await supabase
      .from('org_admins')
      .select('org_id, role')
      .eq('supabase_auth_id', user.id)
      .single()

    if (!self) return NextResponse.json({ error: 'Not an org admin' }, { status: 403 })
    if (self.role === 'viewer') return NextResponse.json({ error: 'Viewers cannot perform bulk operations' }, { status: 403 })

    const body = await req.json()
    const { member_ids, action }: { member_ids: string[]; action: BulkAction } = body

    if (!member_ids?.length) return NextResponse.json({ error: 'member_ids is required' }, { status: 400 })
    if (!VALID_ACTIONS.includes(action)) return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    if (member_ids.length > 500) return NextResponse.json({ error: 'Max 500 members per bulk operation' }, { status: 400 })

    // Verify all members belong to this org
    const { data: verified } = await supabase
      .from('members')
      .select('id')
      .in('id', member_ids)
      .eq('org_id', self.org_id)

    const verifiedIds = (verified ?? []).map(m => m.id)
    if (verifiedIds.length !== member_ids.length) {
      return NextResponse.json({ error: 'Some member IDs are invalid or do not belong to your organization' }, { status: 400 })
    }

    let result: any = {}

    switch (action) {
      case 'deactivate': {
        const { error } = await supabase
          .from('members')
          .update({ status: 'inactive', deactivated_at: new Date().toISOString(), deactivated_by: user.id })
          .in('id', verifiedIds)
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        result = { deactivated: verifiedIds.length }
        break
      }

      case 'reactivate': {
        const { error } = await supabase
          .from('members')
          .update({ status: 'active', deactivated_at: null, deactivated_by: null })
          .in('id', verifiedIds)
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        result = { reactivated: verifiedIds.length }
        break
      }

      case 'resend_invite': {
        // Queue re-send of welcome/invitation emails via notifications table
        const notifications = verifiedIds.map(memberId => ({
          type: 'resend_invite',
          related_id: memberId,
          triggered_by: user.id,
          org_id: self.org_id,
          status: 'queued',
          created_at: new Date().toISOString(),
        }))
        const { error } = await supabase.from('email_queue').insert(notifications)
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        result = { invites_queued: verifiedIds.length }
        break
      }

      case 'export': {
        // Return member data for CSV export
        const { data: exportData, error } = await supabase
          .from('members')
          .select('id, first_name, last_name, email, phone, status, date_of_birth, created_at, last_active_at')
          .in('id', verifiedIds)
          .order('last_name')

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })

        const headers = ['first_name', 'last_name', 'email', 'phone', 'status', 'date_of_birth', 'joined_at', 'last_active']
        const rows = (exportData ?? []).map(m => [
          m.first_name, m.last_name, m.email ?? '', m.phone ?? '',
          m.status, m.date_of_birth ?? '', m.created_at?.slice(0, 10) ?? '',
          m.last_active_at?.slice(0, 10) ?? '',
        ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))

        const csv = [headers.join(','), ...rows].join('\n')
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="members-export-${new Date().toISOString().slice(0, 10)}.csv"`,
          },
        })
      }
    }

    // Log bulk action
    await supabase.from('org_audit_log').insert({
      org_id: self.org_id,
      actor_id: user.id,
      action: `bulk_${action}`,
      target_ids: verifiedIds,
      created_at: new Date().toISOString(),
    }).then(() => {}) // fire-and-forget

    return NextResponse.json({ ok: true, action, ...result })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
