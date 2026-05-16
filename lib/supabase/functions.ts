// Helper to call Supabase Edge Functions — wraps fetch with auth header and error handling.
import { requireEnv } from '../env'

export async function callEdgeFunction<T>(
  name: string,
  body: Record<string, unknown>,
  authToken?: string
): Promise<T> {
  const url = `${requireEnv('NEXT_PUBLIC_SUPABASE_URL')}/functions/v1/${name}`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  }
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`

  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`[functions/${name}] HTTP ${res.status}: ${text}`)
  }

  return res.json() as Promise<T>
}
