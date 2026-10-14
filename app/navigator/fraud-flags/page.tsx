// app/navigator/fraud-flags/page.tsx
// G7.1 — Navigator fraud flags console: review, resolve, and contact member

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import NavigatorFraudFlagsClient from '@/components/fraud/NavigatorFraudFlagsClient'

export default async function NavigatorFraudFlagsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: isStaff } = await supabase.rpc('is_staff')
  if (!isStaff) redirect('/dashboard')

  const admin = createAdminClient()

  // Load open + reviewing flags, urgent first
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: flags } = await (admin as any)
    .from('fraud_flags')
    .select(`
      id, created_at, source, scam_type, matched_text, severity, status,
      family_notified_at, source_id,
      members!inner(id, full_name, phone)
    `)
    .in('status', ['open', 'reviewing'])
    .order('severity', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(100)

  // Recent resolved/confirmed (last 30 days)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: resolved } = await (admin as any)
    .from('fraud_flags')
    .select(`
      id, created_at, scam_type, severity, status, resolution_note,
      members!inner(id, full_name)
    `)
    .in('status', ['confirmed', 'false_positive', 'resolved'])
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <NavigatorFraudFlagsClient
      flags={flags ?? []}
      resolved={resolved ?? []}
    />
  )
}
