// app/api/fraud-flags/route.ts
// G7.1 Fraud & Scam Protection
//
// GET  — navigator/admin: list open fraud flags (with member context)
// POST — navigator or family: manually create a fraud flag

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createFraudFlag } from '@/lib/fraud/flagService'
import type { ScamType, Severity } from '@/lib/fraud/detect'

const VALID_SCAM_TYPES: ScamType[] = [
  'gift_card', 'government_impersonation', 'grandparent', 'romance',
  'tech_support', 'lottery_prize', 'investment_crypto', 'charity',
  'large_purchase', 'other',
]

// ── Auth helpers ──────────────────────────────────────────────────────────────

async function resolveUser(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: fm } = await supabase
    .from('family_members')
    .select('id, member_id, role')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()
  if (fm) return { familyMemberId: fm.id as string, memberId: fm.member_id as string, role: fm.role as string }

  const { data: m } = await supabase
    .from('members')
    .select('id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()
  if (m) return { familyMemberId: null, memberId: m.id as string, role: 'member' }

  return null
}

// ── GET /api/fraud-flags ── navigator/admin view ───────────────────────────

export async function GET(req: Request) {
  const supabase = await createClient()
  const ctx = await resolveUser(supabase)
  if (!ctx) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  if (ctx.role !== 'admin' && ctx.role !== 'navigator') {
    return NextResponse.json({ error: 'Navigator or admin required' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? 'open'
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 100)

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('fraud_flags')
    .select(`
      id, created_at, member_id, source, source_id, scam_type,
      matched_text, severity, status, family_notified_at,
      members!inner(full_name, phone)
    `)
    .eq('status', status)
    .order('severity', { ascending: false })    // urgent first
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ flags: data })
}

// ── POST /api/fraud-flags ── manual report ─────────────────────────────────

export async function POST(req: Request) {
  const supabase = await createClient()
  const ctx = await resolveUser(supabase)
  if (!ctx) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const isStaff = ctx.role === 'admin' || ctx.role === 'navigator'
  const isFamily = ctx.role === 'family_primary' || ctx.role === 'family_secondary'

  if (!isStaff && !isFamily) {
    return NextResponse.json({ error: 'Not authorised' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const memberIdTarget: string | null = typeof body?.memberId === 'string' ? body.memberId : null
  const scamType: unknown = body?.scamType
  const excerpt: unknown = body?.excerpt
  const severity: Severity = body?.severity === 'urgent' ? 'urgent' : 'concern'
  const notes: string | null = typeof body?.notes === 'string' ? body.notes.slice(0, 500) : null

  if (!memberIdTarget) {
    return NextResponse.json({ error: 'memberId required' }, { status: 400 })
  }
  if (!VALID_SCAM_TYPES.includes(scamType as ScamType)) {
    return NextResponse.json({ error: 'Invalid scamType' }, { status: 400 })
  }
  if (excerpt !== null && excerpt !== undefined && (typeof excerpt !== 'string' || (excerpt as string).length > 200)) {
    return NextResponse.json({ error: 'excerpt must be ≤200 chars' }, { status: 400 })
  }

  // Family can only flag for their own member
  if (isFamily && memberIdTarget !== ctx.memberId) {
    return NextResponse.json({ error: 'Can only flag for your own member' }, { status: 403 })
  }

  const source = isStaff ? 'navigator' : 'family'

  const flagId = await createFraudFlag({
    memberId: memberIdTarget,
    source,
    match: {
      scamType: scamType as ScamType,
      severity,
      excerpt: (excerpt as string | null) ?? (notes ?? ''),
    },
  })

  if (!flagId) {
    return NextResponse.json({ error: 'Failed to create flag' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, flagId }, { status: 201 })
}
