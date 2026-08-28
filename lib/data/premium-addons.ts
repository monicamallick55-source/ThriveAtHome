// M26 — Premium Subscription Add-Ons data layer (server-side, admin client).
// Every purchase is recorded in member_addons; real payment is still stubbed
// (StubBillingProvider). Fulfillment add-ons also create the downstream row
// (care planning session, benefits deep-dive, memory book order, legal consult)
// and a navigator task so the care team picks it up.
import { createAdminClient } from '../supabase/admin'
import { pushRealtimeNotification } from '../realtime/notifications'
import type {
  PremiumAddonRow,
  MemberAddonRow,
  CaregiverVideoDiaryEntryRow,
  PlanTier,
  TaskPriority,
} from '../../types/database'

/** Base number of family dashboard seats before any add-on. */
export const BASE_FAMILY_SEATS = 3

const PLAN_RANK: Record<PlanTier, number> = { basics: 0, connect: 1, complete: 2, premier: 3 }

export type MemberAddonWithCatalog = MemberAddonRow & {
  addon_name: string
  addon_tagline: string | null
  fulfillment: string
}

/** All active add-ons in the catalog, sorted for display. */
export async function getAddonCatalog(): Promise<{ data: PremiumAddonRow[]; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('premium_addons')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
    if (error) {
      console.error('[data/premium-addons/getAddonCatalog]', error)
      return { data: [], error: error.message }
    }
    return { data: data ?? [], error: null }
  } catch (e) {
    console.error('[data/premium-addons/getAddonCatalog] Unexpected error:', e)
    return { data: [], error: e instanceof Error ? e.message : String(e) }
  }
}

/** Every add-on a member has ever purchased, newest first, with catalog fields joined. */
export async function getMemberAddons(
  memberId: string
): Promise<{ data: MemberAddonWithCatalog[]; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('member_addons')
      .select('*, premium_addons(name, tagline, fulfillment)')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false })
    if (error) {
      console.error('[data/premium-addons/getMemberAddons]', error)
      return { data: [], error: error.message }
    }
    const rows = (data ?? []).map((r) => {
      const cat = (r as unknown as { premium_addons: { name: string; tagline: string | null; fulfillment: string } | null }).premium_addons
      return {
        ...(r as MemberAddonRow),
        addon_name: cat?.name ?? (r as MemberAddonRow).addon_key,
        addon_tagline: cat?.tagline ?? null,
        fulfillment: cat?.fulfillment ?? 'feature',
      }
    })
    return { data: rows, error: null }
  } catch (e) {
    console.error('[data/premium-addons/getMemberAddons] Unexpected error:', e)
    return { data: [], error: e instanceof Error ? e.message : String(e) }
  }
}

/** True when the member currently holds an active add-on with this key. */
export async function hasActiveAddon(memberId: string, addonKey: string): Promise<boolean> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('member_addons')
      .select('id')
      .eq('member_id', memberId)
      .eq('addon_key', addonKey)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle()
    if (error) {
      console.error('[data/premium-addons/hasActiveAddon]', error)
      return false
    }
    return Boolean(data)
  } catch (e) {
    console.error('[data/premium-addons/hasActiveAddon] Unexpected error:', e)
    return false
  }
}

/** Base seats + the family_seat_bonus of every active add-on the member holds. */
export async function getEffectiveFamilySeatLimit(memberId: string): Promise<number> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('member_addons')
      .select('addon_id, premium_addons(family_seat_bonus)')
      .eq('member_id', memberId)
      .eq('status', 'active')
    if (error) {
      console.error('[data/premium-addons/getEffectiveFamilySeatLimit]', error)
      return BASE_FAMILY_SEATS
    }
    const bonus = (data ?? []).reduce((sum, r) => {
      const b = (r as unknown as { premium_addons: { family_seat_bonus: number } | null }).premium_addons?.family_seat_bonus ?? 0
      return sum + b
    }, 0)
    return BASE_FAMILY_SEATS + bonus
  } catch (e) {
    console.error('[data/premium-addons/getEffectiveFamilySeatLimit] Unexpected error:', e)
    return BASE_FAMILY_SEATS
  }
}

export interface MemberAddonSummary {
  activeCount: number
  monthlyTotalCents: number
  activeKeys: string[]
  pendingFulfillment: { addon_key: string; addon_name: string; status: string; created_at: string }[]
}

