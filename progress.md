# Thrive@Home — Build Progress Log (v1.0)

> **APPEND ONLY. Never edit or delete a previous entry.**
> This is the persistent memory of the build. Every session starts by reading it top to bottom.
> Every session ends by appending an entry — even if mid-phase or blocked.

---

## Rules

**Start of every session:**
1. Read this file top to bottom
2. Find the last entry's `NEXT SESSION MUST` — resume exactly from there
3. Cross-reference `checklist.md` to confirm current phase status
4. Read `prompt.md` Section 8 for the current phase instructions before writing any code
5. If last session ended at `[A]` (awaiting approval) — do NOT begin the next phase. Ask: "I'm waiting for your APPROVED on Phase [N]. Shall I proceed?"

**End of every session:**
Append an entry using the exact format below. Even for a 10-minute session. Even if blocked.

---

## Entry format

```
---
SESSION: [number — increment by 1]
DATE: [YYYY-MM-DD UTC]
MILESTONE: [M1–M6]
PHASE: [N] — [name]
STATUS: [IN_PROGRESS | AWAITING_APPROVAL | APPROVED_COMPLETE | BLOCKED | NOT_STARTED]
HUMAN_APPROVAL: [PENDING | RECEIVED — "APPROVED" | RECEIVED — "ISSUE: [description]" | N/A]

INNER LOOP STATE AT END OF SESSION:
- Phase checklist: [X of Y items [x]]
- Current item: [which checklist item was being worked on]
- Loop state: [WORKING | TESTING | DEBUGGING | BLOCKED]

STUB STATUS:
- aiProvider: [StubAiProvider / AnthropicAiProvider]
- callProvider: [StubCallProvider / RetellCallProvider]
- smsProvider: [StubSmsProvider / TwilioSmsProvider]
- emailProvider: [StubEmailProvider / SendGridEmailProvider]
- billingProvider: [StubBillingProvider / StripeBillingProvider]
- transportProvider: [StubTransportProvider / real]
- mealProvider: [StubMealProvider / real]
- goodsProvider: [StubGoodsProvider / real]

WHAT WAS DONE THIS SESSION:
- [/full/path/file.ts — CREATED]
- [/full/path/file.ts — MODIFIED: what changed]
- [Supabase: table/policy/Edge Function created or modified]
- [npm package installed: name@version]
- [env var added to .env.local / Vercel: VARIABLE_NAME]

TESTS AND VERIFICATIONS RUN:
- [checklist item]: PASSED — [what was observed]
- [checklist item]: FAILED — [observed vs expected]
- [checklist item]: BLOCKED — H1: [tried] → [result]; H2: [tried] → [result]; H3: [tried] → [result]

ERRORS ENCOUNTERED:
- [exact error message] — [root cause identified] — [resolution, or UNRESOLVED]

DECISIONS MADE:
- [any architectural or implementation decision that affects future sessions]
- [any deviation from prompt.md with explicit justification]

HUMAN APPROVAL:
- Review presented: YES / NO
- User response: APPROVED / ISSUE: [description] / PENDING / N/A

NEXT SESSION MUST:
- [first specific action — exact file name, function, step, or verification to run]
- [second specific action]
- [any env var, manual Supabase step, or human input needed before code can proceed]
---
```

---

## Architecture decisions log

Permanent decisions recorded here. Updated when a new decision is made.

| Decision | Session | Rationale |
|----------|---------|-----------|
| Supabase Edge Functions for all server-side business logic | 1 | Edge performance, clean separation, positions for future scalability |
| Supabase Realtime is the sole in-browser notification channel in M1–M6 | 1 | No external paid service needed. SMS and email are Add-Ons in M10. |
| All 8 service interfaces and stubs created in Phase 1 | 1 | Real services add zero existing code changes — only providers.ts and new implementation file |
| Billing is M11 — not infrastructure, a feature added last | 1 | Product fully functional without billing |
| Plan selection not in onboarding until M11 | 1 | Members default to `plan_tier = 'basics'`. Plan selection added when Stripe is connected. |
| `providers.ts` is the single file that selects stub vs real | 1 | Application code never changes when activating a real service |
| Crisis disambiguation stub returns `false` in v1 | 1 | No real calls in M1–M6. False positive safer than false negative — real disambiguation in M8. |
| `.maybeSingle()` throughout — `.single()` banned | 1 | `.single()` throws on zero rows — valid state in deduplication and existence checks |
| BLOCKED state halts after 3 hypotheses | 1 | Prevents spinning on unsolvable problems. Human input required. |
| Placeholder pages for all M7–M18 routes created in Phase 1 | 1 | App never 404s. No business logic in placeholders. |

---

## Session log

---
SESSION: 1
DATE: [not yet started — fill in when first session begins]
MILESTONE: N/A
PHASE: 0 — Pre-build planning
STATUS: NOT_STARTED
HUMAN_APPROVAL: N/A

