// Family member data access functions — server-side only, uses admin client.
import { createAdminClient } from '../supabase/admin'
import type { Database } from '../../types/database'

export type FamilyMember = Database['public']['Tables']['family_members']['Row']

/** Fetch the family_members row linked to a given Supabase auth UUID. */
export async function getFamilyMemberByAuthId(
  authUserId: string
): Promise<{ data: FamilyMember | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('family_members')
      .select('*')
      .eq('supabase_auth_id', authUserId)
      .maybeSingle()
    if (error) {
      console.error('[data/family/getFamilyMemberByAuthId]', error)
      return { data: null, error: error.message }
    }
    if (!data) return { data: null, error: 'Not found' }
    return { data: data as FamilyMember, error: null }
  } catch (e) {
    console.error('[data/family/getFamilyMemberByAuthId] Unexpected error:', e)
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}

/** Fetch all family_members rows linked to a given member UUID. */
export async function getFamilyMembersForMember(
  memberId: string
): Promise<{ data: FamilyMember[] | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('family_members')
      .select('*')
      .eq('member_id', memberId)
      .order('created_at', { ascending: true })
    if (error) {
      console.error('[data/family/getFamilyMembersForMember]', error)
      return { data: null, error: error.message }
    }
    return { data: (data ?? []) as FamilyMember[], error: null }
  } catch (e) {
    console.error('[data/family/getFamilyMembersForMember] Unexpected error:', e)
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}