/** Compact summary for the navigator member-detail panel. */
export async function getMemberAddonSummary(memberId: string): Promise<MemberAddonSummary> {
  const empty: MemberAddonSummary = { activeCount: 0, monthlyTotalCents: 0, activeKeys: [], pendingFulfillment: [] }
  try {
    const { data } = await getMemberAddons(memberId)
    const active = data.filter((r) => r.status === 'active')
    const pending = data.filter((r) => r.status === 'pending')
    return {
      activeCount: active.length,
      monthlyTotalCents: active
        .filter((r) => r.billing === 'monthly')
        .reduce((s, r) => s + (r.price_cents ?? 0), 0),
      activeKeys: active.map((r) => r.addon_key),
      pendingFulfillment: pending.map((r) => ({
        addon_key: r.addon_key,
        addon_name: r.addon_name,
        status: r.status,
        created_at: r.created_at,
      })),
    }
  } catch (e) {
    console.error('[data/premium-addons/getMemberAddonSummary] Unexpected error:', e)
    return empty
  }
}

export interface PurchaseIntake {
  // annual_care_planning
  focusAreas?: string[]
  preferredTimes?: string | null
  // benefits_maximizer_deep_dive
  household?: Record<string, unknown>
  // milestone_birthday_memory_book
  milestoneAge?: number
  recipientName?: string | null
  recipientAddress?: string | null
  dedicationText?: string | null
  // extra_legal_consultation
  topic?: string | null
  advisorId?: string | null
}

export interface PurchaseAddonInput {
  memberId: string
  addonKey: string
  purchasedBy: string | null
  memberPreferredName: string
  memberPlanTier: PlanTier
  intake?: PurchaseIntake
}

export interface PurchaseAddonResult {
  memberAddonId: string
  status: string
  fulfillmentType: string
  fulfillmentId: string | null
}

/**
 * Purchase an add-on. Records a member_addons row, logs the stubbed charge, and
 * for fulfillment add-ons creates the downstream request row + a navigator task.
 */
