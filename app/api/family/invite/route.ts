/**
 * app/api/family/invite/route.ts
 * TC-A003 — 3-seat limit for Basic; unlimited for Complete/Premier
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PLAN_SEAT_LIMITS: Record<string, number> = { basic: 3, complete: Infinity, premier: Infinity }

export async function POST(req: NextRequest) {
  let user: Awaited<ReturnType<typeof requireAuth>>
  try { user = await requireAuth() } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const name  = typeof body?.name  === 'string' ? body.name.trim() : ''
  if (!email || !EMAIL_RE.test(email))
    return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 })

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: member } = await (admin.from as any)('members')
    .select('id, plan').eq('supabase_auth_id', user.id).maybeSingle()
  if (!member)
    return NextResponse.json({ error: 'Only the account holder can invite family members.' }, { status: 403 })

  const plan = (member.plan ?? 'basic').toLowerCase()
  const seatLimit = PLAN_SEAT_LIMITS[plan] ?? 3
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: currentSeats, error: countError } = await (admin.from as any)('family_members')
    .select('id', { count: 'exact', head: true }).eq('member_id', member.id).neq('status', 'removed')
  if (countError) return NextResponse.json({ error: 'Could not check family seat count.' }, { status: 500 })
  if ((currentSeats ?? 0) >= seatLimit)
    return NextResponse.json({ error: `Your ${plan} plan includes up to ${seatLimit} family members. Upgrade to Complete for unlimited.`, upgrade_url: '/dashboard/plan-upgrade', seat_limit: seatLimit, current_seats: currentSeats }, { status: 403 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (admin.from as any)('family_members')
    .select('id, status').eq('member_id', member.id).eq('email', email).maybeSingle()
  if (existing && existing.status !== 'removed')
    return NextResponse.json({ error: 'This email has already been invited.' }, { status: 409 })

  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: invite, error: insertError } = await db.from('family_members')
    .upsert({ member_id: member.id, email, full_name: name || null, invite_token: token, invite_expires_at: expiresAt, status: 'invited', invited_at: new Date().toISOString() }, { onConflict: 'member_id,email' })
    .select('id').single()
  if (insertError) return NextResponse.json({ error: 'Could not create invite.' }, { status: 500 })

  await db.from('notifications').insert({ type: 'family_invite', metadata: { to_email: email, member_id: member.id, invite_token: token, expires_at: expiresAt, accept_url: `/invite/${token}` }, read: false })
    .then(({ error: _e }: { error: unknown }) => void _e)

  return NextResponse.json({ ok: true, invite_id: invite?.id ?? null, accept_url: `/invite/${token}`, expires_at: expiresAt, seats_used: (currentSeats ?? 0) + 1, seat_limit: seatLimit }, { status: 201 })
}
