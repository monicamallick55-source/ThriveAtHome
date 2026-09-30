// Test helper: creates a throwaway Supabase auth user, signs in through @supabase/ssr and
// returns the Cookie header the Next.js app expects. Call cleanup() to delete the user.
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

export interface TestSession {
  userId: string
  cookieHeader: string
  cleanup: () => Promise<void>
}

export async function createTestSession(label: string): Promise<TestSession> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const email = `test-${label}-${Date.now()}@example.invalid`
  const password = randomUUID()
  const { data: created, error: createErr } = await admin.auth.admin.createUser({ email, password, email_confirm: true })
  if (createErr || !created.user) throw new Error(`createUser failed: ${createErr?.message}`)

  const jar = new Map<string, string>()
  const ssr = createServerClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: toSet => toSet.forEach(({ name, value }) => (value ? jar.set(name, value) : jar.delete(name))),
    },
  })
  const { error: signErr } = await ssr.auth.signInWithPassword({ email, password })
  if (signErr) throw new Error(`signIn failed: ${signErr.message}`)

  return {
    userId: created.user.id,
    cookieHeader: [...jar].map(([n, v]) => `${n}=${v}`).join('; '),
    cleanup: async () => { await admin.auth.admin.deleteUser(created.user!.id) },
  }
}
