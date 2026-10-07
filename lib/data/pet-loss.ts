// M27 — Phase 119: The Companion Circle — a peer circle for pet loss that is deliberately
// DISTINCT from the human bereavement circles (grief_support_requests / cultural circles).
// One implicit global circle: a row in pet_loss_circle_members IS membership.
import { createAdminClient } from '../supabase/admin'
import { emailProvider } from '../providers'
import { pushRealtimeNotification } from '../realtime/notifications'
import type { Database } from '../../types/database'
import type { Tables } from '@/types/database'
type PetLossCircleMemberRow = Tables<'pet_loss_circle_members'>
type PetLossCirclePostRow = Tables<'pet_loss_circle_posts'>
type PetLossSupportRequestRow = Tables<'pet_loss_support_requests'>

type PetLossRequestUpdate = Database['public']['Tables']['pet_loss_support_requests']['Update']

/** External, reputable pet-loss resources. Names + short descriptions only — no reproduced content. */
export const PET_LOSS_RESOURCES: { name: string; detail: string; contact: string }[] = [
  {
    name: 'ASPCA Pet Loss Support',
    detail: 'Grief counselling line and printable coping guides for people mourning a companion animal.',
    contact: '1-877-474-3310',
  },
  {
    name: 'Lap of Love — Pet Loss Support Center',
    detail: 'Free weekly online pet-loss support groups and a library of grief articles.',
    contact: 'lapoflove.com/pet-loss-support',
  },
  {
    name: 'Pet Compassion Careline',
    detail: '24/7 phone and chat grief support staffed by licensed counsellors.',
    contact: '1-855-245-8214',
  },
  {
    name: 'Cornell University Pet Loss Support Hotline',
    detail: 'Volunteer veterinary students offer a listening ear during posted evening hours.',
    contact: '607-218-7457',
  },
  {
    name: 'The Ralph Site',
    detail: 'Pet bereavement resources, a private online forum, and a monthly remembrance.',
    contact: 'theralphsite.com',
  },
]

// ─── Circle membership ─────────────────────────────────────────────────────

export async function getPetLossMembership(
  memberId: string
): Promise<{ data: PetLossCircleMemberRow | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('pet_loss_circle_members')
      .select('*')
      .eq('member_id', memberId)
      .maybeSingle()
    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}

export async function joinPetLossCircle(
  memberId: string,
  displayName: string,
  petRemembered: string | null
): Promise<{ data: PetLossCircleMemberRow | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    const name = displayName.trim().slice(0, 60) || 'A circle member'
    const { data, error } = await admin
      .from('pet_loss_circle_members')
      .upsert(
        {
          member_id: memberId,
          display_name: name,
          pet_remembered: petRemembered?.trim().slice(0, 120) || null,
          is_active: true,
        },
        { onConflict: 'member_id' }
      )
      .select('*')
      .maybeSingle()
    if (error || !data) return { data: null, error: error?.message ?? 'Could not join the circle.' }
    return { data, error: null }
  } catch (e) {
    console.error('[data/pet-loss/joinPetLossCircle] Unexpected error:', e)
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}

export async function leavePetLossCircle(memberId: string): Promise<{ error: string | null }> {
  try {
    const admin = createAdminClient()
    const { error } = await admin
      .from('pet_loss_circle_members')
      .update({ is_active: false })
      .eq('member_id', memberId)
    return { error: error?.message ?? null }
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) }
  }
}

export async function getPetLossCircleRoster(): Promise<{
  data: { display_name: string; pet_remembered: string | null; joined_at: string }[]
  error: string | null
}> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('pet_loss_circle_members')
      .select('display_name, pet_remembered, joined_at')
      .eq('is_active', true)
      .order('joined_at', { ascending: false })
      .limit(200)
    if (error) return { data: [], error: error.message }
    return { data: data ?? [], error: null }
  } catch (e) {
    return { data: [], error: e instanceof Error ? e.message : String(e) }
  }
}

// ─── Circle feed ───────────────────────────────────────────────────────────

export async function getPetLossPosts(
  limit = 50
): Promise<{ data: PetLossCirclePostRow[]; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('pet_loss_circle_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) return { data: [], error: error.message }
    return { data: data ?? [], error: null }
  } catch (e) {
    return { data: [], error: e instanceof Error ? e.message : String(e) }
  }
}

const POST_TYPES = ['reflection', 'tribute', 'question', 'encouragement']

