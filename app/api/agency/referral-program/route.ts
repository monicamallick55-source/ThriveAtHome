// Agency Referral Partner Program API (Phase 78)
// GET: returns referral links + referred members for the agency
// POST: generates a new referral link
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function getAgencyAdmin() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  const admin = createAdminClient()
  const { data: fm } = await admin
    .from('family_members')
    .select('role, agency_id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()
  if (!fm || fm.role !== 'agency_admin' || !fm.agency_id) return null
  return { admin, agencyId: fm.agency_id as string }
}

function generateCode(agencyId: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const rand = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `AGY-${rand}`
}

export async function GET() {
  const ctx = await getAgencyAdmin()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { admin, agencyId } = ctx

  // Get referral links
  const { data: links } = await (admin as any)
    .from('agency_referral_links')
    .select('id, referral_code, referral_fee_cents, total_referrals, total_fees_earned_cents, is_active, created_at')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false })

  // Get referred family members (those with referring_agency_id = this agency)
  const { data: referredFamilyMembers } = await admin
    .from('family_members')
    .select('id, full_name, created_at, member_id, role')
    .eq('referring_agency_id', agencyId)
    .order('created_at', { ascending: false })
    .limit(50)

  // Enrich with member plan_tier if they've completed onboarding
  const memberIds = (referredFamilyMembers ?? [])
    .filter((fm: { member_id: string | null }) => fm.member_id != null)
    .map((fm: { member_id: string | null }) => fm.member_id as string)

  let memberPlans: Record<string, string> = {}
  if (memberIds.length > 0) {
    const { data: plans } = await admin
      .from('members')
      .select('id, plan_tier')
      .in('id', memberIds)
    for (const p of (plans ?? []) as { id: string; plan_tier: string }[]) {
      memberPlans[p.id] = p.plan_tier
    }
  }

  const referred = (referredFamilyMembers ?? []).map((fm: { id: string; full_name: string; created_at: string; member_id: string | null }) => ({
    id: fm.id,
    full_name: fm.full_name,
    joined_at: fm.created_at,
    has_member_profile: !!fm.member_id,
    plan_tier: fm.member_id ? (memberPlans[fm.member_id] ?? null) : null,
    referral_fee_status: fm.member_id ? 'pending' : 'not_yet',
  }))

  const totalFeesCents = (links ?? []).reduce((sum: number, l: { total_fees_earned_cents: number }) => sum + (l.total_fees_earned_cents ?? 0), 0)

  return NextResponse.json({ links: links ?? [], referred, total_referred: referred.length, total_fees_earned_cents: totalFeesCents })
}

export async function POST(req: NextRequest) {
  const ctx = await getAgencyAdmin()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { admin, agencyId } = ctx

  let body: { referral_fee_cents?: number } = {}
  try { body = await req.json() } catch { /* use defaults */ }

  const referralCode = generateCode(agencyId)
  const feeCents = body.referral_fee_cents ?? 3500

  const { data: link, error } = await (admin as any)
    .from('agency_referral_links')
    .insert({ agency_id: agencyId, referral_code: referralCode, referral_fee_cents: feeCents })
    .select('id, referral_code, referral_fee_cents, total_referrals, total_fees_earned_cents, is_active, created_at')
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ link }, { status: 201 })
}
