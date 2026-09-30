# Gap Build — Progress Log

> **Append-only below "Session log".** The phase table is the only part edited in place.
> Every session starts by reading this file and ends by appending an entry.

## Phase status

Status values: `NOT_STARTED` · `IN_PROGRESS` · `AWAITING_SQL` · `AWAITING_APPROVAL` · `COMPLETE` · `BLOCKED`

| Phase | Name | Status | Migration | Commit |
|---|---|---|---|---|
| G1.1 | Call record schema fix | COMPLETE | 085 | f2aba4e, ae7902c |
| G1.2 | Agent registry (12 agents) | COMPLETE | — | d72efa4 |
| G1.3 | Webhook security | COMPLETE | — | 724032d |
| G1.4 | Call-ended processing | COMPLETE | — | 212a4b9 |
| G1.5 | Aria opt-in + Launch Protocol | COMPLETE | — | 1885807 |
| G1.6 | Joy + Grace outbound | COMPLETE | 086 | 7e578df, 8edbf72 |
| **G1** | **Human review** | AWAITING_APPROVAL | | PR: #1 |
| G2.0 | RLS helpers | NOT_STARTED | 086 | |
| G2.1 | Post comments | NOT_STARTED | 086 | |
| G2.2 | Report & moderation | NOT_STARTED | 086 | |
| G2.3 | Member event proposals + 41a | NOT_STARTED | 086 | |
| G2.4 | Circle members tab | NOT_STARTED | — | |
| G2.5 | Friends + private messages | NOT_STARTED | 087 | |
| G2.6 | Facilitated introductions | NOT_STARTED | 087 | |
| **G2** | **Human review** | NOT_STARTED | | PR: |
| G3.4 | Fraud flags + detector | NOT_STARTED | 089 | |
| G3.1 | Family events calendar | NOT_STARTED | 088 | |
| G3.2 | Cards, notes & gifts | NOT_STARTED | 088 | |
| G3.3 | Family-initiated celebrations | NOT_STARTED | 088 | |
| **G3** | **Human review** | NOT_STARTED | | PR: |
| G4.1 | HV importer + sync | NOT_STARTED | 090 | |
| G4.2 | SMS broadcasts | NOT_STARTED | 090 | |
| G4.3 | Geocoding & distance | NOT_STARTED | 090 | |
| G4.4 | Grief circles | NOT_STARTED | 090 | |
| G4.5 | Thrive Device kiosk | NOT_STARTED | 090 | |
| G4.6 | Transport dispatch tiers | NOT_STARTED | — | |
| G4.7 | Volunteer training | NOT_STARTED | 090 | |
| G4.8 | Language Line bridge | NOT_STARTED | — | |
| **G4** | **Human review** | NOT_STARTED | | PR: |

Where one spec file's phases share a migration number (e.g. 086 for G2.0–G2.3), write one migration file per phase instead, numbered in sequence from the next free number, and update this table. Don't pack phases you haven't reached into an earlier migration.

## Found along the way

Bugs or gaps noticed outside the current phase. Don't fix unless blocking.

