# GAP BUILD SPEC G1 — Voice Call Pipeline Completion

> Part of the Gap Build series (G1–G4), written 2026-09-30 from a code audit of commit `abdc412`.
> Follow the same loop as prompt.md: WORKING → TESTING → DEBUGGING (3 hypotheses → BLOCKED). Mark each checklist item `[x]` only after its VERIFY passes.
> Build order: **G1 first.** Nothing about Aria or the 12 agents works end to end until this ships.

## Why this is first

The 12 Retell agents are built, but the app side of the pipeline is broken or unfinished:

| # | Problem found in code | File |
|---|---|---|
| 0 | **Every completed call fails to save.** Webhook inserts `agent_id` and `call_id`, which are not columns on `check_in_calls` (real column: `retell_call_id`). The insert errors and is only logged. | `app/api/webhooks/retell/route.ts` |
| 1 | Crisis detection never runs. `handleCrisisDetection` and `detectAlertsForCall` exist in `lib/alerts` but nothing in `app/` calls them. | same |
| 2 | No `ai_summary` written. Family summaries stay empty; Aria's `priorCallSummaries` is always empty. | same |
| 3 | Inbound calls dropped. Rows are only saved when `metadata.member_id` exists — inbound callers never have it. | same |
| 4 | `call_type` hard-coded to `'check_in'`; the `call_type` enum has only `check_in, concierge, navigator` (no `onboarding`, no agent-specific types). | same + migration 001 |
| 5 | Only `RETELL_AGENT_ID` (Aria) is used. The other 11 agent IDs are never read. | `lib/services/RetellCallProvider.ts` |
| 6 | Tool `update_call_preferences` has a route but is missing from the webhook `toolRoutes` map. | webhook |
| 7 | No signature verification; `/api/retell/tools/*` accept unauthenticated POSTs. | webhook + tools |
| 8 | Onboarding calls go to every new active member. `aria_call_opted_in` (migration 069) is never read. Conflicts with Launch Protocol (human-first, Day 21 opt-in). | `app/api/cron/aria-calls/route.ts` |

---

## PHASE G1.1 — Schema fix for call records

**Migration `supabase/migrations/085_call_pipeline.sql`:**

```sql
-- Agent + direction tracking on calls
ALTER TABLE check_in_calls
  ADD COLUMN IF NOT EXISTS agent_id      text,
  ADD COLUMN IF NOT EXISTS agent_name    text,     -- 'aria','rosa','joy','grace','hope','claire','sam','morgan','nova','alex','quinn','jordan'
  ADD COLUMN IF NOT EXISTS direction     text CHECK (direction IN ('inbound','outbound')),
  ADD COLUMN IF NOT EXISTS from_number   text,
  ADD COLUMN IF NOT EXISTS to_number     text,
  ADD COLUMN IF NOT EXISTS caller_role   text,     -- 'member','family','volunteer','buddy','staff','partner','unknown'
  ADD COLUMN IF NOT EXISTS processed_at  timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS idx_check_in_calls_retell_call_id
  ON check_in_calls(retell_call_id) WHERE retell_call_id IS NOT NULL;

-- Extend call_type enum
ALTER TYPE call_type ADD VALUE IF NOT EXISTS 'onboarding';
ALTER TYPE call_type ADD VALUE IF NOT EXISTS 'callback';
ALTER TYPE call_type ADD VALUE IF NOT EXISTS 'celebration';
ALTER TYPE call_type ADD VALUE IF NOT EXISTS 'reminder';
ALTER TYPE call_type ADD VALUE IF NOT EXISTS 'crisis';
ALTER TYPE call_type ADD VALUE IF NOT EXISTS 'care_line';

-- member_id must be nullable so unmatched inbound callers are still recorded
ALTER TABLE check_in_calls ALTER COLUMN member_id DROP NOT NULL;

-- Non-member inbound calls (family, volunteers, partners) that don't belong in check_in_calls
CREATE TABLE IF NOT EXISTS inbound_call_log (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at     timestamptz DEFAULT now() NOT NULL,
  retell_call_id text UNIQUE,
  agent_name     text NOT NULL,
  from_number    text,
  caller_role    text NOT NULL DEFAULT 'unknown',
  family_member_id uuid REFERENCES family_members(id) ON DELETE SET NULL,
  volunteer_id   uuid,
  duration_seconds int,
  ai_summary     text,
  transcript     text,
  needs_followup boolean NOT NULL DEFAULT false
);
ALTER TABLE inbound_call_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_read_inbound_calls" ON inbound_call_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM family_members fm WHERE fm.supabase_auth_id = auth.uid() AND fm.role IN ('admin','navigator'))
);
```

Update `types/database.ts` for the new columns and table.

