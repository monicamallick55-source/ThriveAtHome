// Verifies Retell's x-retell-signature header against the raw request body.
// Key: RETELL_WEBHOOK_SECRET when set, otherwise RETELL_API_KEY (confirm which one the
// account signs with on a real webhook — see G1 live test).
// Stub mode (neither key set, or placeholders): every request is allowed so local testing works.
import Retell from 'retell-sdk'
import { envKey } from '../env'

export interface VerifiedRetellRequest {
  ok: boolean
  rawBody: string
}

/** Reads the body as text (must happen before any JSON parsing) and checks the signature. */
export async function verifyRetellRequest(request: Request): Promise<VerifiedRetellRequest> {
  const rawBody = await request.text()
  const apiKey = envKey('RETELL_WEBHOOK_SECRET') ?? envKey('RETELL_API_KEY')

  if (!apiKey) {
    console.log('[STUB][Retell] signature check skipped')
    return { ok: true, rawBody }
  }

  const signature = request.headers.get('x-retell-signature')
  if (!signature) return { ok: false, rawBody }

  try {
    return { ok: await Retell.verify(rawBody, apiKey, signature), rawBody }
  } catch (err) {
    console.error('[Retell] signature verification error:', err)
    return { ok: false, rawBody }
  }
}
