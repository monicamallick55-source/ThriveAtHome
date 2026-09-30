// Verifies Retell's x-retell-signature header against the raw request body.
// Retell signs webhooks and custom-function calls with the account API key.
// Stub mode (no RETELL_API_KEY): every request is allowed so local testing works.
import Retell from 'retell-sdk'

export interface VerifiedRetellRequest {
  ok: boolean
  rawBody: string
}

/** Reads the body as text (must happen before any JSON parsing) and checks the signature. */
export async function verifyRetellRequest(request: Request): Promise<VerifiedRetellRequest> {
  const rawBody = await request.text()
  const apiKey = process.env.RETELL_API_KEY

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