**Checklist:**
```
PHASE G1.1 CHECKLIST
[ ] Migration 085 applied
    VERIFY: Supabase → check_in_calls columns include agent_id, agent_name, direction, from_number, processed_at
    PASS: all present; member_id nullable; enum call_type has 'onboarding'
[ ] inbound_call_log exists with RLS enabled
[ ] npx tsc --noEmit passes
```

---

## PHASE G1.2 — Agent registry (all 12 agents)

**Create `lib/voice/agents.ts`** — single source of truth, like `SERVICE_TYPES`:

```ts
export type AgentName = 'aria'|'rosa'|'joy'|'grace'|'hope'|'claire'|'sam'|'morgan'|'nova'|'alex'|'quinn'|'jordan'

export interface AgentDef {
  name: AgentName
  label: string                 // 'Aria', 'Rosa', …
  envVar: string                // 'RETELL_AGENT_ID', 'RETELL_ROSA_AGENT_ID', …
  direction: 'inbound' | 'outbound'
  defaultCallType: 'check_in'|'onboarding'|'celebration'|'reminder'|'crisis'|'care_line'|'concierge'|'navigator'
  expectedCaller: 'member'|'family'|'volunteer'|'buddy'|'staff'|'partner'|'any'
  crisisScan: boolean           // run handleCrisisDetection on transcript
}
export const AGENTS: Record<AgentName, AgentDef> = { /* 12 entries — see table */ }
export function agentIdFor(name: AgentName): string | null   // reads process.env[envVar]
export function agentNameFromId(agentId: string | null | undefined): AgentName | null
```

| name | envVar | direction | defaultCallType | expectedCaller | crisisScan |
|---|---|---|---|---|---|
| aria | RETELL_AGENT_ID | outbound | check_in | member | yes |
| rosa | RETELL_ROSA_AGENT_ID | inbound | care_line | member | yes |
| joy | RETELL_JOY_AGENT_ID | outbound | celebration | member | yes |
| grace | RETELL_GRACE_AGENT_ID | outbound | reminder | member | yes |
| hope | RETELL_HOPE_AGENT_ID | inbound | crisis | any | yes (always escalate — see G1.4) |
| claire | RETELL_CLAIRE_AGENT_ID | inbound | concierge | family | no |
| sam | RETELL_SAM_AGENT_ID | inbound | concierge | volunteer | no |
| morgan | RETELL_MORGAN_AGENT_ID | inbound | concierge | buddy | no |
| nova | RETELL_NOVA_AGENT_ID | inbound | navigator | staff | no |
| alex | RETELL_ALEX_AGENT_ID | inbound | navigator | staff | no |
| quinn | RETELL_QUINN_AGENT_ID | inbound | concierge | any | yes |
| jordan | RETELL_JORDAN_AGENT_ID | inbound | concierge | partner | no |

**Modify `lib/interfaces/CallProvider.ts`:** add `agent?: AgentName` to `CallContext`; widen `callType` to include `'celebration' | 'reminder'`.

**Modify `lib/services/RetellCallProvider.ts`:** resolve `agent_id` via `agentIdFor(ctx.agent ?? 'aria')`; throw a clear error naming the missing env var. Put `agent_name` in `metadata`.

**Modify `lib/stubs/StubCallProvider.ts`:** log `[STUB][Call] <agent> → <phone>`.

**Checklist:**
```
PHASE G1.2 CHECKLIST
[ ] AGENTS has exactly 12 entries
    VERIFY: node -e "…Object.keys(AGENTS).length" → 12
[ ] agentNameFromId maps each env var's value back to its name
    VERIFY: scripts/test-agents.ts sets fake env vars for all 12 → round-trip all PASS
[ ] Joy call uses RETELL_JOY_AGENT_ID
    VERIFY: stub run of scheduleCall(..., {agent:'joy'}) → log shows joy + correct env var
[ ] Missing env var gives readable error: "RETELL_GRACE_AGENT_ID is not set"
[ ] npx tsc --noEmit passes
```

---

## PHASE G1.3 — Webhook security

**Create `lib/voice/verifyRetell.ts`:** verify the `x-retell-signature` header against the raw body using the `retell-sdk` `Retell.verify(body, key, signature)` helper (install `retell-sdk`). Key: use `RETELL_WEBHOOK_SECRET` if it is set, otherwise `RETELL_API_KEY`. Check the current Retell docs for which key your account signs with, and confirm by verifying one real webhook from a test call — if the signature fails with one key and passes with the other, use the one that passes and note it in the log. Read the body with `await request.text()` BEFORE `JSON.parse`.

- If `RETELL_API_KEY` is unset (stub mode) → allow, log `[STUB][Retell] signature check skipped`.
- Invalid signature → `401`, no DB writes.

**Tool routes (`app/api/retell/tools/*`):** stop self-`fetch`ing over HTTP from the webhook. Instead:
1. Move each tool's body into `lib/voice/tools/<tool>.ts` exporting `async function run(args, ctx)`.
2. The webhook calls the function directly.
3. The HTTP route files stay (Retell custom-function calls may hit them directly) but require the same signature check.