export async function createPetLossPost(
  memberId: string,
  authorName: string,
  content: string,
  postType: string
): Promise<{ data: PetLossCirclePostRow | null; error: string | null }> {
  try {
    const text = content.trim()
    if (!text) return { data: null, error: 'Write a few words to share with the circle.' }
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('pet_loss_circle_posts')
      .insert({
        member_id: memberId,
        author_name: authorName.trim().slice(0, 60) || 'A circle member',
        content: text.slice(0, 4000),
        post_type: POST_TYPES.includes(postType) ? postType : 'reflection',
      })
      .select('*')
      .maybeSingle()
    if (error || !data) return { data: null, error: error?.message ?? 'Could not post to the circle.' }
    return { data, error: null }
  } catch (e) {
    console.error('[data/pet-loss/createPetLossPost] Unexpected error:', e)
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}

// ─── 1:1 support requests ──────────────────────────────────────────────────

export interface PetLossSupportInput {
  petId?: string | null
  petName?: string | null
  lossDate?: string | null
  supportType?: string
  message?: string | null
}

export async function getPetLossRequestsForMember(
  memberId: string
): Promise<{ data: PetLossSupportRequestRow[]; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('pet_loss_support_requests')
      .select('*')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false })
    if (error) return { data: [], error: error.message }
    return { data: data ?? [], error: null }
  } catch (e) {
    return { data: [], error: e instanceof Error ? e.message : String(e) }
  }
}

export async function createPetLossSupportRequest(
  memberId: string,
  memberPreferredName: string,
  input: PetLossSupportInput
): Promise<{ data: PetLossSupportRequestRow | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    const supportType = ['one_to_one', 'circle_only', 'resources_only'].includes(input.supportType ?? '')
      ? (input.supportType as string)
      : 'one_to_one'

    let taskId: string | null = null
    if (supportType === 'one_to_one') {
      const { data: task } = await admin
        .from('navigator_tasks')
        .insert({
          member_id: memberId,
          task_type: 'pet_loss_support',
          description:
            `${memberPreferredName} asked for one-to-one support after the loss of ` +
            `${input.petName?.trim() || 'a beloved pet'}` +
            (input.lossDate ? ` (${input.lossDate})` : '') +
            `. Offer a warm call, The Companion Circle, and the pet-loss resource list. ` +
            `This is separate from the human bereavement pathway.`,
          priority: 'medium',
        })
        .select('id')
        .maybeSingle()
      taskId = task?.id ?? null
    }

    const { data, error } = await admin
      .from('pet_loss_support_requests')
      .insert({
        member_id: memberId,
        pet_id: input.petId ?? null,
        pet_name: input.petName?.trim().slice(0, 80) || null,
        loss_date: input.lossDate || null,
        support_type: supportType,
        message: input.message?.trim().slice(0, 2000) || null,
        status: 'pending',
        navigator_task_id: taskId,
      })
      .select('*')
      .maybeSingle()
    if (error || !data) return { data: null, error: error?.message ?? 'Could not send the request.' }

    try {
      await emailProvider.sendGriefSupportNotification(
        process.env.CARE_TEAM_EMAIL ?? 'care-team@thriveathome.dev',
        memberPreferredName,
        `Pet-loss support request (${supportType}) for ${input.petName?.trim() || 'a pet'}. ` +
          `See navigator task queue (task_type pet_loss_support).`
      )
    } catch (e) {
      console.warn('[data/pet-loss/createPetLossSupportRequest] care-team email stub failed:', e)
    }

    await pushRealtimeNotification({
      type: 'grief_support_assigned',
      memberId,
      title: 'Your pet-loss support request was received',
      body:
        supportType === 'one_to_one'
          ? 'A Navigator will reach out with a gentle check-in. The Companion Circle is open any time.'
          : 'The Companion Circle and pet-loss resources are ready for you whenever you need them.',
      severity: 'info',
    })

    return { data, error: null }
  } catch (e) {
    console.error('[data/pet-loss/createPetLossSupportRequest] Unexpected error:', e)
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}

/** Navigator queue: all open pet-loss requests with member name. */
export async function getAllOpenPetLossRequests(): Promise<{
  data: (PetLossSupportRequestRow & {
    members: { preferred_name: string; full_name: string } | null
  })[]
  error: string | null
}> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('pet_loss_support_requests')
      .select('*, members(preferred_name, full_name)')
      .in('status', ['pending', 'acknowledged'])
      .order('created_at', { ascending: false })
    if (error) return { data: [], error: error.message }
    return { data: (data ?? []) as typeof data, error: null }
  } catch (e) {
    return { data: [], error: e instanceof Error ? e.message : String(e) }
  }
}

export async function updatePetLossRequestStatus(
  requestId: string,
  status: string,
  navigatorNotes?: string
): Promise<{ error: string | null }> {
  try {
    const admin = createAdminClient()
    const patch: PetLossRequestUpdate = { status }
    if (navigatorNotes !== undefined) patch.navigator_notes = navigatorNotes.slice(0, 2000)
    if (status === 'supported') patch.matched_at = new Date().toISOString()
    const { error } = await admin.from('pet_loss_support_requests').update(patch).eq('id', requestId)
    return { error: error?.message ?? null }
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) }
  }
}
