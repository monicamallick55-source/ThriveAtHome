import { createHmac, timingSafeEqual } from 'crypto'

const WEBHOOK_SECRET = process.env.RETELL_WEBHOOK_SECRET ?? ''

/** Verify a raw Retell webhook request. Returns { ok, rawBody }. */
export async function verifyRetellRequest(req: Request): Promise<{ ok: boolean; rawBody: string }> {
  const rawBody = await req.text()
  const signature = req.headers.get('x-retell-signature')
  if (!WEBHOOK_SECRET) return { ok: true, rawBody } // skip if secret not configured
  const ok = verifyRetellSignature(rawBody, signature, WEBHOOK_SECRET)
  return { ok, rawBody }
}

/** Low-level HMAC-SHA256 signature check (timing-safe). */
export function verifyRetellSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false
  try {
    const expected = createHmac('sha256', secret).update(payload).digest('hex')
    const expectedBuf = Buffer.from(expected, 'hex')
    const sigBuf = Buffer.from(signature.replace(/^sha256=/, ''), 'hex')
    if (expectedBuf.length !== sigBuf.length) return false
    return timingSafeEqual(expectedBuf, sigBuf)
  } catch {
    return false
  }
}