Add the missing tool to the map: `update_call_preferences → lib/voice/tools/updateCallPreferences.ts`.

**Checklist:**
```
PHASE G1.3 CHECKLIST
[ ] Unsigned POST to /api/webhooks/retell with RETELL_API_KEY set → 401
    VERIFY: curl without header → 401; check_in_calls row count unchanged
[ ] Unsigned POST to /api/retell/tools/welfare-check → 401
[ ] Valid signed payload → 200
    VERIFY: scripts/test-retell-webhook.ts signs with test key → 200
[ ] Tool 'update_call_preferences' routes correctly
    VERIFY: signed tool_call payload → members.call_frequency_preference updated
[ ] No fetch() to NEXT_PUBLIC_APP_URL remains in the webhook
    VERIFY: grep -n "fetch(" app/api/webhooks/retell/route.ts → no tool fetches
```

---

## PHASE G1.4 — Call-ended processing (the core fix)

**Create `lib/voice/processCallEnded.ts`** and call it from the webhook's `call_ended` branch. Also handle `call_analyzed` (Retell's post-call analysis event) by calling the same function — it must be **idempotent** keyed on `retell_call_id` (skip if `processed_at` is set).

Steps, in order. Each step in its own try/catch; a failure logs and continues, never aborts later steps. Steps 4 and 5 must never be skipped because an earlier step failed.

1. **Identify agent.** `agentNameFromId(call.agent_id)`; unknown → `'aria'` with a warning.
2. **Identify caller.**
   - Outbound: `metadata.member_id`.
   - Inbound: normalise `call.from_number` to E.164, look up `members.phone_number`, then `family_members.phone`, then volunteers. Set `caller_role`. No match → `'unknown'`.
