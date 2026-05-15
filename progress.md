# Thrive@Home — Build Progress Log (v1.0 — M1–M6)

> **APPEND ONLY. Never edit or delete previous entries.**
> This is the build's memory. Read the entire file at the start of every session.

---

## Rules

**Start of every session:**
1. Read this file from top to bottom
2. Find the last entry — it tells you exactly where you are
3. Cross-reference `checklist.md` for current phase status
4. Read `prompt.md` for the current phase instructions before writing any code

**End of every session:**
1. Append a new entry using the exact format below
2. List every file touched, every test run, every decision made
3. If mid-phase: describe exactly what remains in `NEXT SESSION MUST`
4. Update `checklist.md` to reflect current status

**Never:** edit a previous entry, summarise entries, or close without appending.

---

## Entry format

```
---
SESSION: [number — increment by 1]
DATE: [YYYY-MM-DD UTC]
MILESTONE: [M1–M6]
PHASE: [number] — [name]
STATUS: [STARTED | IN_PROGRESS | AWAITING_APPROVAL | APPROVED_COMPLETE | BLOCKED]
HUMAN_APPROVAL: [PENDING | RECEIVED — "APPROVED" | RECEIVED — "ISSUE: description" | N/A]

WHAT WAS DONE:
- [/full/path/to/file.ts — CREATED]
- [/full/path/to/file.ts — MODIFIED: what changed]
- [Supabase: table/function/policy created or changed]
- [npm package installed: name@version]
- [Env var added to .env.local and/or Vercel: VARIABLE_NAME]
- [Edge Function deployed: function-name]

TESTS RUN:
- [Test ID from tests.md]: PASSED — [what was verified]
- [Test ID]: FAILED — [observed vs expected]
- [Test ID]: SKIPPED — [reason — must be a blocker, never convenience]

STUB STATUS (at end of this session):
- aiProvider: [StubAiProvider | AnthropicAiProvider]
- callProvider: [StubCallProvider | RetellCallProvider]
- smsProvider: [StubSmsProvider | TwilioSmsProvider]
- emailProvider: [StubEmailProvider | SendGridEmailProvider]
- billingProvider: [StubBillingProvider | StripeBillingProvider]
- transportProvider: [StubTransportProvider | LyftTransportProvider]
- mealProvider: [StubMealProvider | InstacartMealProvider]
- goodsProvider: [StubGoodsProvider | RealGoodsProvider]

ERRORS ENCOUNTERED:
- [error message] — [root cause] — [resolution or UNRESOLVED]

DECISIONS MADE:
- [any implementation decision future sessions must know about]
- [any deviation from prompt.md and the justification]

HUMAN APPROVAL:
- Review presented: YES / NO
- Response: APPROVED / ISSUE: [description] / PENDING
- If ISSUE: what was fixed before re-presenting

NEXT SESSION MUST:
- [first specific action — name the file and function]
- [second action]
- [any blockers needing human input]
---
```

---

## Architecture decisions

| Decision | Phase | Rationale |
|----------|-------|-----------|
| All server-side business logic in Supabase Edge Functions, not Next.js API routes | Phase 1 | Cleaner architecture, no Vercel cold-start on business logic, separates concerns |
| All 8 service interfaces and stubs created in Phase 1 | Phase 1 | Product works and is testable before any paid service is connected |
| No plan selection in onboarding until M11 (Billing Add-On) | Phase 6 | Product is fully functional without billing. plan_tier defaults to 'basics'. |
| Supabase Realtime is the only notification channel in M1–M6 | Phase 9 | No external service needed. Real SMS/email added in M10 Add-On. |
| Placeholder pages for all M7–M18 routes created in Phase 1 | Phase 1 | App navigates cleanly from day one. No 404s. No implementation in placeholders. |
| `.maybeSingle()` not `.single()` for all deduplication and existence queries | Phase 4 | `.single()` throws when no rows found — the expected state in deduplication |
| Crisis detection runs FIRST in every call processing pipeline | Phase 11 | Patient safety — can never be skipped or deprioritised |
| Supabase Storage for document vault with private bucket + signed URLs | Phase 14 | Health documents require access control — never public URLs |

---

## Session log

---
SESSION: 1
DATE: [not yet started — fill in when first session begins]
MILESTONE: N/A
PHASE: 0 — Pre-build planning
STATUS: NOT_STARTED
HUMAN_APPROVAL: N/A

WHAT WAS DONE:
- prompt.md v1.0 created — covers M1–M6 (Phases 1–14)
- checklist.md v1.0 created — 14 phases
- tests.md v1.0 created — tests for all 14 phases
- human_review.md v1.0 created — human checklist for all 14 phases
- progress.md v1.0 created — this file

TESTS RUN:
- None — no application code exists yet

STUB STATUS:
- All 8 providers: Stub (no application exists yet)

ERRORS ENCOUNTERED:
- None

DECISIONS MADE:
- Build scope: prompt.md v1 covers M1–M6 only (Phases 1–14)
- M7–M12: Add-On milestones, appended as a separate document when M6 is complete
- M13–M18: Advanced features, separate document appended after M12
- No Stripe, Retell AI, Twilio, Anthropic, SendGrid credentials needed for M1–M6
- Only credentials needed to start: GitHub, Vercel, Supabase (URL + anon key + service role key)
- All server-side business logic uses Supabase Edge Functions
- Placeholder pages for all future routes created in Phase 1

HUMAN APPROVAL:
- No review presented

NEXT SESSION MUST:
- Confirm GitHub repo `thrive-at-home` (Private) exists
- Confirm Vercel is connected to GitHub
- Confirm Supabase project is created and all 3 credentials are saved:
  NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
- Confirm CARE_TEAM_EMAIL is decided (your email for now)
- Generate CRON_SECRET: run `openssl rand -base64 32` in Codespace terminal and save it
- Read prompt.md Phase 1 section completely before writing any code
- Begin Phase 1: Project Scaffold
---
