import { createHmac } from 'crypto'
export function verifyRetellSignature(rawBody: string, signature: string | null): { ok: boolean; reason?: string } {
  const key = process.env.RETELL_WEBHOOK_SECRET ?? process.env.RETELL_API_KEY
  if (!key) { console.warn('[STUB][Retell] signature check skipped'); return { ok: true } }
  if (!signature) return { ok: false, reason: 'missing x-retell-signature header' }
  const expected = createHmac('sha256', key).update(rawBody).digest('hex')
  return signature === expected ? { ok: true } : { ok: false, reason: 'signature mismatch' }
}
