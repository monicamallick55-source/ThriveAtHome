# Thrive@Home — Build Progress Log

> **APPEND ONLY. Never edit or delete previous entries. Always add new entries at the bottom.**
> This file is the memory of the build. Every session starts by reading it completely.

---

## Rules for this file

**At the start of every session:**
1. Read this file from top to bottom
2. Find the last session entry — that tells you exactly where you are
3. Cross-reference with `checklist.md` to confirm the current phase status
4. Read `prompt.md` for the current phase instructions before writing any code

**At the end of every session (before closing):**
1. Append a new entry using the exact format below
2. Be specific — list every file touched, every test run, every decision made
3. If you are mid-phase, say so and describe exactly what remains
4. Update `checklist.md` to reflect the current phase status

**Never:**
- Edit a previous entry
- Delete a previous entry
- Summarise or collapse entries
- Leave the file without appending an entry when ending a session

The full history must be preserved so any future session can reconstruct the exact state of the codebase without running it.

---

## Entry format (copy this exactly)

```
---
SESSION: [number — increment by 1 each session]
DATE: [YYYY-MM-DD UTC]
LAYER: [1 / 2 / 3 / 4]
PHASE: [phase number] — [phase name]
STATUS: [STARTED | IN_PROGRESS | BLOCKED | APPROVED_AND_COMPLETE]
HUMAN_APPROVAL: [PENDING | RECEIVED | N/A]

WHAT WAS DONE:
- [full path of every file created, e.g. /lib/supabase/client.ts — CREATED]
- [full path of every file modified, e.g. /lib/providers.ts — UPDATED: added AnthropicAiProvider]
- [every Supabase table created or altered, e.g. realtime_notifications table — CREATED]
- [every external service configured, e.g. Retell AI agent "Aria" — CREATED in dashboard]
- [every npm package installed]
- [every environment variable added to .env.local or Vercel]

TESTS RUN:
- [Test ID from tests.md]: PASSED — [one sentence: what specifically was verified]
- [Test ID]: FAILED — [exact failure: what was seen vs what was expected]
- [Test ID]: SKIPPED — [reason: always a blocker, never convenience]

ERRORS ENCOUNTERED:
- [exact error message] — [root cause] — [resolution, or UNRESOLVED if still open]

DECISIONS MADE:
- [any implementation or architectural decision future sessions must know about]
- [any deviation from prompt.md and the justification]

HUMAN APPROVAL STATUS:
- [Phase review presented to user: YES / NO]
- [User response: APPROVED / ISSUE: <description> / PENDING]
- [If ISSUE: what was fixed and re-tested before re-presenting]

NEXT SESSION MUST:
- [first specific action — be exact, e.g. "Run T3.1 cross-user RLS test from tests.md"]
- [second action]
- [any blockers requiring human input before code can proceed]
---
```

---

## Architecture decisions log

Record significant decisions here so they are never forgotten. Update when a new decision is made.

| Decision | Made in | Rationale |
|----------|---------|-----------|
| Supabase Realtime is the primary notification channel — built before SMS/email | Phase 9 | Eliminates dependency on paid services for core feature. Works from day one. |
| All external paid services built behind interfaces with stubs | Phase 1 | Entire product is testable and demable before any service account is needed |
| Billing (Stripe) is Layer 4 — last feature added | Phase 1 | Product is fully functional without billing. Billing is a feature, not infrastructure. |
| Plan selection not in onboarding form until Layer 4 | Phase 6 | Members default to `plan_tier = 'basics'`. Plan selection added in Phase 26. |
| `providers.ts` is the single file that selects stub vs real | Phase 1 | All application code imports from there only. Nothing else changes when activating real services. |
| Crisis disambiguation defaults to TRUE when Claude API fails | Phase 13 | False positive (unnecessary escalation) is always safer than false negative (missed crisis) |
| Webhook routes return 200 even when handler fails | Phase 17 | Non-200 causes Retell/Stripe to retry indefinitely, potentially duplicating actions |
| Deduplication queries use `.maybeSingle()` not `.single()` | Phase 10 | `.single()` throws when no rows found, which is the expected case for deduplication checks |

---

## Session log

---
SESSION: 1
DATE: [not yet started — fill in when first session begins]
LAYER: N/A
PHASE: 0 — Pre-build setup
STATUS: NOT_STARTED
HUMAN_APPROVAL: N/A

WHAT WAS DONE:
- Agent instruction files created: prompt.md, tests.md, human_review.md, checklist.md, progress.md, dev_setup.md
- No application code written yet
- No Supabase tables created yet
- No external services configured yet

TESTS RUN:
- None

ERRORS ENCOUNTERED:
- None

DECISIONS MADE:
- Build follows 4-layer structure: Layer 1 (Core, Phases 1–12) → Layer 2 (AI & Calls, Phases 13–17) → Layer 3 (Notifications, Phases 18–23) → Layer 4 (Billing, Phases 24–29)
- Supabase Realtime is the notification system in Layers 1 and 2; SMS and email added in Layer 3; billing in Layer 4
- All phases require APPROVED from human before proceeding to next phase
- No phase is complete until the test in tests.md passes and the human review in human_review.md is confirmed

HUMAN APPROVAL STATUS:
- No review presented yet

NEXT SESSION MUST:
- Verify all accounts in dev_setup.md are created before starting Phase 1
- Begin Phase 1: Project Scaffold
- Read prompt.md Phase 1 section completely before writing any code
- Read tests.md Phase 1 section before running any test
- Confirm: GitHub repo `thrive-at-home` exists, Vercel is connected to GitHub, Supabase project is created and credentials are collected. These three are the only requirements for Phase 1.
---