export async function purchaseAddon(
  input: PurchaseAddonInput
): Promise<{ data: PurchaseAddonResult | null; error: string | null }> {
  try {
    const admin = createAdminClient()

    const { data: addon, error: catErr } = await admin
      .from('premium_addons')
      .select('*')
      .eq('addon_key', input.addonKey)
      .eq('is_active', true)
      .maybeSingle()
    if (catErr) {
      console.error('[data/premium-addons/purchaseAddon] catalog lookup:', catErr)
      return { data: null, error: catErr.message }
    }
    if (!addon) return { data: null, error: 'That add-on is not available.' }

    const cat = addon as PremiumAddonRow

    // Plan-tier gate
    if (cat.min_plan_tier && PLAN_RANK[input.memberPlanTier] < PLAN_RANK[cat.min_plan_tier as PlanTier]) {
      return {
        data: null,
        error: `The ${cat.name} add-on is available on the ${cat.min_plan_tier} plan and above.`,
      }
    }

    // Monthly add-ons: block a duplicate active subscription
    if (cat.billing === 'monthly') {
      const already = await hasActiveAddon(input.memberId, cat.addon_key)
      if (already) return { data: null, error: `${cat.name} is already active on this account.` }
    }

    // Milestone memory book needs a valid milestone age
    if (cat.addon_key === 'milestone_birthday_memory_book') {
      const age = input.intake?.milestoneAge
      if (!age || ![70, 75, 80].includes(age)) {
        return { data: null, error: 'Choose a milestone birthday: 70th, 75th, or 80th.' }
      }
    }

    const now = new Date()
    const renewsAt =
      cat.billing === 'monthly'
        ? new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()).toISOString()
        : null
    const status = cat.billing === 'monthly' ? 'active' : 'pending'

    const { data: inserted, error: insErr } = await admin
      .from('member_addons')
      .insert({
        member_id: input.memberId,
        addon_id: cat.id,
        addon_key: cat.addon_key,
        billing: cat.billing,
        price_cents: cat.price_cents,
        status,
        purchased_by: input.purchasedBy,
        renews_at: renewsAt,
        metadata: (input.intake ?? {}) as Record<string, unknown>,
      })
      .select('*')
      .maybeSingle()
    if (insErr || !inserted) {
      console.error('[data/premium-addons/purchaseAddon] insert:', insErr)
      return { data: null, error: insErr?.message ?? 'Could not record the add-on.' }
    }
    const memberAddon = inserted as MemberAddonRow

    console.log(
      `[STUB][Billing] Would charge ${(cat.price_cents / 100).toFixed(2)} ` +
        `(${cat.billing === 'monthly' ? 'monthly' : 'one-time'}) for add-on "${cat.addon_key}", ` +
        `member ${input.memberId}`
    )

    let fulfillmentId: string | null = null
    let taskId: string | null = null

    const makeTask = async (taskType: string, description: string, priority: TaskPriority = 'medium'): Promise<string | null> => {
      const { data: task, error: taskErr } = await admin
        .from('navigator_tasks')
        .insert({ member_id: input.memberId, task_type: taskType, description, priority })
        .select('id')
        .maybeSingle()
      if (taskErr) console.error('[data/premium-addons/purchaseAddon] task insert:', taskErr)
      return task?.id ?? null
    }

    if (cat.addon_key === 'caregiver_family_plan') {
      taskId = await makeTask(
        'coordinator_call',
        `${input.memberPreferredName}: Caregiver Family Plan started. Schedule the first monthly ` +
          `30-minute family coordinator call and add the whole family to the shared care calendar.`
      )
    } else if (cat.addon_key === 'annual_care_planning') {
      taskId = await makeTask(
        'care_planning_session',
        `${input.memberPreferredName} purchased an Annual Care Planning Session ($149). ` +
          `Book a 60-minute planning call, then deliver a written care plan and a 30-day follow-up. ` +
          (input.intake?.focusAreas?.length ? `Focus areas: ${input.intake.focusAreas.join(', ')}. ` : '') +
          (input.intake?.preferredTimes ? `Preferred times: ${input.intake.preferredTimes}.` : '')
      )
      const { data: cps } = await admin
        .from('care_planning_sessions')
        .insert({
          member_id: input.memberId,
          member_addon_id: memberAddon.id,
          requested_by: input.purchasedBy,
          status: 'requested',
          focus_areas: input.intake?.focusAreas ?? [],
          preferred_times: input.intake?.preferredTimes ?? null,
          navigator_task_id: taskId,
        })
        .select('id')
        .maybeSingle()
      fulfillmentId = cps?.id ?? null
    } else if (cat.addon_key === 'benefits_maximizer_deep_dive') {
      taskId = await makeTask(
        'benefits_deep_dive',
        `${input.memberPreferredName} purchased a Benefits Maximizer Deep-Dive ($79). ` +
          `Run a full federal/state/local benefits review and return a written summary with ` +
          `estimated annual value and application steps for the top 3.`
      )
      const { data: bdd } = await admin
        .from('benefits_deep_dives')
        .insert({
          member_id: input.memberId,
          member_addon_id: memberAddon.id,
          requested_by: input.purchasedBy,
          household: (input.intake?.household ?? {}) as Record<string, unknown>,
          status: 'requested',
          navigator_task_id: taskId,
        })
        .select('id')
        .maybeSingle()
      fulfillmentId = bdd?.id ?? null
    } else if (cat.addon_key === 'milestone_birthday_memory_book') {
      taskId = await makeTask(
        'memory_book_order',
        `${input.memberPreferredName}: Milestone Birthday Memory Book ordered for the ` +
          `${input.intake?.milestoneAge}th birthday ($49). Collect family photos and notes, lay out ` +
          `the hardcover book, and ship it to arrive before the birthday.`
      )
      const { data: mbo } = await admin
        .from('memory_book_orders')
        .insert({
          member_id: input.memberId,
          member_addon_id: memberAddon.id,
          ordered_by: input.purchasedBy,
          milestone_age: input.intake?.milestoneAge ?? 70,
          status: 'requested',
          recipient_name: input.intake?.recipientName ?? null,
          recipient_address: input.intake?.recipientAddress ?? null,
          dedication_text: input.intake?.dedicationText ?? null,
          navigator_task_id: taskId,
        })
        .select('id')
        .maybeSingle()
      fulfillmentId = mbo?.id ?? null
      console.log(
        `[STUB][GOODS] Would order a printed Milestone Birthday Memory Book for member ${input.memberId}`
      )
    } else if (cat.addon_key === 'extra_legal_consultation') {
      taskId = await makeTask(
        'legal_consultation',
        `${input.memberPreferredName} purchased an Extra Legal Consultation ($75). ` +
          `Arrange a 45-minute session with a Trusted Advisor attorney` +
          (input.intake?.topic ? ` about: ${input.intake.topic}. ` : '. ') +
          `Share any relevant documents from the vault and send a short written recap after.`
      )
      const { data: lc } = await admin
        .from('legal_consultations')
        .insert({
          member_id: input.memberId,
          member_addon_id: memberAddon.id,
          requested_by: input.purchasedBy,
          advisor_id: input.intake?.advisorId ?? null,
          topic: input.intake?.topic ?? null,
          status: 'requested',
          navigator_task_id: taskId,
        })
        .select('id')
        .maybeSingle()
      fulfillmentId = lc?.id ?? null
    }

    if (taskId) {
      await admin.from('member_addons').update({ navigator_task_id: taskId }).eq('id', memberAddon.id)
    }

    await pushRealtimeNotification({
      type: 'system_message',
      memberId: input.memberId,
      title: `${cat.name} added`,
      body:
        cat.billing === 'monthly'
          ? `${cat.name} is now active on the account.`
          : `${cat.name} is confirmed. Your Navigator will be in touch to arrange the details.`,
      severity: 'info',
    })

    return {
      data: {
        memberAddonId: memberAddon.id,
        status,
        fulfillmentType: cat.fulfillment,
        fulfillmentId,
      },
      error: null,
    }
  } catch (e) {
    console.error('[data/premium-addons/purchaseAddon] Unexpected error:', e)
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}

