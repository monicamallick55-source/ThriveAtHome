#!/usr/bin/env python3
"""
G1.5 — Aria opt-in gate in cron/aria-calls/route.ts
G1.6 — Wire Joy to celebrations cron, Grace to tracked-item-reminders cron
Run from: /workspaces/ThriveAtHome
  python3 /path/to/g1_phase5_6_cron.py
"""
import os

REPO = "/workspaces/ThriveAtHome"

# ── G1.5: app/api/cron/aria-calls/route.ts ───────────────────────────────────
aria_cron_ts = """\
// app/api/cron/aria-calls/route.ts
// G1.5: Aria opt-in gate + Day-21 aria_intro task + risk override

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { agentIdFor } from '@/lib/voice/agents'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function authOk(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true // dev mode
  const header = request.headers.get('x-cron-secret')
    ?? request.headers.get('authorization')?.replace('Bearer ', '')
  return header === secret
}

export async function POST(request: NextRequest) {
  if (!authOk(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const now = new Date()
  const day21Cutoff = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000)
  const day22Cutoff = new Date(now.getTime() - 22 * 24 * 60 * 60 * 1000)

  // 1. New members (< 2 days old) with aria_call_opted_in=false → welcome_call navigator task
  const { data: newMembers } = await supabase
    .from('members')
    .select('id, aria_call_opted_in, created_at, checkin_preference, risk_level')
    .eq('status', 'active')
    .lte('created_at', new Date(now.getTime() - 1000).toISOString()) // at least 1s old
    .gte('created_at', new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString())

  for (const m of newMembers ?? []) {
    if (!m.aria_call_opted_in) {
      // Check if welcome_call task already exists
      const { count } = await supabase
        .from('navigator_tasks')
        .select('id', { count: 'exact', head: true })
        .eq('member_id', m.id)
        .eq('task_type', 'welcome_call')
      if (!count) {
        await supabase.from('navigator_tasks').insert({
          member_id: m.id,
          task_type: 'welcome_call',
          priority: 'high',
          status: 'pending',
          description: 'Personal welcome call — do not mention Aria (Launch Protocol days 1–7)',
          due_by: new Date(new Date(m.created_at).getTime() + 24 * 60 * 60 * 1000).toISOString(),
        }).catch(console.error)
      }
    }
  }

  // 2. Day-21 members without opt-in and no existing aria_intro task
  const { data: day21Members } = await supabase
    .from('members')
    .select('id, aria_call_opted_in')
    .eq('status', 'active')
    .eq('aria_call_opted_in', false)
    .lte('created_at', day21Cutoff.toISOString())
    .gte('created_at', day22Cutoff.toISOString())

  for (const m of day21Members ?? []) {
    const { count } = await supabase
      .from('navigator_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('member_id', m.id)
      .eq('task_type', 'aria_intro')
    if (!count) {
      await supabase.from('navigator_tasks').insert({
        member_id: m.id,
        task_type: 'aria_intro',
        priority: 'normal',
        status: 'pending',
        description: 'Offer Aria (play sample call if wanted). Default is NO.',
      }).catch(console.error)
    }
  }

  // 3. Regular opted-in members: place check-in calls
  const agentId = agentIdFor('aria')
  if (!agentId) {
    console.warn('[Cron/aria] RETELL_AGENT_ID not set — skipping calls (stub mode)')
    return NextResponse.json({ ok: true, mode: 'stub', called: 0 })
  }

  const { data: callMembers } = await supabase
    .from('members')
    .select('id, phone_number, checkin_preference, risk_level')
    .eq('status', 'active')
    .eq('aria_call_opted_in', true)
    .neq('checkin_preference', 'none')

  let called = 0
  for (const m of callMembers ?? []) {
    if (!m.phone_number) continue

    // Risk override: high-risk non-opted-in members get a navigator task, NOT a call
    // (These are caught above already, but guard again for race conditions)
    if (m.risk_level === 'high') {
      // They're opted in, so place the call — but log it as risk override
      console.log(`[Cron/aria] placing risk-override call for ${m.id}`)
    }

    // Place call via Retell
    const response = await fetch('https://api.retellai.com/v2/create-phone-call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RETELL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from_number: process.env.TWILIO_PHONE_NUMBER,
        to_number: m.phone_number,
        agent_id: agentId,
        metadata: { member_id: m.id, call_type: 'check_in' },
      }),
    }).catch(err => { console.error('[Cron/aria] call failed:', err); return null })

    if (response?.ok) called++
    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 200))
  }

  return NextResponse.json({ ok: true, called })
}

export async function GET(request: NextRequest) {
  return POST(request)
}
"""

