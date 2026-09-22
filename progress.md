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

ISSUE: signed_by_name shows "Agency Admin" instead of the real staff member's full name. Find where signed_by_name is populated in agency admin routes and replace with the actual full_name from family_members table.

ISSUE: buddy_calls count query failing silently — the count of completed buddy calls is not displaying correctly in the navigator console and member portal. Find the buddy_calls or buddy_assignments query and fix the count aggregation.

ISSUE: Member portal hydration error — React hydration mismatch on the member portal page. Find and fix mismatched server/client rendering, likely caused by date formatting or conditional rendering that differs between server and client.

ISSUE: Important Dates save/display bug — important dates entered by members or navigators are not saving or displaying correctly. Find the tracked_items or important_dates table query and fix the insert/select.

ISSUE: Pricing/upgrade page shows user as signed out — the /pricing page is not reading the session correctly and shows a signed-out state even when the user is logged in. Fix the session check on the pricing page.

NEXT SESSION MUST:
- Fix ALL issues logged above in order
- Start with: grep -r "const from = admin.from as any" --include="*.ts" --include="*.tsx" . to find all remaining instances of the admin.from pattern
- Fix each file found using the db = admin as any pattern
- Then fix signed_by_name, buddy_calls count, hydration error, important dates, pricing page in order
- Commit after each fix with descriptive message
- Push and verify Vercel deployment is green after each batch

---
SESSION: (continuation — resumed from NEXT SESSION MUST above)
DATE: 2026-09-16
STATUS: Session ended normally

WHAT WAS DONE THIS SESSION:
- Verified `admin.from as any` pattern: no remaining instances (grep clean) — already fully fixed in prior commit.
- Verified signed_by_name and buddy_calls count: already fixed in commit a83323e (prior session) — confirmed via `git show --stat`, no further action needed.
- Important Dates save/display bug — ROOT CAUSE FOUND: /api/tracked-items (GET/POST), /api/tracked-items/[id] (PATCH/DELETE), /api/tracked-items/upload, and /api/tracked-items/signed-urls all resolved the caller's member via `getFamilyMemberByAuthId` ONLY. A senior who signed up directly (members.supabase_auth_id, added in migration 049) has no family_members row, so every one of these routes 404'd/403'd for that user. The RLS policy on tracked_items (031_tracked_items.sql) had the same gap — only checked family_members, never members.supabase_auth_id. Fixed:
  - app/api/tracked-items/route.ts — added resolveMemberContext() helper trying getMemberByDirectAuth first, falling back to getFamilyMemberByAuthId; created_by is now null (not a crash) when there's no family_members row.
  - app/api/tracked-items/[id]/route.ts — verifyOwnership now checks both auth paths; changed the two navigator_tasks inserts from owned.fm.member_id (would NPE for direct-auth members) to owned.item.member_id; changed remaining .single() calls to .maybeSingle().
  - app/api/tracked-items/upload/route.ts, app/api/tracked-items/signed-urls/route.ts — same dual-auth-path fix, plus .single() → .maybeSingle().
  - supabase/migrations/076_tracked_items_direct_member_auth.sql — CREATED. New RLS policy "member_direct_own_tracked_items" granting members.supabase_auth_id = auth.uid() access, mirroring the existing family_members policy.
- Pricing page shows signed out — code logic in getCurrentUser()/lib/supabase/server.ts was actually correct (proxy.ts already refreshes and forwards session cookies on every request, matcher covers /pricing). No proof of a session-refresh bug. Applied the standard defensive fix: added `export const dynamic = 'force-dynamic'` to app/pricing/page.tsx so it can never be served from a static/cached render regardless of Next 16's dynamic-API auto-detection. Confirmed via `npm run build` that /pricing now lists as ƒ (dynamic) in the route output.
- Member portal hydration error — the specific age-calculation hydration bug (local-timezone Date vs UTC) was already fixed in an earlier commit (e858a24), which anchored `today` to UTC midnight with an explanatory comment. Found one remaining inconsistency in the same file: `daysSinceJoined` (Aria intro-prompt timing) still used raw `Date.now()` instead of the anchored `today`. Moved the UTC-anchored `today` declaration earlier in components/MemberPortalClient.tsx and reused it for daysSinceJoined, removing the duplicate `today` declaration further down. No other hydration-mismatch pattern (Math.random(), typeof window in render body, non-UTC date formatting) found via static review of this file.

