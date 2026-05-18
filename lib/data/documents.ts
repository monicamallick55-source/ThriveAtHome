// Document vault data access functions — server-side only, uses admin client.
import { createAdminClient } from '../supabase/admin'
import type { Database } from '../../types/database'

export type DocumentVaultItem = Database['public']['Tables']['document_vault_items']['Row']

/** Fetch all documents for a member, newest first. */
export async function getDocumentsForMember(
  memberId: string
): Promise<{ data: DocumentVaultItem[] | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('document_vault_items')
      .select('*')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false })
    if (error) {
      console.error('[data/documents/getDocumentsForMember]', error)
      return { data: null, error: error.message }
    }
    return { data: (data ?? []) as DocumentVaultItem[], error: null }
  } catch (e) {
    console.error('[data/documents/getDocumentsForMember] Unexpected error:', e)
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}