INNER LOOP STATE AT END OF SESSION:
- Phase checklist: N/A (no application phase yet)
- Current item: N/A
- Loop state: N/A

STUB STATUS:
- All 8 providers are stubs (no application exists yet)

WHAT WAS DONE THIS SESSION:
- prompt.md v1.0 created (agentic loop protocol, debugging protocol, all edge cases)
- checklist.md v1.0 created (BLOCKED state, STATUS field, verification methods per item)
- progress.md v1.0 created
- tests.md v1.0 created
- human_review.md v1.0 created
- dev_setup.md v1.0 created
- No application code written
- No Supabase tables created
- No external services configured

TESTS AND VERIFICATIONS RUN:
- None

ERRORS ENCOUNTERED:
- None

DECISIONS MADE:
- Agentic loop protocol embedded in Section 1 of prompt.md: WORKING → TESTING → (PASS: mark [x]) / (FAIL: DEBUGGING sub-loop → 3 hypotheses → BLOCKED)
- Inner loop matches SVG diagram: persistent state (PROMPT.md + PROGRESS.md) → Phase N begins → inner debug loop → exit gate → human checkpoint → Phase N+1
- Checklist items each have a specific verification method — not just a description
- Section 3 of prompt.md is a dedicated debugging protocol with symptom-by-symptom diagnosis steps

HUMAN APPROVAL:
- No review presented

NEXT SESSION MUST:
- Confirm all items in dev_setup.md are complete before starting Phase 1
- Confirm: GitHub repo `thrive-at-home` (Private) exists, Vercel is connected to GitHub, Supabase project is created and 3 credentials are saved, CRON_SECRET is generated and saved as a Codespace Secret
- Begin Phase 1 by reading prompt.md Section 8 Phase 1 instructions completely
- First action: create `.gitignore` BEFORE creating any other file
- Second action: verify `.gitignore` with `echo "TEST=secret" > .env.local && git status` — MUST appear under "Untracked files" only before continuing
---


---

## DECISION LOG — September 2026

DECISION: AI voice agent architecture finalized — 12 named agents with distinct personalities:
1. Aria (daily companion outbound) — RETELL_AGENT_ID
2. Rosa (Care Line inbound) — RETELL_ROSA_AGENT_ID
3. Joy (celebration outbound) — RETELL_JOY_AGENT_ID
4. Grace (reminder outbound) — RETELL_GRACE_AGENT_ID
5. Hope (crisis line inbound 24/7) — RETELL_HOPE_AGENT_ID
6. Claire (family support inbound) — RETELL_CLAIRE_AGENT_ID
7. Sam (volunteer support inbound) — RETELL_SAM_AGENT_ID
8. Morgan (buddy support inbound) — RETELL_MORGAN_AGENT_ID
9. Nova (navigator assist internal) — RETELL_NOVA_AGENT_ID
10. Alex (staff support inbound) — RETELL_ALEX_AGENT_ID
11. Quinn (concierge 24/7 + Language Line bridge) — RETELL_QUINN_AGENT_ID
12. Jordan (partner support B2B) — RETELL_JORDAN_AGENT_ID

All 12 agents built in Retell AI. Agent IDs need adding to Vercel.
Multilingual agents (Ming/Devi/Luna) deferred to Phase 55.
When building UI copy referencing agents: use the correct agent name per role.

DECISION: Aria calls are OPT-IN ONLY. Default = false. members.aria_call_opted_in = false.
Migrations 069 (aria_call_opted_in) and 070 (member_privacy_settings) confirmed in Supabase.

DECISION: Phase 55 (Multilingual UI + agents) deferred until after production launch + first revenue.
Language Line (via Quinn) handles non-English callers as bridge until Phase 55 ships.

PENDING ACTIVATIONS (in order):
1. Add all 12 Retell agent IDs to Vercel env vars
2. Set webhook URL in each Retell agent: https://thrive-at-home-pied.vercel.app/api/webhooks/retell
3. Create Twilio account + buy 7 phone numbers + sign Twilio BAA (instant)
4. Add Anthropic API key to Vercel
5. Verify SendGrid domain authentication
6. Contact Supabase for HIPAA tier upgrade
7. Email Anthropic + Retell AI for BAAs
8. Create Checkr account for volunteer background checks
9. Contact Meals on Wheels Bay Area chapter (free, no API)
10. Switch Stripe to live mode when ready for real payments

ISSUE: Pattern 'admin.from as any' assigned to a variable named 'from' causes TypeError at runtime in Vercel production. Search the entire codebase for this pattern: 'const from = admin.from as any' and replace ALL occurrences with 'const db = admin as any' and update all subsequent 'from(' calls to 'db.from('. Files already fixed: app/api/invitations/route.ts, app/api/invitations/accept/route.ts, lib/auth.ts. Search for remaining instances in all other API routes and lib files.