VERIFICATION:
- `npx tsc --noEmit`: zero errors.
- `npm run build`: succeeds, zero errors; /pricing confirmed dynamic (ƒ) in build output.
- NOT verified: no live browser/Supabase session available in this Codespace (per prior session's noted limitation) — the tracked_items fix and pricing fix are correct by code+RLS review and compile/build clean, but have not been exercised against a real direct-auth senior login or a real expiring session in a browser. Recommend a manual smoke test after deploy: (1) log in as a direct-auth senior (members.supabase_auth_id, no family_members row) and add/edit/delete an Important Date; (2) log in as a family member, visit /pricing, confirm "My plan & billing" (not "Sign in") appears.

DECISIONS MADE:
- Did not attempt to fix the same family_members-only RLS gap across the ~40 other member-scoped tables that share this pattern (checked via grep — it's pervasive, dating from before migration 049 added direct member auth). Scoped this session strictly to tracked_items as asked. Flagging this as a known systemic gap for a future dedicated session if direct-senior-login usage grows.

NEXT SESSION MUST:
- Manually smoke-test the two live-only-verifiable fixes above once deployed (direct-auth senior + Important Dates; signed-in user + /pricing).
- Vercel deployment status could NOT be verified from this session — no `vercel` CLI available in this Codespace. Check the Vercel dashboard directly for commit 0c258a5 (pushed to main) to confirm the build is green.
- No other open issues from this list remain — the September 2026 issue log above is now fully addressed.
---

---
SESSION: (continuation — resumed from NEXT SESSION MUST above)
DATE: 2026-09-16
STATUS: Session ended normally

WHAT WAS DONE THIS SESSION:
- Re-read prompt.md / progress.md / checklist.md per session-start protocol.
- Re-verified the repo is still green: `npx tsc --noEmit` → zero output; `npm run build` → succeeds, `/pricing` still lists as ƒ (dynamic).
- Confirmed via `git status`/`git log` that main is up to date with origin (HEAD = b86b343), working tree clean except a routine `tsconfig.tsbuildinfo` diff (a generated build-cache file, not gitignored — recommend adding it to `.gitignore` in a future housekeeping pass since it churns every `tsc` run and adds no real signal to diffs).
- Checked the September 2026 issue log in this file: all six logged issues (admin.from pattern, signed_by_name, buddy_calls count, hydration error, Important Dates, pricing sign-out) are already fixed and committed (commits a83323e, 0c258a5, and prior). No new issues have been reported since.
- Cross-referenced checklist.md: it is the original M1–M6 scaffold-era template and was never updated past Phase 1 — it does not reflect real state. Actual milestone status lives in this file's DECISION LOG and git history: git log shows `b4c26b1 Connect Vercel auto-deploy M1-M27 complete`, i.e. M1–M27 are already built. The only documented remaining roadmap item is Phase 55 (Full Multilingual UI), which the DECISION LOG explicitly defers until after production launch + first revenue — not to be started speculatively.

TESTS AND VERIFICATIONS RUN:
- `npx tsc --noEmit`: PASSED — zero output.
- `npm run build`: PASSED — zero errors, full route manifest printed, `/pricing` dynamic.
- Live smoke tests (direct-auth senior + Important Dates; signed-in user + /pricing) and Vercel dashboard build status: NOT RUN — this Codespace has no browser, no live Supabase session, and no `vercel` CLI, as already established in prior sessions. Unchanged limitation, not a new blocker.

ERRORS ENCOUNTERED:
- None.

DECISIONS MADE:
- Did not start Phase 55 — explicit prior human decision defers it until post-launch/revenue, and no APPROVED milestone-start instruction is present for it.
- Did not touch the ~40-table direct-senior-auth RLS gap beyond the tracked_items fix already applied — flagged again below since it remains the highest-value known gap if it resurfaces as a bug report.
- Left `tsconfig.tsbuildinfo` as-is (only reverted/staged files without being asked would be out of scope) — flagged as a suggestion, not actioned.

HUMAN APPROVAL:
- Review presented: NO — no new phase or fix was built this session; this was a verify-and-status-check session with nothing new to approve.
- User response: N/A

NEXT SESSION MUST:
- There is no autonomously-actionable next milestone right now: M1–M27 are complete and green, the September issue log is fully resolved, and Phase 55 is intentionally deferred pending a human go-ahead tied to launch/revenue.
- If the human wants forward progress, the two live options are: (a) work through the "Pre-Launch Checklist — September 2026" section of checklist.md (Retell agent IDs, Twilio account/numbers, Anthropic key, BAAs, Stripe live mode, Supabase HIPAA tier) — these are almost entirely external account/credential actions outside this agent's reach, not code; or (b) explicitly approve starting Phase 55 early.
- Otherwise: awaiting the human to run the two live smoke tests noted above and confirm the Vercel build for commit 0c258a5/b86b343 is green.
QUESTION FOR HUMAN
---

## TESTING SESSION — September 21 2026
## Member Portal Test Results

BUG-001: Community page allows posting a need without joining a community first. 
Fix: Check if member has joined at least one community before showing the post-a-need form. 
If not joined, show message "Join a community first to post a need here."

BUG-002: No back navigation from donation pledge confirmation page. 
Fix: Add "Back to Dashboard" button on /donate confirmation page.

BUG-003: No back navigation from donation pledge page itself. 
Fix: Add "Back" or "Cancel" link on the donation pledge form page.

BUG-004: Org search by area code not working on My Org page. 
Fix: Check the /api/orgs/discover route — area code search query not returning results. 
Verify org_id, zip_code or area fields in orgs table are populated with test data. 
Also check the search query is actually filtering by area code correctly.

FEATURE-001: Services flow is entirely manual. 
Add: AI-assisted service request flow where Rosa (via platform) helps suggest options, 
confirms details, and schedules automatically. For now: pre-fill service type options, 
show estimated availability, auto-notify navigator on submission.

FEATURE-002: Cultural programming shows no real local events. 
Add: Events should filter by member's location/zip code. 
Show classes, potlucks, story circles happening near the member.
Allow member to choose area radius (5mi, 10mi, 25mi).

FEATURE-003: Festival calendar does not show local events. 
Add: For each festival show: local events near member, paid/free indicator, 
location, number of ThriveAtHome members attending, total community attendance.
Allow member to select area to see events.

FEATURE-004: Important Dates page is blank/manual. 
Add: AI pre-populate important dates on first load from member profile:
- Birthday (from date_of_birth)
- Prescription renewals (from tracked_items)
- Insurance renewal dates (from tracked_items)
- Any dates entered during onboarding
Show these pre-populated, allow member to add more.

FEATURE-005: Buddy page missing profile preferences and special requests. 
Add to buddy page:
- Show language preference from member profile
- Show topics of interest from member profile  
- Allow member to make special requests (language match, similar background, topics)
- Show matching criteria being used
- Add "Request an update" button to follow up on match status
- AI should auto-match based on profile — not purely manual navigator task

FEATURE-006: Life Story page is basic and manual. 
Add: AI-assisted prompts to help member tell their story:
- "What was your career?" prompt with AI follow-up questions
- "Tell us about your family" with guided prompts
- Voice-to-text option for seniors who prefer speaking
- AI organises entries into chapters automatically
- Show progress "Your life story is X% complete"

FEATURE-007: Donation page missing impact and receipt. 
Add: 
- "Your donation helped [X seniors] this month" impact statement
- "Request tax receipt" button that emails a PDF receipt
- Show previous donations and their impact

NEXT SESSION MUST:
- Fix BUG-001 through BUG-004 first (these are blocking bugs)
- Then implement FEATURE-004 (Important Dates pre-population) — highest member value
- Then FEATURE-005 (Buddy page improvements)
- Then FEATURE-007 (Donation receipt)
- Leave FEATURE-001, 002, 003, 006 for after launch — they require significant work
- After fixing bugs: commit, push, verify Vercel green
- Then continue member portal testing: Life Story, Billing, Add-Ons, Notifications tabs

BUG-005: Add-Ons tab is missing from member portal entirely.
Fix: Add Add-Ons tab to MemberPortalClient.tsx tab list. 
The tab should show 5 monthly add-ons and 4 one-time purchases from M26.
Check components/MemberPortalClient.tsx for the tabs array and add Add-Ons tab.

BUG-006: Important Dates tab does not pre-populate dates from member profile.
Fix: On load, query member's date_of_birth, tracked_items (prescriptions, renewals),
and any dates from onboarding. Pre-populate these as read-only suggested dates
with an "Add to my dates" button next to each one.

---
SESSION: (continuation — resumed from NEXT SESSION MUST above)
DATE: 2026-09-21
STATUS: Session ended normally

WHAT WAS DONE THIS SESSION:
- Found substantial uncommitted work already in the working tree at session start
  (BUG-005 Add-Ons tab, BUG-006/FEATURE-004 Important Dates pre-population, and a
  resolveMemberContext refactor for direct-senior-auth support in addon routes).
  Reviewed it file-by-file rather than redoing it.
- lib/data/members.ts — CREATED resolveMemberContext(authUserId), shared helper
  resolving memberId (+ familyMemberId when applicable) for both direct-auth
  seniors and family-linked users.
- app/api/addons/route.ts, app/api/addons/[id]/route.ts — MODIFIED to use
  resolveMemberContext instead of getFamilyMemberByAuthId-only lookup (was 400ing
  for direct-auth seniors with no family_members row).
- lib/data/tracked-items.ts — MODIFIED: replaced the write-on-page-load
  ensureBirthdayTrackedItem (mutated DB on every GET) with a pure, read-only
  getSuggestedDates(dateOfBirth, existingItems) that returns suggestions without
  touching the database. Exported new SuggestedDate type.
- app/api/tracked-items/route.ts — MODIFIED: added 'birthday' to ALLOWED_ITEM_TYPES
  so a suggested birthday can actually be POSTed and saved.
- app/dashboard/important-dates/page.tsx, components/important-dates/ImportantDatesClient.tsx
  — MODIFIED: wired getSuggestedDates() output into a "Suggested for you" section
  with per-suggestion "+ Add to my dates" button (family dashboard view).
- app/member-portal/page.tsx — MODIFIED: fetches suggestedDates plus the full
  add-ons data (catalog, memberAddons, familySeatLimit, hasLongDistanceAddon,
  videoDiary) and passes them into MemberPortalClient.
- components/MemberPortalClient.tsx — MODIFIED:
  - Added "Add-Ons" tab wired to the existing AddOnsClient component (BUG-005).
  - FOUND AND FIXED A BUG IN THE IN-PROGRESS WORK: the member-portal Important
    Dates tab received `suggestedDates`/`suggestions` state but never rendered
    it anywhere — the pre-populated suggestions were invisible to members using
    the member portal (only the separate /dashboard/important-dates family page
    had the UI wired). Added a matching "Suggested for you" card section with
    an addSuggestedDate() handler (POSTs to /api/tracked-items, moves the item
    from `suggestions` into `localItems` on success) directly in the 'dates' tab,
    and updated the empty-state condition so it doesn't show "No upcoming dates
    tracked" while there are still unaddressed suggestions.
- Audited the rest of the September 21 backlog against current main and found it
  already resolved, with no further code changes needed:
  - BUG-001 (post-a-need without joining a community) — the exact gate and
    message ("Join a community first to post a need here.") already exists at
    components/MemberPortalClient.tsx:1204-1205.
  - BUG-002/BUG-003 (donation page back navigation) — app/donate/page.tsx already
    has a top-of-page "← Back to Dashboard" link, and DonationModule
    (components/shared/DonationModule.tsx) already renders a backHref/backLabel
    button on the post-pledge confirmation screen.
  - FEATURE-005 (Buddy page preferences/requests) — language, topics of interest,
    a "Make a special request" form, and a "Request an update" button all already
    exist in the 'buddy' tab (components/MemberPortalClient.tsx:1482-1523).
  - FEATURE-007 (donation impact + receipt) — "seniors helped this month" impact
    banner, past-gifts history, and a working "Request tax receipt" button
    (POST /api/donations/[id]/receipt) all already exist in DonationModule.
- BUG-004 (org search by area code) — investigated directly against live Supabase
  data (admin client, using .env.local credentials already present in this
  Codespace). Ran the exact discover-route query logic for q="415" against the
  real community_orgs table: it correctly matched "Bay Area Village Network"
  (contact_phone "(415) 555-0191") via the existing contact_phone.ilike.%digits%
  OR-clause. No code defect found — the route's OR-filter construction
  (org_name/city/zip_code/contact_phone) is correct as written. Concluded this
  was very likely a test-data gap at the time BUG-004 was filed (one of the two
  seed orgs has contact_phone = null) rather than a live code bug; area-code
  search works correctly against current data. Left the route unchanged.

TESTS AND VERIFICATIONS RUN:
- `npx tsc --noEmit`: PASSED — zero output, after both the pre-existing diff and
  my additional MemberPortalClient fix.
- `npm run build`: PASSED — zero errors, full route manifest printed.
- BUG-004: PASSED — live query against community_orgs (admin client) for q="415"
  returned the expected org via the existing route logic; verified the exact
  .or() clause the route builds reproduces this result.
- BUG-001, BUG-002, BUG-003, FEATURE-005, FEATURE-007: verified by direct code
  read (not live/browser) — confirmed the required UI and API endpoints exist
  and are wired correctly. NOT verified live in a browser (no browser/live
  session available in this Codespace, per prior sessions' established
  limitation).
- BUG-005, BUG-006: verified by code read + tsc + build only. NOT verified live
  (same Codespace limitation) — recommend a manual smoke test after deploy:
  (1) member portal → Add-Ons tab renders catalog and existing add-ons; (2)
  member portal → Important Dates tab shows a "Suggested for you" birthday card
  for a member with date_of_birth set and no existing birthday tracked item,
  and "+ Add to my dates" successfully creates it and removes the suggestion.

ERRORS ENCOUNTERED:
- None.

DECISIONS MADE:
- Did not touch FEATURE-001, FEATURE-002, FEATURE-003, FEATURE-006 — explicitly
  deferred by the prior session's own NEXT SESSION MUST ("Leave for after
  launch — they require significant work").
- Did not modify test data for BUG-004 (e.g. backfilling contact_phone for
  "Peninsula Senior Network") since the search logic is correct and this is
  cosmetic test-data completeness, not a functional gap.

HUMAN APPROVAL:
- Review presented: NO — this remains outside the original 14-phase gated
  structure (M1–M27 already shipped; this is bug-fix/feature-request work from
  live user testing, tracked directly in this file per the established pattern
  from the 2026-09-16 sessions).
- User response: N/A

NEXT SESSION MUST:
- Commit db4e7d8 is pushed to origin/main — confirm the Vercel build is green
  for this commit.
- Run the live smoke tests listed above (Add-Ons tab, Important Dates
  suggestions) once deployed.
- The September 21 testing backlog is now fully resolved except the four
  explicitly-deferred FEATURE items (001, 002, 003, 006), which require a human
  decision on scope/priority before starting.
Session ended normally
---

DECISION: My Org tab strategy — Option C Hybrid adopted September 21 2026.
- Members with a village on ThriveAtHome: full integrated experience
- Members with village NOT on ThriveAtHome: show invite button
- Members with no village: show ThriveAtHome communities as their community layer

FEATURE-008: My Org tab — add "My village isn't listed" option
Fix: Below the org search results add:
"Don't see your village or community org? [Add it] or [Invite them to ThriveAtHome]"
"Add it" → simple form: org name, city, zip, contact email → creates pending org_suggestion record
"Invite them" → sends email to org contact introducing ThriveAtHome

FEATURE-009: My Org empty state improvement
Fix: When member has no org membership show:
"You don't belong to a village network yet — and that's okay.
ThriveAtHome is your community. Explore your [communities →]
Or [find a village near you ↓]"

BUG-007: Family dashboard — "Aria is scheduled to call margsoon" missing space between preferred name and "soon". 
Fix: Find where this string is constructed in the family dashboard component and add a space: "Aria is scheduled to call [name] soon."

---
SESSION: (continuation — resumed from NEXT SESSION MUST above)
DATE: 2026-09-21
STATUS: Session ended normally

WHAT WAS DONE THIS SESSION:
- Read prompt.md / progress.md / checklist.md per session-start protocol.
  Confirmed M1–M27 are already shipped and the original 14-phase gate is
  long complete; live work continues as the bug/feature backlog tracked
  directly in this file (established pattern since 2026-09-16).
- BUG-007 (missing space in "Aria is scheduled to call [name] soon."):
  investigated in components/dashboard/WellnessCard.tsx:233 — the JSX
  already renders `Aria is scheduled to call {member.preferred_name} soon.`
  with a real space on both sides of the expression, and `git log -p -L`
  on that line shows the space has been present since the line was created
  (commit 4708703, May 2026). Grepped the whole codebase for any other
  "scheduled to call" construction — WellnessCard.tsx is the only one.
  No code defect found; treating BUG-007 as already correct in source
  (the "margsoon" report was most likely a stale screenshot/build).
- Continued the direct-auth-senior RLS/resolution gap audit (the systemic
  issue flagged repeatedly since 2026-09-16 and being fixed incrementally
  file-by-file). Confirmed all API routes previously flagged as fixed
  (tracked-items, addons, life-story, pet-loss, video-diary, pets,
  services, circles, devices, ehr, wearables, ml/insights, skill-exchange,
  advisors, cultural, events, VITA, member/buddy-request) now correctly
  resolve both direct-auth seniors (members.supabase_auth_id) and
  family-linked users. Widened the search beyond getFamilyMemberByAuthId
  call sites to any app/api/member/** route querying family_members
  directly, and found two still gapped:
  - app/api/member/documents/route.ts — GET only resolved the caller via
    family_members; a direct-auth senior (no family_members row) silently
    got `{ data: [] }` instead of their org-shared + member-specific
    documents. FIXED: now also checks members.supabase_auth_id and uses
    whichever resolves, same pattern as sibling routes (org-id still comes
    from family_members.org_id only, matching the established org-linkage
    convention used by member/post-need and member/org-membership).
  - app/api/member/documents/[id]/route.ts — same gap in the signed-URL
    download route; a direct-auth senior would get 403 Forbidden on every
    document, even ones they own. FIXED the same way.
  - Verified the remaining app/api/member/** routes (upload-document,
    circles, org-join-request, preferences, service-history,
    org-membership, post-need, request-checkin) already have correct
    dual-path resolution — no changes needed.
  - Did not audit non-member-portal routes (app/api/documents,
    app/api/calls, app/api/messages, app/api/tasks, org-admin/*, agency/*,
    employer-admin/*, cron/*, admin/*) — these are family-dashboard or
    staff-only surfaces by design, not reachable from the member portal
    that direct-auth seniors use, so they are out of scope for this gap.

TESTS AND VERIFICATIONS RUN:
- `npx tsc --noEmit`: PASSED — zero output.
- `npm run build`: PASSED — zero errors, full route manifest printed.
- BUG-007: verified by direct code + git-blame read — no defect present.
- documents/route.ts and documents/[id]/route.ts fixes: verified by code
  read only (dual-path resolution now matches the pattern already proven
  correct in ~15 sibling routes fixed in prior sessions). NOT verified
  live — no browser or live Supabase session available in this Codespace
  (established limitation). Recommend a manual smoke test after deploy:
  log in as a direct-auth senior with no family_members row and confirm
  the member portal's Documents view lists their member-specific uploads
  and a signed download link works.

ERRORS ENCOUNTERED:
- None.

DECISIONS MADE:
- Scoped the direct-auth-senior gap audit to app/api/member/** only
  (the member-portal-facing namespace), not the full ~40-table systemic
  gap noted in the 2026-09-16 session — that remains a known gap for
  family-dashboard/admin/staff routes, which are not senior-facing and
  lower priority.

HUMAN APPROVAL:
- Review presented: NO — bug-fix work outside the original 14-phase gate,
  per established pattern.
- User response: N/A

NEXT SESSION MUST:
- Push this commit and confirm Vercel build is green.
- Run the live smoke test above (direct-auth senior → member portal →
  Documents tab) once deployed.
- No other open items remain in the bug/feature backlog above except the
  four explicitly-deferred FEATURE items (001, 002, 003, 006) and the two
  not-yet-built FEATURE-008/009 (My Org "not listed" flow + empty-state
  copy) — all require a human go/no-go on scope before starting.
Session ended normally
---

NEXT SESSION MUST:
- Build FEATURE-008: My Org tab "My village isn't listed" option
  Add below org search results:
  "Don't see your village? [Add it] or [Invite them to ThriveAtHome]"
  "Add it" → form: org name, city, zip, contact email → INSERT into org_suggestions table (create if not exists)
  "Invite them" → POST /api/orgs/invite → sends email via SendGrid to org contact

- Build FEATURE-009: My Org empty state improvement
  When member has no org membership show warm message:
  "You don't belong to a village network yet — and that's okay.
  ThriveAtHome is your community. Explore your communities → 
  Or find a village near you ↓"
  
- Build marketing home page at app/page.tsx (currently shows login redirect)
  Home page sections:
  1. Hero — "Your parent deserves a morning call, not a medical alert"
  2. How it works — 3 steps: sign up, navigator calls, Aria begins
  3. What members get — Aria, buddy, communities, services, family dashboard
  4. Who it's for — seniors aging at home, adult children, village networks
  5. Pricing preview — 4 plans with CTA
  6. Social proof placeholder — "Join [X] seniors living independently"
  7. Footer — Privacy, Terms, Crisis line, Contact

- Build /for-families page
  Target: adult children worried about aging parents
  Sections: what families see, family dashboard preview, peace of mind, how to enroll a parent
  CTA: "Enroll your parent" → /signup

- Build /for-volunteers page  
  Target: volunteers wanting to make a difference
  Sections: what volunteers do, buddy programme, time commitment, what you get
  CTA: "Apply to volunteer" → /volunteer/apply (build this too)
  /volunteer/apply: simple form: name, email, zip, availability, interests → creates pending volunteer record → sends invitation email

- Build /privacy page (HIPAA-aware Privacy Policy)
  Must cover: what data we collect, how Aria calls are used, family dashboard data sharing,
  AI processing of call transcripts, member rights, HIPAA notice, contact information
  
- Build /terms page (Terms of Service)
  Must cover: subscription terms, cancellation policy, AI call consent, family access consent,
  limitation of liability, governing law (California)

- After each page: npx tsc --noEmit → npm run build → confirm green → git commit → git push

FEATURE-006: AI-assisted Life Story page — BUILD NOW (Anthropic API is live)
Location: components/MemberPortalClient.tsx — life-story tab
Add AI-assisted prompts using ANTHROPIC_API_KEY:
1. Show 5 guided prompt cards when life story is empty or has fewer than 3 entries:
   - "Tell us about your career — what did you do for work?"
   - "Tell us about your family — who are the most important people in your life?"
   - "Where did you grow up? What was your childhood like?"
   - "What are you most proud of in your life?"
   - "What hobbies or passions have shaped who you are?"
2. When member clicks a prompt → text area opens with that prompt as placeholder
3. After member submits entry → Claude generates 2 follow-up questions based on what they wrote
   POST /api/life-story/prompts → { entry: string } → returns { followups: string[] }
   Build this API route using Anthropic SDK
4. Show progress bar: "Your life story is X% complete (Y of 10 chapters)"
5. AI organises entries into chapters automatically (Career, Family, Childhood, Achievements, Passions)
