// Audit log helpers — server-side only, uses admin client.
// Write audit entries for all access to or deletion of PHI.
import { createAdminClient } from '../supabase/admin'

type AuditAction =
  | 'member_viewed'
  | 'calls_viewed'
  | 'member_deleted'
  | 'document_downloaded'
  | 'navigator_notes_viewed'

export async function writeAuditLog(
  action: AuditAction,
  resourceType: string,
  resourceId: string | null,
  userId: string | null
): Promise<void> {
  try {
    const admin = createAdminClient()
    await admin.from('audit_log').insert({
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      user_id: userId,
    })
  } catch (e) {
    // Audit failures must never crash the calling operation.
    console.error('[audit/writeAuditLog] Failed to write audit entry:', e)
  }
}
