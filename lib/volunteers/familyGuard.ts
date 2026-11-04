/**
 * lib/volunteers/familyGuard.ts — G5.10
 * Returns true if a family volunteer SHOULD NOT be matched to a given senior.
 * Guard: family volunteers can never be matched to their own senior's requests.
 */
import { SupabaseClient } from '@supabase/supabase-js'

export async function isOwnSenior(
  supabase: SupabaseClient,
  volunteerId: string,
  targetMemberId: string
): Promise<boolean> {
  // Check if the volunteer is a family contact of this member
  const { data } = await supabase
    .from('family_contacts')
    .select('id')
    .eq('member_id', targetMemberId)
    .eq('volunteer_id', volunteerId)
    .limit(1)

  return (data ?? []).length > 0
}
