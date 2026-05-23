// Member data access functions — server-side only, uses admin client.
import { createAdminClient } from '../supabase/admin'
import { writeAuditLog } from './audit'
import type { Database } from '../../types/database'

export type Member = Database['public']['Tables']['members']['Row']

/**
 * Fetch a member by their UUID. Returns {data: null, error: 'Not found'} if not present.
 * Pass callerUserId to emit an audit log entry for HIPAA access tracking.
 */
export async function getMemberById(
  memberId: string,
  callerUserId?: string
): Promise<{ data: Member | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('members')
      .select('*')
      .eq('id', memberId)
      .maybeSingle()
    if (error) {
      console.error('[data/members/getMemberById]', error)
      return { data: null, error: error.message }
    }
    if (!data) return { data: null, error: 'Not found' }
    if (callerUserId) {
      void writeAuditLog('member_viewed', 'member', memberId, callerUserId)
    }
    return { data: data as Member, error: null }
  } catch (e) {
    console.error('[data/members/getMemberById] Unexpected error:', e)
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}

/** Fetch the member linked to a given Supabase auth user UUID (via family_members.member_id). */
export async function getMemberForAuthUser(
  authUserId: string
): Promise<{ data: Member | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data: fm, error: fmError } = await admin
      .from('family_members')
      .select('member_id')
      .eq('supabase_auth_id', authUserId)
      .maybeSingle()
    if (fmError) {
      console.error('[data/members/getMemberForAuthUser] family_members lookup:', fmError)
      return { data: null, error: fmError.message }
    }
    if (!fm || !fm.member_id) return { data: null, error: 'Not found' }
    return getMemberById(fm.member_id)
  } catch (e) {
    console.error('[data/members/getMemberForAuthUser] Unexpected error:', e)
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}
