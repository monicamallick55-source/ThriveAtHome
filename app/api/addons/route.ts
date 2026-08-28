// M26 — Premium Subscription Add-Ons: list the catalog + the member's add-ons, and purchase one.
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  getAddonCatalog,
  getMemberAddons,
  purchaseAddon,
  getEffectiveFamilySeatLimit,
  type PurchaseIntake,
} from '@/lib/data/premium-addons'
import type { PlanTier } from '@/types/database'

export const runtime = 'nodejs'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  const { data: catalog } = await getAddonCatalog()

  if (!fm?.member_id) {
    return NextResponse.json({ catalog, memberAddons: [], familySeatLimit: 3 })
  }
  const [{ data: memberAddons }, familySeatLimit] = await Promise.all([
    getMemberAddons(fm.member_id),
    getEffectiveFamilySeatLimit(fm.member_id),
  ])
  return NextResponse.json({ catalog, memberAddons, familySeatLimit })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  if (!fm?.member_id) {
    return NextResponse.json({ error: 'Please complete onboarding first.' }, { status: 400 })
  }

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  const { addon_key, intake } = body as Record<string, unknown>
  if (typeof addon_key !== 'string' || !addon_key.trim()) {
    return NextResponse.json({ error: 'Choose an add-on.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: member } = await admin
    .from('members')
    .select('preferred_name, plan_tier')
    .eq('id', fm.member_id)
    .maybeSingle()

  // Sanitise the optional intake payload
  const rawIntake = (intake && typeof intake === 'object' ? intake : {}) as Record<string, unknown>
  const cleanIntake: PurchaseIntake = {
    focusAreas: Array.isArray(rawIntake.focusAreas)
      ? (rawIntake.focusAreas as unknown[]).map((s) => String(s).slice(0, 80)).slice(0, 12)
      : undefined,
    preferredTimes:
      typeof rawIntake.preferredTimes === 'string' ? rawIntake.preferredTimes.trim().slice(0, 300) || null : undefined,
    household:
      rawIntake.household && typeof rawIntake.household === 'object'
        ? (rawIntake.household as Record<string, unknown>)
        : undefined,
    milestoneAge: rawIntake.milestoneAge != null ? Number(rawIntake.milestoneAge) : undefined,
    recipientName:
      typeof rawIntake.recipientName === 'string' ? rawIntake.recipientName.trim().slice(0, 120) || null : undefined,
    recipientAddress:
      typeof rawIntake.recipientAddress === 'string'
        ? rawIntake.recipientAddress.trim().slice(0, 400) || null
        : undefined,
    dedicationText:
      typeof rawIntake.dedicationText === 'string' ? rawIntake.dedicationText.trim().slice(0, 1000) || null : undefined,
    topic: typeof rawIntake.topic === 'string' ? rawIntake.topic.trim().slice(0, 500) || null : undefined,
    advisorId: typeof rawIntake.advisorId === 'string' && rawIntake.advisorId ? rawIntake.advisorId : null,
  }

  const { data, error } = await purchaseAddon({
    memberId: fm.member_id,
    addonKey: addon_key.trim(),
    purchasedBy: fm.id,
    memberPreferredName: member?.preferred_name ?? 'The member',
    memberPlanTier: (member?.plan_tier as PlanTier) ?? 'basics',
    intake: cleanIntake,
  })
  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json({ result: data }, { status: 201 })
}