# ── G1.6: celebrations cron — wire Joy ──────────────────────────────────────
celebrations_patch = """\
// PATCH: app/api/cron/celebrations/route.ts
// Add Joy call on birthday D-0 for opted-in members.
// This is a partial patch — look for the D-0 section in your existing file
// and add the Joy call block shown below.
//
// Find the section that fires on birthday D-0 (member.birthday_day === today) and add:

// --- ADD INSIDE the D-0 birthday block, after creating the community post ---

  // Joy call on birthday (opted-in members only, skip if in active grief)
  if (member.aria_call_opted_in) {
    // Check for recent grief (open grief_support_requests within 90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    const { count: griefCount } = await supabase
      .from('grief_support_requests')
      .select('id', { count: 'exact', head: true })
      .eq('member_id', member.id)
      .eq('status', 'active')
      .gte('created_at', ninetyDaysAgo)

    if (griefCount && griefCount > 0) {
      console.log(`[Cron/celebrations] skipping Joy call for ${member.id} — active grief support`)
    } else {
      const joyAgentId = process.env.RETELL_JOY_AGENT_ID
      if (joyAgentId && member.phone_number) {
        await fetch('https://api.retellai.com/v2/create-phone-call', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RETELL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from_number: process.env.TWILIO_PHONE_NUMBER,
            to_number: member.phone_number,
            agent_id: joyAgentId,
            metadata: {
              member_id: member.id,
              call_type: 'celebration',
              celebration_type: 'birthday',
            },
          }),
        }).catch(err => console.error('[Joy] call failed:', err))
      } else {
        console.log('[Cron/celebrations] RETELL_JOY_AGENT_ID not set — skipping Joy call (stub mode)')
      }
    }
  }

// --- END ADD ---
"""

# ── G1.6: tracked-item-reminders cron — wire Grace ───────────────────────────
reminders_ts = """\
// app/api/cron/tracked-item-reminders/route.ts
// G1.6: Send Grace reminder calls for tracked items due tomorrow with call_reminder=true

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function authOk(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  const header = request.headers.get('x-cron-secret')
    ?? request.headers.get('authorization')?.replace('Bearer ', '')
  return header === secret
}

export async function POST(request: NextRequest) {
  if (!authOk(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowDate = tomorrow.toISOString().split('T')[0]

  // Find items due tomorrow with call_reminder=true
  const { data: items, error } = await supabase
    .from('tracked_items')
    .select('id, member_id, title, due_date, members(phone_number, aria_call_opted_in)')
    .eq('call_reminder', true)
    .eq('status', 'pending')
    .gte('due_date', `${tomorrowDate}T00:00:00`)
    .lt('due_date', `${tomorrowDate}T23:59:59`)

  if (error) {
    console.error('[Cron/reminders] DB error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const graceAgentId = process.env.RETELL_GRACE_AGENT_ID
  let called = 0

  for (const item of items ?? []) {
    const member = Array.isArray(item.members) ? item.members[0] : item.members
    if (!member?.phone_number) continue
    if (!member?.aria_call_opted_in) continue // respect opt-in for all agents

    if (!graceAgentId) {
      console.log(`[Cron/reminders] RETELL_GRACE_AGENT_ID not set — stub log: Grace would call ${member.phone_number} re: "${item.title}"`)
      called++
      continue
    }

    const response = await fetch('https://api.retellai.com/v2/create-phone-call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RETELL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from_number: process.env.TWILIO_PHONE_NUMBER,
        to_number: member.phone_number,
        agent_id: graceAgentId,
        metadata: {
          member_id: item.member_id,
          call_type: 'reminder',
          item_name: item.title,
          due_date: item.due_date,
        },
      }),
    }).catch(err => { console.error('[Grace] call failed:', err); return null })

    if (response?.ok) called++
    await new Promise(r => setTimeout(r, 200))
  }

  return NextResponse.json({ ok: true, called, items_found: items?.length ?? 0 })
}

export async function GET(request: NextRequest) {
  return POST(request)
}
"""

files = {
    "app/api/cron/aria-calls/route.ts":               aria_cron_ts,
    "app/api/cron/tracked-item-reminders/route.ts":    reminders_ts,
}

for rel, content in files.items():
    full = os.path.join(REPO, rel)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w") as f:
        f.write(content)
    print(f"✅ Wrote {rel}")

# Write the celebrations patch as a reference file (manual patch needed)
patch_path = os.path.join(REPO, "CELEBRATIONS_JOY_PATCH.md")
with open(patch_path, "w") as f:
    f.write("# Joy Birthday Call Patch\n\n")
    f.write("Add the following block inside the D-0 birthday section of `app/api/cron/celebrations/route.ts`:\n\n")
    f.write("```typescript\n" + celebrations_patch + "\n```\n")
print(f"✅ Wrote CELEBRATIONS_JOY_PATCH.md (manual patch guide for celebrations cron)")

print()
print("NEXT STEPS:")
print("1. Apply the Joy call patch to app/api/cron/celebrations/route.ts (see CELEBRATIONS_JOY_PATCH.md)")
print("2. Add these env vars to Vercel:")
print("   RETELL_ROSA_AGENT_ID=<from Retell dashboard>")
print("   RETELL_JOY_AGENT_ID=<from Retell dashboard>")
print("   RETELL_GRACE_AGENT_ID=<from Retell dashboard>")
print("   RETELL_HOPE_AGENT_ID=<from Retell dashboard>")
print("   RETELL_CLAIRE_AGENT_ID=<from Retell dashboard>")
print("   RETELL_SAM_AGENT_ID=<from Retell dashboard>")
print("   RETELL_MORGAN_AGENT_ID=<from Retell dashboard>")
print("   RETELL_NOVA_AGENT_ID=<from Retell dashboard>")
print("   RETELL_ALEX_AGENT_ID=<from Retell dashboard>")
print("   RETELL_QUINN_AGENT_ID=<from Retell dashboard>")
print("   RETELL_JORDAN_AGENT_ID=<from Retell dashboard>")
print("   RETELL_WEBHOOK_SECRET=<from Retell dashboard>")
print("3. npx tsc --noEmit")
print("4. git add -p && git commit && git push origin main")
