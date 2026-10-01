// Who is on the line. One lookup shared by post-call processing and the Retell tools:
// metadata.member_id (outbound) first, then the caller's phone — members, family, volunteers.
import { createAdminClient } from '../supabase/admin'
import { phoneVariants } from './phone'

export type CallerRole = 'member' | 'family' | 'volunteer' | 'staff' | 'unknown'

export interface CallerMatch {
  role: CallerRole
  memberId: string | null
  familyMemberId: string | null
  volunteerId: string | null
  /** For family callers: the member they are family of */
  familyOfMemberId?: string | null
}

export const NO_CALLER: CallerMatch = { role: 'unknown', memberId: null, familyMemberId: null, volunteerId: null }

/** Phone lookup: members, then family_members, then volunteers. Unknown when nothing matches. */
export async function lookupCallerByPhone(phone: string | null | undefined): Promise<CallerMatch> {
  const variants = phoneVariants(phone)
  if (variants.length === 0) return NO_CALLER
  const admin = createAdminClient()

  const { data: member } = await admin
    .from('members').select('id').in('phone_number', variants).limit(1).maybeSingle()
  if (member) return { ...NO_CALLER, role: 'member', memberId: member.id }

  const { data: fm } = await admin
    .from('family_members').select('id, role, member_id').in('phone', variants).limit(1).maybeSingle()
  if (fm) {
    const staff = fm.role === 'admin' || fm.role === 'navigator'
    return { ...NO_CALLER, role: staff ? 'staff' : 'family', familyMemberId: fm.id, familyOfMemberId: fm.member_id ?? null }
  }

  const { data: vol } = await admin
    .from('volunteers').select('id').in('phone', variants).limit(1).maybeSingle()
  if (vol) return { ...NO_CALLER, role: 'volunteer', volunteerId: vol.id }

  return NO_CALLER
}