3. **Save the record.**
   - Member found → upsert `check_in_calls` on `retell_call_id` with: `member_id, agent_id, agent_name, direction, from_number, to_number, call_type` (from metadata.call_type, else agent default), `status:'completed'`, `duration_seconds, transcript, started_at, ended_at` (use Retell's `start_timestamp`/`end_timestamp`, not `Date.now()`), `retell_call_id`.
   - Non-member caller → insert `inbound_call_log`.
   - `status` is `'missed'` when `call.disconnection_reason` is `dial_no_answer`, `dial_busy` or `voicemail_reached`.
4. **Crisis scan** (when `AGENTS[agent].crisisScan` and a member was found): `await handleCrisisDetection({ memberId, callId, transcript })`. For **Hope**, always create a `critical` navigator task "Hope crisis-line call — human follow-up required" even if no phrase matched. For an unknown caller on Hope → insert `inbound_call_log` with `needs_followup=true` AND a Realtime notification to all navigators.
5. **Summary + scores.** `providers.ai.generateCallSummary(transcript)` → `ai_summary`; `providers.ai.extractCallScores(memberSpeechOnly)` → `mood_score, energy_score, pain_score, medication_taken`. Member-speech-only = transcript lines with role `user` from `call.transcript_object`.
6. **Alert rules.** `await detectAlertsForCall(callId, memberId)`; then `detectWellnessDrift(memberId)`.
7. **Member bookkeeping.** Aria/Joy/Grace outbound → update `members.last_aria_call_at`. Onboarding call > 60s → `onboarding_call_completed = true`.
8. **Family notification.** If `members.family_can_see_call_summaries` is true, push a Realtime notification "New call summary" to linked family. **Never include the transcript.**
9. Set `processed_at = now()`.

**Rewrite `app/api/webhooks/retell/route.ts`** to: verify signature → switch on event → `call_started` (upsert row with `status:'in_progress'`) · `call_ended` / `call_analyzed` → `processCallEnded` · `tool_call` → direct tool function. Keep the GET health check.

**Checklist:**
```
PHASE G1.4 CHECKLIST
[ ] Outbound Aria call saves
    VERIFY: scripts/test-retell-webhook.ts sends call_ended with metadata.member_id → 1 check_in_calls row, agent_name='aria'
[ ] Same payload sent twice → still 1 row (idempotent)
[ ] Inbound Rosa call from a member's phone saves with member_id matched by phone
[ ] Inbound call from unknown number → inbound_call_log row, caller_role='unknown'
[ ] Crisis transcript ("I don't want to be here anymore") → emergency_log + alert + critical navigator task
    VERIFY: all 3 rows exist; call row still saved
[ ] "fell asleep watching TV" → no crisis rows (no false positive)
[ ] Any Hope call → critical navigator task even with no crisis phrase
[ ] ai_summary populated (stub returns placeholder text in stub mode)
[ ] mood_score populated from extractCallScores
[ ] Missed call (dial_no_answer) → status 'missed' and missed-call alert rule fires
[ ] Crisis detection throwing → "Crisis detection failed — manual review required" task, call still saved
[ ] Family sees summary, never transcript
    VERIFY: log in as family → /dashboard/calls shows ai_summary; network tab shows no transcript field
[ ] npx tsc --noEmit passes
```

---

## PHASE G1.5 — Aria opt-in + Launch Protocol gating

**Modify `app/api/cron/aria-calls/route.ts`:**

- **Onboarding calls (section 2):** replace the automatic Aria welcome call. New rule: Aria places an onboarding call only when `aria_call_opted_in = true`. Members with `aria_call_opted_in = false` get a `navigator_tasks` row `task_type='welcome_call'`, `priority='high'`, `due_by = created_at + 24h`, description "Personal welcome call — do not mention Aria (Launch Protocol days 1–7)". Create it once per member (dedupe on task_type + member_id).
- **Regular calls (section 3):** add `.eq('aria_call_opted_in', true)` alongside the existing `checkin_preference` filter.
- **Day 21 prompt:** new step — members where `created_at` is 21 days ago, `aria_call_opted_in = false`, and no existing `aria_intro` task → create navigator task `task_type='aria_intro'`, "Offer Aria (play sample call if wanted). Default is NO."
- **Risk override:** `risk_override_calls` must not bypass opt-in. When a member has not opted in and risk is high → navigator task "Elevated risk — human call needed", not an Aria call.

**Member-side toggle:** confirm `/member-portal` → Notifications tab writes `aria_call_opted_in` (not only `checkin_preference`). If it doesn't, update `app/api/member/preferences/route.ts` to set both: choosing "Yes daily" / "Yes less often" → `aria_call_opted_in=true` + frequency; "No thank you" → `false`.

**Checklist:**
```
PHASE G1.5 CHECKLIST
[ ] New member with aria_call_opted_in=false → no Aria call, welcome_call navigator task created
    VERIFY: run cron with CRON_SECRET → StubCallProvider log empty for that member; task row exists
[ ] Running cron twice → still one welcome_call task
[ ] Member opted in → onboarding call placed
[ ] Day-21 member → aria_intro task created once
[ ] risk_override on non-opted-in member → navigator task, no call
[ ] Portal toggle "No thank you" → aria_call_opted_in=false in DB
[ ] npx tsc --noEmit passes
```

---

## PHASE G1.6 — Outbound triggers for Joy and Grace

- **Joy (celebrations):** in `app/api/cron/celebrations/route.ts`, on a member's birthday (D-0) and milestone events, if `aria_call_opted_in = true` call `providers.call.scheduleCall(memberId, phone, { agent:'joy', callType:'celebration', … })`. Pass `celebration_type` and a life-story-personalised line from `generateCelebrationPersonalisation` in dynamic variables. Skip members in active grief (open `grief_support_requests` within 90 days) — log the skip.
- **Grace (reminders):** in `app/api/cron/tracked-item-reminders/route.ts`, for appointments due tomorrow and items flagged `call_reminder = true` (add column to `tracked_items` in migration 085), call with `agent:'grace'`, `callType:'reminder'`, passing `item_name` and `due_date`.

**Checklist:**
```
PHASE G1.6 CHECKLIST
[ ] Birthday member (opted in) → stub log shows joy call
[ ] Birthday member with recent grief request → no Joy call, skip logged
[ ] Appointment tomorrow with call_reminder=true → grace call
[ ] Non-opted-in member → no Joy/Grace call
[ ] npx tsc --noEmit passes
```

---

## Environment variables

Already listed in progress.md; this spec now reads all of them:
`RETELL_API_KEY`, `RETELL_AGENT_ID`, `RETELL_ROSA_AGENT_ID`, `RETELL_JOY_AGENT_ID`, `RETELL_GRACE_AGENT_ID`, `RETELL_HOPE_AGENT_ID`, `RETELL_CLAIRE_AGENT_ID`, `RETELL_SAM_AGENT_ID`, `RETELL_MORGAN_AGENT_ID`, `RETELL_NOVA_AGENT_ID`, `RETELL_ALEX_AGENT_ID`, `RETELL_QUINN_AGENT_ID`, `RETELL_JORDAN_AGENT_ID`, `TWILIO_PHONE_NUMBER`, `ANTHROPIC_API_KEY`.

`RETELL_WEBHOOK_SECRET` — used for signature checks when set (see G1.3); otherwise `RETELL_API_KEY` is used.

## Human review (G1 exit gate)

1. Call Rosa's number from your own phone → within 1 minute a row appears on the navigator console with your number and an AI summary.
2. Say a crisis phrase on a test Aria call → navigator gets a critical task and Realtime alert.
3. Create a test member with Aria off → no call arrives; a welcome-call task appears for the navigator.
