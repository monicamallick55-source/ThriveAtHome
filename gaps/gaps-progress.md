# Gap Build — Progress Log

> **Append-only below "Session log".** The phase table is the only part edited in place.
> Every session starts by reading this file and ends by appending an entry.

## Phase status

Status values: `NOT_STARTED` · `IN_PROGRESS` · `AWAITING_SQL` · `AWAITING_APPROVAL` · `COMPLETE` · `BLOCKED`

| Phase | Name | Status | Migration | Commit |
|---|---|---|---|---|
| G1.1 | Call record schema fix | AWAITING_SQL | 085 | f2aba4e |
| G1.2 | Agent registry (12 agents) | NOT_STARTED | — | |
| G1.3 | Webhook security | NOT_STARTED | — | |
| G1.4 | Call-ended processing | NOT_STARTED | — | |
| G1.5 | Aria opt-in + Launch Protocol | NOT_STARTED | — | |
| G1.6 | Joy + Grace outbound | NOT_STARTED | 086 (tracked_items col, planned — own file per phase rule) | |
| **G1** | **Human review** | NOT_STARTED | | PR: |
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