/** Cancel a member add-on (monthly subscription or an unfulfilled one-time order). */
export async function cancelAddon(
  memberId: string,
  memberAddonId: string
): Promise<{ error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data: row, error: fetchErr } = await admin
      .from('member_addons')
      .select('id, member_id, status')
      .eq('id', memberAddonId)
      .maybeSingle()
    if (fetchErr) return { error: fetchErr.message }
    if (!row || (row as { member_id: string }).member_id !== memberId) {
      return { error: 'Add-on not found for this member.' }
    }
    if ((row as { status: string }).status === 'cancelled') return { error: null }

    const { error } = await admin
      .from('member_addons')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', memberAddonId)
    if (error) return { error: error.message }

    console.log(`[STUB][Billing] Would cancel add-on ${memberAddonId} for member ${memberId}`)
    return { error: null }
  } catch (e) {
    console.error('[data/premium-addons/cancelAddon] Unexpected error:', e)
    return { error: e instanceof Error ? e.message : String(e) }
  }
}

// ─── Caregiver video diary (Long-Distance Caregiver add-on) ─────────────────

export async function getVideoDiaryEntries(
  memberId: string
): Promise<{ data: CaregiverVideoDiaryEntryRow[]; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('caregiver_video_diary_entries')
      .select('*')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false })
    if (error) return { data: [], error: error.message }
    return { data: data ?? [], error: null }
  } catch (e) {
    return { data: [], error: e instanceof Error ? e.message : String(e) }
  }
}

export async function addVideoDiaryEntry(input: {
  memberId: string
  authorFamilyMemberId: string | null
  title: string
  note: string | null
}): Promise<{ data: CaregiverVideoDiaryEntryRow | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('caregiver_video_diary_entries')
      .insert({
        member_id: input.memberId,
        author_family_member_id: input.authorFamilyMemberId,
        title: input.title,
        note: input.note,
      })
      .select('*')
      .maybeSingle()
    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}

export async function attachVideoDiaryVideo(
  entryId: string,
  memberId: string,
  path: string
): Promise<{ error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data: row } = await admin
      .from('caregiver_video_diary_entries')
      .select('member_id')
      .eq('id', entryId)
      .maybeSingle()
    if (!row || (row as { member_id: string }).member_id !== memberId) {
      return { error: 'Diary entry not found for this member.' }
    }
    const { error } = await admin
      .from('caregiver_video_diary_entries')
      .update({ video_path: path })
      .eq('id', entryId)
    return { error: error?.message ?? null }
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) }
  }
}
