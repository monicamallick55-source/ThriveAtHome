// Family message data access functions — server-side only, uses admin client.
import { createAdminClient } from '../supabase/admin'
import type { Database } from '../../types/database'

export type FamilyMessage = Database['public']['Tables']['family_messages']['Row']

/** Fetch messages for a member, oldest first (chronological chat order). */
export async function getMessagesForMember(
  memberId: string,
  limit = 50
): Promise<{ data: FamilyMessage[] | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('family_messages')
      .select('*')
      .eq('member_id', memberId)
      .order('created_at', { ascending: true })
      .limit(limit)
    if (error) {
      console.error('[data/messages/getMessagesForMember]', error)
      return { data: null, error: error.message }
    }
    return { data: (data ?? []) as FamilyMessage[], error: null }
  } catch (e) {
    console.error('[data/messages/getMessagesForMember] Unexpected error:', e)
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}

/** Post a new family message. */
export async function createFamilyMessage(
  memberId: string,
  senderId: string,
  body: string
): Promise<{ data: FamilyMessage | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('family_messages')
      .insert({ member_id: memberId, sender_id: senderId, body })
      .select('*')
      .maybeSingle()
    if (error) {
      console.error('[data/messages/createFamilyMessage]', error)
      return { data: null, error: error.message }
    }
    if (!data) return { data: null, error: 'Insert returned no data' }
    return { data: data as FamilyMessage, error: null }
  } catch (e) {
    console.error('[data/messages/createFamilyMessage] Unexpected error:', e)
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}
