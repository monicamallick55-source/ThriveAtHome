/**
 * app/api/org-imports/[id]/route.ts — G4.1
 *
 * GET   /api/org-imports/[id]              — fetch single job
 * PATCH /api/org-imports/[id]              — update mapping / trigger dry-run or run
 *   body: { column_mapping?, action?: 'dry_run' | 'run' | 'cancel', hv_sync_enabled? }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// HV field → Thrive field mapping suggestions
const HV_FIELD_SUGGESTIONS: Record<string, string> = {
  'First Name':       'first_name',
  'Last Name':        'last_name',
  'Email':            'email',
  'Phone':            'phone',
  'Address':          'address_line1',
  'City':             'city',
  'State':            'state',
  'Zip':              'zip_code',
  'Zip Code':         'zip_code',
  'Birthday':         'date_of_birth',
  'Date of Birth':    'date_of_birth',
  'Gender':           'gender',
  'Emergency Contact':'emergency_contact_name',
  'Notes':            'notes',
  'Member Since':     'member_since',
  'Status':           'status',
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('org_import_jobs')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json({ job: data, hv_field_suggestions: HV_FIELD_SUGGESTIONS })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { column_mapping, action, hv_sync_enabled } = body

  // Fetch current job
  const { data: job, error: fetchErr } = await supabase
    .from('org_import_jobs')
    .select('*')
    .eq('id', params.id)
    .single()

  if (fetchErr || !job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  if (action === 'cancel') {
    const { data, error } = await supabase
      .from('org_import_jobs')
      .update({ status: 'cancelled' })
      .eq('id', params.id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ job: data })
  }

  if (action === 'dry_run') {
    // Stub: in production this would trigger a background worker to validate CSV rows
    // For now, simulate a dry-run result
    const dryRunResult = {
      valid_count: 0,
      error_count: 0,
      errors: [],
      message: 'Dry run queued — results will appear within 60 seconds (stub: returns immediately in dev)',
    }
    const { data, error } = await supabase
      .from('org_import_jobs')
      .update({
        status: 'dry_run',
        column_mapping: column_mapping ?? job.column_mapping,
        dry_run_result: dryRunResult,
        started_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ job: data })
  }

  if (action === 'run') {
    if (job.status !== 'dry_run') {
      return NextResponse.json({ error: 'Must complete dry run before running import' }, { status: 400 })
    }
    // Stub: in production triggers background worker
    const { data, error } = await supabase
      .from('org_import_jobs')
      .update({
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ job: data, message: 'Import queued — check back in a few minutes' })
  }

  // Default: update mapping / sync settings
  const updates: Record<string, unknown> = {}
  if (column_mapping !== undefined) updates.column_mapping = column_mapping
  if (hv_sync_enabled !== undefined) updates.hv_sync_enabled = hv_sync_enabled
  if (column_mapping !== undefined && job.status === 'pending') updates.status = 'mapping'

  const { data, error } = await supabase
    .from('org_import_jobs')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ job: data })
}
