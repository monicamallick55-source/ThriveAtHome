// G1.1 verification — run after migration 085 is applied.
// Usage: npx tsx scripts/verify-085.ts
// Catalog checks use the Supabase Management API (SUPABASE_ACCESS_TOKEN, read-only queries).
// Behavioural checks use the service role and delete every row they create.
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const token = process.env.SUPABASE_ACCESS_TOKEN
if (!url || !key) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
const projectRef = new URL(url).hostname.split('.')[0]
const admin = createClient(url, key)

let allPass = true
function check(name: string, ok: boolean, detail = '') {
  console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ` — ${detail}` : ''}`)
  if (!ok) allPass = false
}

async function sql<T>(query: string): Promise<T[] | null> {
  if (!token) return null
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  if (!res.ok) {
    console.warn(`⚠️  Management API ${res.status}: ${await res.text()}`)
    return null
  }
  return (await res.json()) as T[]
}

async function main() {
  console.log('\n── G1.1 / migration 085 verification ──\n')

  // 1. Columns (via PostgREST select — errors if any column is missing)
  const newCols = ['agent_id', 'agent_name', 'direction', 'from_number', 'to_number', 'caller_role', 'processed_at']
  const { error: colErr } = await admin.from('check_in_calls').select(newCols.join(',')).limit(1)
  check('check_in_calls has new columns', !colErr, colErr?.message ?? newCols.join(', '))

  // 2. Catalog checks
  const cols = await sql<{ column_name: string; is_nullable: string }>(
    `select column_name, is_nullable from information_schema.columns
     where table_schema='public' and table_name='check_in_calls' and column_name='member_id'`
  )
  const enumVals = await sql<{ enumlabel: string }>(
    `select e.enumlabel from pg_enum e join pg_type t on t.oid=e.enumtypid where t.typname='call_type'`
  )
  const rls = await sql<{ relrowsecurity: boolean }>(
    `select relrowsecurity from pg_class where oid='public.inbound_call_log'::regclass`
  )
  const idx = await sql<{ indexname: string }>(
    `select indexname from pg_indexes where tablename='check_in_calls' and indexname='idx_check_in_calls_retell_call_id'`
  )
  const policies = await sql<{ policyname: string }>(
    `select policyname from pg_policies where tablename='inbound_call_log'`
  )

  if (cols && enumVals && rls && idx && policies) {
    check('member_id nullable', cols[0]?.is_nullable === 'YES', cols[0]?.is_nullable)
    const labels = enumVals.map(e => e.enumlabel)
    const want = ['onboarding', 'callback', 'celebration', 'reminder', 'crisis', 'care_line']
    check('call_type enum extended', want.every(w => labels.includes(w)), labels.join(', '))
    check('inbound_call_log RLS enabled', rls[0]?.relrowsecurity === true)
    check('unique index on retell_call_id', idx.length === 1)
    check('staff_read_inbound_calls policy', policies.some(p => p.policyname === 'staff_read_inbound_calls'))
  } else {
    console.log('⚠️  Catalog checks skipped (no SUPABASE_ACCESS_TOKEN or API error) — falling back to behavioural checks')
  }

  // 3. Behavioural: insert a call with null member_id + call_type 'onboarding', then delete it
  const probeId = `verify-085-${Date.now()}`
  const { data: ins, error: insErr } = await admin
    .from('check_in_calls')
    .insert({ member_id: null, call_type: 'onboarding', retell_call_id: probeId, agent_name: 'aria', direction: 'inbound' })
    .select('id')
    .maybeSingle()
  check('insert with null member_id + onboarding call_type', !insErr && !!ins, insErr?.message)

  // Duplicate retell_call_id must be rejected by the unique index
  const { error: dupErr } = await admin
    .from('check_in_calls')
    .insert({ member_id: null, call_type: 'check_in', retell_call_id: probeId })
  check('duplicate retell_call_id rejected', !!dupErr && dupErr.code === '23505', dupErr?.code)

  // Upsert on retell_call_id must work (G1.4 depends on it)
  const { error: upErr } = await admin
    .from('check_in_calls')
    .upsert({ retell_call_id: probeId, member_id: null, agent_name: 'rosa' }, { onConflict: 'retell_call_id' })
  check('upsert onConflict retell_call_id works', !upErr, upErr?.message)

  await admin.from('check_in_calls').delete().eq('retell_call_id', probeId)

  // Every new call_type value is accepted
  const newTypes = ['onboarding', 'callback', 'celebration', 'reminder', 'crisis', 'care_line'] as const
  const bad: string[] = []
  for (const t of newTypes) {
    const rid = `${probeId}-${t}`
    const { error } = await admin.from('check_in_calls').insert({ member_id: null, call_type: t, retell_call_id: rid })
    if (error) bad.push(`${t}: ${error.message}`)
    await admin.from('check_in_calls').delete().eq('retell_call_id', rid)
  }
  check('all 6 new call_type values accepted', bad.length === 0, bad.join('; ') || newTypes.join(', '))

  // 4. inbound_call_log insert + anon read blocked
  const { error: logErr } = await admin
    .from('inbound_call_log')
    .insert({ retell_call_id: probeId, agent_name: 'rosa', caller_role: 'unknown' })
  check('inbound_call_log insert (service role)', !logErr, logErr?.message)

  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (anonKey) {
    const anon = createClient(url!, anonKey)
    const { data: anonRows } = await anon.from('inbound_call_log').select('id').eq('retell_call_id', probeId)
    check('anon cannot read inbound_call_log', (anonRows ?? []).length === 0)
  }
  await admin.from('inbound_call_log').delete().eq('retell_call_id', probeId)

  console.log(allPass ? '\n✅ ALL PASS\n' : '\n❌ FAILURES ABOVE\n')
  process.exit(allPass ? 0 : 1)
}

main()
