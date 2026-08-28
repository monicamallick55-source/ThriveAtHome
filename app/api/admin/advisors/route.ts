// Admin — trusted advisor directory management (Phase 98, M24).
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getUserRole } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/database'
import {
  getAllAdvisors,
  getAdvisorApplications,
  getDirectoryRevenueSummary,
} from '@/lib/data/advisors'

export const runtime = 'nodejs'

export async function GET() {
  const user = await requireAuth()
  const role = await getUserRole(user.id)
  if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const [advisors, applications, revenue] = await Promise.all([
    getAllAdvisors(),
    getAdvisorApplications(),
    getDirectoryRevenueSummary(),
  ])
  return NextResponse.json({
    advisors: advisors.data ?? [],
    applications: applications.data ?? [],
    revenue: revenue.data ?? null,
  })
}

/** Update an advisor listing (tier, status, accepting flag, expiry). */
export async function PATCH(req: NextRequest) {
  const user = await requireAuth()
  const role = await getUserRole(user.id)
  if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => null)
  const id = (body as Record<string, unknown> | null)?.id
  if (typeof id !== 'string') return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const allowed: Record<string, unknown> = {}
  const b = body as Record<string, unknown>
  for (const k of ['listing_tier', 'listing_status', 'accepts_new_clients', 'listing_fee_annual', 'listing_expires_at', 'notes']) {
    if (k in b) allowed[k] = b[k]
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('trusted_advisors')
    .update(allowed as Database['public']['Tables']['trusted_advisors']['Update'])
    .eq('id', id)
    .select('*')
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ advisor: data })
}
