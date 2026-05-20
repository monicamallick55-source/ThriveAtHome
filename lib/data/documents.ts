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

interface AddDocumentInput {
  memberId: string
  uploadedBy: string
  fileName: string
  fileType: string
  description?: string | null
  storagePath: string
  isAdvanceDirective?: boolean
}

/** Delete a document record and return its storage path for cleanup. */
export async function deleteDocument(
  documentId: string,
  memberId: string
): Promise<{ storagePath: string | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('document_vault_items')
      .delete()
      .eq('id', documentId)
      .eq('member_id', memberId)
      .select('storage_path')
      .maybeSingle()
    if (error) {
      console.error('[data/documents/deleteDocument]', error)
      return { storagePath: null, error: error.message }
    }
    if (!data) return { storagePath: null, error: 'Document not found' }
    return { storagePath: data.storage_path, error: null }
  } catch (e) {
    console.error('[data/documents/deleteDocument] Unexpected error:', e)
    return { storagePath: null, error: e instanceof Error ? e.message : String(e) }
  }
}

/** Record document metadata in the vault after upload to storage. */
export async function addDocument(
  input: AddDocumentInput
): Promise<{ data: DocumentVaultItem | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('document_vault_items')
      .insert({
        member_id: input.memberId,
        uploaded_by: input.uploadedBy,
        file_name: input.fileName,
        file_type: input.fileType,
        description: input.description ?? null,
        storage_path: input.storagePath,
        is_advance_directive: input.isAdvanceDirective ?? false,
      })
      .select('*')
      .maybeSingle()
    if (error) {
      console.error('[data/documents/addDocument]', error)
      return { data: null, error: error.message }
    }
    if (!data) return { data: null, error: 'Insert returned no data' }
    return { data: data as DocumentVaultItem, error: null }
  } catch (e) {
    console.error('[data/documents/addDocument] Unexpected error:', e)
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}