| Date | Where | What |
|---|---|---|
| 2026-09-30 | `app/api/cron/aria-calls/route.ts` + `types/database.ts` | `CallType` in TS already included `'onboarding'`, but the DB enum did not, so onboarding-call inserts were failing silently. Fixed as a side effect of migration 085. |
| 2026-09-30 | local env | `node_modules` was missing `@anthropic-ai/sdk` (so `tsc` failed on main). Ran `npm install`; no package.json changes. |
| 2026-09-30 | `lib/voice/tools/*` (moved from `app/api/retell/tools`) | Existing tool writes fail against the live DB: `alerts.metadata` column missing (welfare-check + service-request alerts never save), `navigator_alerts` and `mood_logs` tables missing, `emergency_log.trigger` column missing, `alert_type 'service_request'` not in enum. **Welfare-check alerts from Aria are silently lost — high priority.** |
| 2026-09-30 | `check_in_calls` RLS | `family_select_own_calls` lets a family user read the `transcript` column directly with the anon client. The app no longer sends it, but the DB still allows it. Needs a column-level REVOKE or a view (needs a human decision). |
| 2026-09-30 | `/dashboard/calls`, `/api/calls` | Family call history ignores `family_can_see_call_summaries` / `family_can_see_mood`. |
| 2026-09-30 | `realtime_notifications` | member_id NOT NULL, so there is no way to notify "all navigators". The Hope unknown-caller case uses an urgent care-team SMS plus `inbound_call_log.needs_followup` instead. |
| 2026-09-30 | `lib/services/AnthropicAiProvider.ts` | All other methods still throw "Not yet implemented"; only the two G1.4 needs are implemented. |
| 2026-09-30 | `lib/alerts/detectCrisis.ts` | **Crisis SMS never delivered.** `handleCrisisDetection` sends `smsProvider.sendUrgent('care-team', …)`: `'care-team'` is not a phone number, so real Twilio rejects it. processCallEnded's Hope unknown-caller SMS uses the same address. Needs a real care-team number (env var) — high priority. |
| 2026-09-30 | `.env.local` (Codespace) | Holds real non-Supabase keys (Vercel pull). A dev server run on it used the real Anthropic key (rejected: no credit) and Twilio (rejected: SID doesn't start with AC). Nothing was sent or charged. Tests now use `scripts/dev-stub-server.sh`, which forces every provider to its stub. |
| 2026-09-30 | Anthropic account | "credit balance is too low" — production call summaries/scores will be empty until credit is added. |
| 2026-09-30 | Stripe routes | `lib/stripe/sync.ts`, `app/api/donations/checkout`, `app/api/life-story/memory-book/payment` read `STRIPE_SECRET_KEY` directly instead of `envKey()` — a placeholder would be passed to Stripe (fails, no charge). Fix when those phases are touched. |
| 2026-09-30 | lint baseline | `npm run lint` on main: 285 errors, 109 warnings. "No new errors" is measured against this. |

## Entry format

```
---
SESSION: [n]
DATE: [YYYY-MM-DD]
PHASE: [G1.4 — name]
STATUS: [IN_PROGRESS | AWAITING_SQL | AWAITING_APPROVAL | COMPLETE | BLOCKED]
BRANCH: [gaps/g1]

CHECKLIST: [x of y passed]
- [x] item — what was observed
- [ ] item — not yet run / why
- [!] item — BLOCKED: H1 … → result; H2 … → result; H3 … → result

FILES:
- path — CREATED / MODIFIED: what changed

SQL FOR HUMAN TO RUN: [file name, or none]
DEVIATIONS FROM SPEC: [what and why, or none]

NEXT:
- [first exact action for the next session]
---
```

## Phase status — G5 & G6 (added Sept 30, 2026)

| Phase | Name | Status | Migration | Commit |
|---|---|---|---|---|
| G5.1 | Medicare: MA data + member Medicare help | NOT_STARTED | 091+ | |
| G5.2 | Paid companion payouts + credits | NOT_STARTED | | |
| G5.3 | Geographic chapters | NOT_STARTED | | |
| G5.4 | Celebrations depth | NOT_STARTED | | |
| G5.5 | Life transitions depth | NOT_STARTED | | |
| G5.6 | Named interest circles + cultural content | NOT_STARTED | | |
| G5.7 | Plan entitlements + missing SKUs | NOT_STARTED | | |
| G5.8 | Family daily summary text + event rides | NOT_STARTED | | |
| G5.9 | FHIR R4 referrals + compare pages | NOT_STARTED | | |
| G5.10 | Volunteer ecosystem completion | NOT_STARTED | | |
| **G5** | **Human review** | NOT_STARTED | | PR: |
| G6.0 | Referral partners | NOT_STARTED | | |
| G6.1 | Home Safety Program | NOT_STARTED | | |
| G6.2 | Home Sharing (HIP Housing referral) | NOT_STARTED | | |
| G6.3 | Encore Careers | NOT_STARTED | | |
| G6.4 | Member-in-Need Campaigns | NOT_STARTED | | |
| **G6** | **Human review** | NOT_STARTED | | PR: |

## Session log

---
SESSION: 0
DATE: 2026-09-30
PHASE: — setup
STATUS: NOT_STARTED
BRANCH: main

Specs G1–G4 written from a code audit of commit abdc412 and committed to `gaps/`.

NEXT:
- Create branch `gaps/g1` from main
- Read `gaps/G1_Call_Pipeline.md` fully, then start G1.1 (migration 085)
---

---
SESSION: 1
DATE: 2026-09-30
PHASE: G1.1 — Call record schema fix
STATUS: AWAITING_SQL
BRANCH: gaps/g1

CHECKLIST: 1 of 3 passed
- [ ] Migration 085 applied — waiting for human to run it in the Supabase SQL Editor
- [ ] inbound_call_log exists with RLS enabled — needs DB (RLS is enabled in the same migration)
- [x] npx tsc --noEmit passes — clean; lint unchanged at 285 errors / 109 warnings

FILES:
- supabase/migrations/085_call_pipeline.sql — CREATED: new check_in_calls columns, unique index on retell_call_id, 6 call_type values, member_id nullable, inbound_call_log + RLS policy
- types/database.ts — MODIFIED: CallType widened, CallDirection added, check_in_calls new columns + nullable member_id, inbound_call_log table
- lib/data/grief.ts, lib/data/navigator.ts — MODIFIED: skip call rows with null member_id (needed for tsc after member_id became nullable)

SQL FOR HUMAN TO RUN: supabase/migrations/085_call_pipeline.sql
DEVIATIONS FROM SPEC:
- The unique index on retell_call_id covers the whole column, not just `WHERE retell_call_id IS NOT NULL`. A PostgREST upsert with `onConflict: 'retell_call_id'` (G1.4) can't target a partial index. NULLs are still distinct, so the behaviour is the same.
- Before creating the index, the migration clears duplicate retell_call_id values (keeping the oldest), so creating the index can't fail on old stub ids.
- The tracked_items.call_reminder column for G1.6 is NOT in 085, because of the one-file-per-phase rule. It will be its own migration (086), which moves G2 to 087+.
- `CREATE POLICY` is preceded by `DROP POLICY IF EXISTS` so the migration can be re-run safely.

NEXT:
- Wait for the human to reply DONE after running 085, then verify G1.1 against the DB (columns, nullable member_id, enum 'onboarding', inbound_call_log RLS)
- Then start G1.2 (lib/voice/agents.ts)
---

---
SESSION: 1 (continued)
DATE: 2026-09-30
PHASE: G1.1–G1.5 done; G1.6 next
STATUS: IN_PROGRESS
BRANCH: gaps/g1

CHECKLIST: G1.1 3/3 · G1.2 5/5 · G1.3 5/5 · G1.4 13/13 · G1.5 7/7
- [x] G1.1 — scripts/verify-085.ts: columns, nullable member_id, all 6 call_type values, unique index + upsert, inbound_call_log RLS (anon blocked). The Management API token was 401, so the checks are behavioural, not catalog.
- [x] G1.2 — scripts/test-agents.ts: 12 agents, all round-trip, Joy stub log, "RETELL_GRACE_AGENT_ID is not set"
- [x] G1.3 — scripts/test-retell-webhook.ts g13: unsigned/forged → 401 with no writes, signed → 200, update_call_preferences via webhook and direct route, no fetch() in webhook
- [x] G1.4 — scripts/test-retell-webhook.ts g14 (22 checks): save, idempotent (x2 + call_analyzed), Rosa phone match, unknown → inbound_call_log, crisis (3 rows), no false positive, Hope task, missed + alert, crisis-failure task, summary, mood, family over real HTTP (/api/calls + /dashboard/calls page) has no transcript
- [x] G1.5 — scripts/test-aria-schedule.ts: welcome_call once, onboarding call for opted-in, aria_intro once, risk → task not call, portal PATCH as a signed-in member → false
- tsc clean; lint 280 errors (baseline 285)

FILES (G1.2–G1.5): lib/voice/{agents,verifyRetell,phone,processCallEnded,ariaSchedule}.ts, lib/voice/tools/*, app/api/webhooks/retell/route.ts, app/api/retell/tools/*/route.ts, app/api/cron/aria-calls/route.ts (thin wrapper), lib/alerts/detectCrisis.ts, lib/services/AnthropicAiProvider.ts, lib/stubs/{StubAiProvider,StubCallProvider}.ts, lib/data/calls.ts, app/api/calls/route.ts, dashboard components (FamilyCall type), types/database.ts, scripts/test-*.ts, scripts/lib/testSession.ts

SQL FOR HUMAN TO RUN: none pending
DEVIATIONS FROM SPEC:
- G1.4: added 10 suicidal-ideation phrases to CRISIS_PHRASES (the checklist phrase wasn't in the list). The crisis scan runs on member speech only, so the agent's own "call 911" lines can't trigger it.
- G1.4: processed_at is set when the call is claimed right after save (atomic), not at step 9, so concurrent call_ended + call_analyzed deliveries can't double-escalate.
- G1.4: the Hope unknown caller gets an urgent care-team SMS instead of a navigator Realtime notification (the schema can't address navigators; see Found along the way).
- G1.4: implemented AnthropicAiProvider.generateCallSummary/extractCallScores (claude-opus-5-5, low effort, server-side refusal fallback); they threw before. The stub extractCallScores now returns mood 7 / energy 7 when there is member speech.
- G1.4: family call data excludes transcript, recording_url and phone numbers (FAMILY_CALL_COLUMNS).
- G1.5: cron logic moved to lib/voice/ariaSchedule.ts (runAriaSchedule, optional memberIds scope) so tests don't touch real members. Welcome tasks are limited to members created in the last 7 days; aria_intro uses a 21–28 day window; the elevated-risk task dedupes on an open task.
- G1.3: tool bodies moved behaviour-for-behaviour (.single → .maybeSingle); their pre-existing DB bugs are logged, not fixed.

NEXT:
- G1.6: create migration 086_tracked_items_call_reminder.sql (tracked_items.call_reminder boolean), commit, ask the human to run it
- Then Joy in app/api/cron/celebrations/route.ts and Grace in app/api/cron/tracked-item-reminders/route.ts. CallContext needs a dynamicVariables field for celebration_type/item_name/due_date.
- Then G1 human review + PR gaps/g1 → main, set AWAITING_APPROVAL
---

---
SESSION: 2
DATE: 2026-09-30
PHASE: G1.6 — Joy + Grace outbound
STATUS: AWAITING_SQL
BRANCH: gaps/g1

CHECKLIST: 1 of 5 passed
- [ ] Birthday member (opted in) → joy call — needs 086 (script: scripts/test-outbound-triggers.ts)
- [ ] Birthday member with recent grief request → no Joy call, skip logged — needs 086
- [ ] Appointment tomorrow with call_reminder=true → grace call — needs 086
- [ ] Non-opted-in member → no Joy/Grace call — needs 086
- [x] npx tsc --noEmit passes — clean; lint 280 errors (no new)

FILES:
- supabase/migrations/086_tracked_items_call_reminder.sql — CREATED: tracked_items.call_reminder boolean NOT NULL DEFAULT false
- lib/voice/outboundTriggers.ts — CREATED: runJoyCalls / runGraceCalls (opt-in, grief skip, one call per member per day, scheduled check_in_calls row, optional memberIds scope for tests)
- app/api/cron/celebrations/route.ts, app/api/cron/milestones/route.ts — MODIFIED: call runJoyCalls after creating events
- app/api/cron/tracked-item-reminders/route.ts — MODIFIED: calls runGraceCalls
- lib/interfaces/CallProvider.ts, lib/services/RetellCallProvider.ts, lib/stubs/StubCallProvider.ts — MODIFIED: CallContext.dynamicVariables (spread first, so it can never override member_id/call_type)
- types/database.ts — MODIFIED: tracked_items.call_reminder
- scripts/test-outbound-triggers.ts — CREATED

SQL FOR HUMAN TO RUN: supabase/migrations/086_tracked_items_call_reminder.sql
DEVIATIONS FROM SPEC:
- Joy runs as its own pass over today's celebration_events (birthdays + milestones). The existing cron creates birthday rows up to 7 days early and skips existing rows, so hooking into that loop would never fire on D-0. Milestones are created by the 09:00 milestones cron, after the 08:00 celebrations cron, so that cron calls runJoyCalls too. One Joy call per member per day.
- Grief skip covers any grief_support_request created in the last 90 days, whatever its status (statuses are free text: pending/matched/completed).
- Grace calls when an item is due tomorrow AND call_reminder=true (the checklist's reading). Several items for one member become one call.
- Migration is 086, not part of 085 (one file per phase), so G2's migrations start at 087.

NEXT:
- Wait for DONE on 086, then run: npx tsx scripts/test-outbound-triggers.ts
- If it passes: mark G1.6 COMPLETE, run the G1 human review steps, open PR gaps/g1 → main, set AWAITING_APPROVAL and stop
---

---
SESSION: 3
DATE: 2026-09-30
PHASE: G1.6 — Joy + Grace outbound; G1 checkpoint
STATUS: AWAITING_APPROVAL
BRANCH: gaps/g1 (origin/main merged in)

CHECKLIST (stub mode, Codespace): all items [x]; live items [~]
- [x] G1.6 birthday member (opted in) → Joy call — stub log: joy, RETELL_JOY_AGENT_ID, vars celebration_type,personal_line
- [x] G1.6 recent grief request → no Joy call, skip logged
- [x] G1.6 appointment tomorrow + call_reminder → Grace call (vars item_name,due_date)
- [x] G1.6 non-opted-in → no Joy/Grace; call_reminder=false → no Grace; Joy twice → one call
- [x] G1.6 tsc clean; lint 280 errors (no new)
- [x] Regression, all suites against scripts/dev-stub-server.sh: verify-085 8/8, test-agents 18/18, test-env-placeholders 13/13, test-retell-webhook 31/31, test-aria-schedule 10/10, test-outbound-triggers 10/10; zero real-provider log lines
- [~] G1.2 real call placed with each agent's ID — needs live test (G1_LIVE_TEST L7, L10, L11)
- [~] G1.3 real Retell signature accepted; which key Retell signs with (RETELL_WEBHOOK_SECRET vs RETELL_API_KEY) — needs live test (L3)
- [~] G1.4 real inbound Rosa call saved with AI summary + mood — needs live test (L4); unknown caller (L5); Hope (L6); crisis on a real call (L7); family view on production (L12)
- [~] G1.3/G1.4 real custom-function tool call from Retell — needs live test (L8)
- [~] G1.5 non-opted-in member gets no real call + welcome task — needs live test (L9)
- [~] G1.6 real Joy and Grace calls — needs live test (L10, L11)

FILES:
- lib/env.ts — MODIFIED: envKey() treats empty / "[…]" values as missing
- lib/providers.ts — MODIFIED: every resolver uses envKey()
- lib/voice/verifyRetell.ts — MODIFIED: RETELL_WEBHOOK_SECRET first, then RETELL_API_KEY (spec change on main)
- lib/voice/agents.ts, lib/services/RetellCallProvider.ts — MODIFIED: envKey()
- scripts/dev-stub-server.sh — CREATED: next dev with every real provider blanked (wins over .env.local)
- scripts/test-env-placeholders.ts — CREATED
- gaps/G1_LIVE_TEST.md — CREATED: live test script for production after merge

SQL FOR HUMAN TO RUN: none
DEVIATIONS FROM SPEC: G1.6 deviations are in the Session 2 entry. New testing rules from main applied (stubs only in the Codespace; live items marked [~]).

NEXT:
- Human: review and merge the gaps/g1 PR, run gaps/G1_LIVE_TEST.md on production, report L1–L12 results, reply APPROVED
- Then fix any live-test failures on a new branch, and start G2 (branch gaps/g2 from main; G2 migrations start at 087)
---
