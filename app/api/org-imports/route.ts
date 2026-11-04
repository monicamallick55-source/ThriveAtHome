/**
 * app/api/org-imports/route.ts — G4.1 Helpful Village CSV Importer
 *
 * GET  /api/org-imports?org_id=<id>   — list import jobs for an org
 * POST /api/org-imports               — create a new import job (upload CSV)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const orgId = searchParams.get('org_id')
  if (!orgId) return NextResponse.json({ error: 'org_id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('org_import_jobs')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ jobs: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { org_id, filename, source = 'helpful_village', column_mapping = {}, hv_sync_enabled = false } = body

  if (!org_id || !filename) {
    return NextResponse.json({ error: 'org_id and filename required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('org_import_jobs')
    .insert({
      org_id,
      created_by: user.id,
      source,
      filename,
      status: 'pending',
      column_mapping,
      hv_sync_enabled,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ job: data }, { status: 201 })
}
