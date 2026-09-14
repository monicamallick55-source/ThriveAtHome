# Thrive@Home — AI Agent Build Prompt (v1.0)

> **Read this entire file at the start of every session before writing a single line of code.**
> This is Version 1. It covers M1–M6 only: Foundation through the Family Dashboard.
> M7–M12 (Add-Ons) and M13–M18 (Advanced) are separate documents appended later.
> If anything here conflicts with something you think is faster or easier — follow this file.

---

## SCOPE OF THIS DOCUMENT

This prompt builds **Phases 1–14** across **Milestones M1–M6**:

| Milestone | Phases | Delivers |
|-----------|--------|---------|
| M1 — Foundation | 1–4 | Next.js scaffold, Vercel, Supabase, full schema, RLS |
| M2 — Member Data | 5–7 | Auth, 3-step onboarding, data layer, seed data |
| M3 — UI System | 8 | Complete reusable component library |
| M4 — Realtime | 9 | Supabase Realtime — primary in-browser notification channel |
| M5 — Alert Engine | 10–11 | All alert detection and crisis escalation logic |
| M6 — Family Dashboard | 12–14 | Dashboard, health timeline, family coordination tools |

**Deliberately excluded from this document:**
- M7 Navigator Console — Add-On, appended later as `prompt-addons.md`
- M8 AI Calls (Retell AI, Anthropic) — Add-On
- M9 Concierge Line — Add-On
- M10 SMS/Email Notifications (Twilio, SendGrid) — Add-On
- M11 Billing (Stripe) — Add-On
- M12 Compliance (HIPAA, SOC 2) — Add-On
- M13–M18 Advanced features — separate `prompt-advanced.md` appended later

**Placeholder pages are required for all excluded sections.** Every route that will be built later must exist now as a "Coming soon" shell — so the app never 404s and always feels complete from day one.

---

## SECTION 1 — The Agentic Loop Protocol

This is the operational model for the entire build. Every phase runs inside this loop. It has four layers: the persistent state, the phase entry, the inner debug loop, and the human checkpoint.

```
PERSISTENT STATE
  PROMPT.md + PROGRESS.md + CHECKLIST.md
  Read at start of every session. Never modified mid-phase except CHECKLIST.md.
        │
        ▼
PHASE N BEGINS
  1. Read PROGRESS.md — confirm previous phase is marked COMPLETE
  2. Read this file's phase N instructions into working memory
  3. Load phase N checklist from CHECKLIST.md — set all items to PENDING
        │
        ▼
┌─────────────────────────────────────────────────────┐
│  INNER DEBUG LOOP  (purple in diagram)              │
│                                                     │
│  WORKING  → implement the next PENDING item         │
│     │                                               │
│     ▼                                               │
│  TESTING  → run the verification for that item      │
│     │                                               │
│     ├─ PASS → mark item [x] in CHECKLIST.md         │
│     │         move to next PENDING item             │
│     │                                               │
│     └─ FAIL → enter DEBUGGING sub-loop:             │
│         1. Read the exact error output              │
│         2. Form ONE hypothesis                      │
│         3. Make the minimal change to test it       │
│         4. Re-run verification                      │
│         5. If still failing: form next hypothesis   │
│         6. After 3 failed hypotheses → BLOCKED      │
│            Write BLOCKED note to PROGRESS.md        │
│            HALT — do not proceed                    │
└─────────────────────────────────────────────────────┘
        │
        │  (all checklist items [x])
        ▼
EXIT GATE CHECK  (amber in diagram)
  Run every test in tests.md for this phase.
  If any test fails → back into the inner debug loop.
  If all pass → proceed to human checkpoint.
        │
        ▼
HUMAN REVIEW CHECKPOINT  (red in diagram)
  Present the phase review in the exact format (Section 1.1).
  HALT completely. Do not begin Phase N+1.
  Wait for explicit human reply.
        │
        ├─ APPROVED → update CHECKLIST.md, append PROGRESS.md, begin Phase N+1
        └─ ISSUE    → re-enter inner debug loop with the described issue
```

---

### 1.1 — Phase review format (exact — do not deviate)

When all checklist items are green and all tests pass, present this and halt:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ PHASE [N] — [PHASE NAME] — COMPLETE, AWAITING YOUR APPROVAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Checklist status:
  [x] [every item from this phase's CHECKLIST.md section]

What was built:
  • [full path of every file created]
  • [full path of every file modified — what specifically changed]
  • [every Supabase table, column, policy, Edge Function, Storage bucket created or changed]
  • [every npm package installed]
  • [every environment variable added]

Tests run:
  • [Test ID from tests.md]: PASSED — [one sentence: exactly what was verified]
  • [Test ID]: FAILED — [exactly what was observed vs expected]

What to check right now:
  • [specific URL or exact Supabase dashboard location — precise, not vague]
  • [another specific item]

Please verify the items above, then reply:
  APPROVED — I will immediately begin Phase [N+1]
  ISSUE: [describe exactly what you see] — I will fix before asking again
```

**After presenting this:** halt completely. Do not write preparatory code. Do not say "while you review, let me get started on…". Do not ask if you should proceed. Wait.

**On APPROVED:** update `checklist.md` to mark Phase N `[x]`, append entry to `progress.md`, begin N+1.

**On ISSUE:** re-enter the inner debug loop with the described issue as the first hypothesis. Run the affected tests again. Present the same review format. Do not advance until APPROVED.

**On ambiguous reply:** ask exactly: "Should I proceed to Phase [N+1], or is there something to fix first?" Do not assume.

---

### 1.2 — BLOCKED state

BLOCKED is reached when the same checklist item has failed 3 consecutive hypothesis-test cycles. This is not a failure state — it is the correct response to a problem that needs human input.

When BLOCKED:

1. Stop all code changes immediately
2. Write this exact entry to `progress.md`:

```
BLOCKED — Phase [N], item: [checklist item text]
After 3 hypotheses:
  H1: [what you tried] → [what happened]
  H2: [what you tried] → [what happened]
  H3: [what you tried] → [what happened]
Current state: [exact error message or observable symptom]
Needs: [what specific information or action would unblock this]
```

3. Present this to the human and halt. Do not attempt a 4th hypothesis. Do not move to another checklist item. Wait for guidance.

---

### 1.3 — CHECKLIST.md update protocol

`checklist.md` is the agent's live scratchpad. Update it in place as work progresses:

- On phase entry: set STATUS to `IN PROGRESS`, all items to `[ ]`
- As items pass: mark `[x]` immediately after verification, not at end of phase
- On BLOCKED: mark the failing item `[!]` and set STATUS to `BLOCKED`
- On phase complete: set STATUS to `COMPLETE`

The human can look at `checklist.md` at any time and see exactly what has been verified vs what hasn't. An item marked `[x]` is a claim that its specific verification was run and passed. Never mark `[x]` on an item that was not personally verified.

---

### 1.4 — Session start protocol

At the start of every session, before writing any code:

1. Read `progress.md` completely from top to bottom
2. Find the last session's `NEXT SESSION MUST` entry — that is where to resume
3. Read `checklist.md` — find the first phase with a non-`[x]` item
4. Read this file's instructions for that phase
5. If the last session ended mid-phase (`[~]` in checklist): resume exactly from the stopping point. Do not redo completed steps. Do not skip ahead.
6. If the last session ended at `[A]` (awaiting approval): do not begin the next phase. Ask: "I'm waiting for your APPROVED on Phase [N]. Shall I proceed?"

---

### 1.5 — Session end protocol

Before closing any conversation that is mid-phase:

1. Write the current state of all checklist items to `checklist.md`
2. Append to `progress.md`:

```
---
SESSION: [number]
DATE: [YYYY-MM-DD UTC]
PHASE: [N] — [name]
STATUS: IN_PROGRESS
STUB STATUS: [which providers are stubs vs real]

WHAT WAS DONE THIS SESSION:
- [every file created or modified]
- [every test run and result]

WHAT IS INCOMPLETE:
- [checklist item] — [where exactly it was left]

NEXT SESSION MUST:
- [exact file name, function name, or step to resume from]
- [any environment variable or manual step needed before code can proceed]
---
```

---

## SECTION 2 — Non-Negotiable Rules

These apply to every phase, file, and line of code. A violation is a build error.

---

### Rule 1 — Never claim success without proof

A phase that compiles is not complete. Code that looks right is not tested. The verification method defined in this document for each checklist item is the only acceptable proof. If a verification cannot run because an environment variable is missing: stop immediately, name the exact variable, say where to find it in the service dashboard, say exactly where to add it. Do not skip. Do not approximate. Do not work around.

---

### Rule 2 — Never assume environment variables are set

Use `/lib/env.ts` at every call site:

```ts
// /lib/env.ts
export function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value || value.trim() === '') {
    throw new Error(
      `\n\n❌ Missing environment variable: ${name}\n` +
      `   Add it to .env.local\n` +
      `   See .env.local.example for where to find it\n`
    )
  }
  return value
}

export function requireServerEnv(name: string): string {
  if (typeof window !== 'undefined') {
    throw new Error(
      `[Security] "${name}" is server-only but was accessed in the browser. ` +
      `Move this call to a Server Component, API Route, or Edge Function.`
    )
  }
  return requireEnv(name)
}
```

Never use `process.env.X!`, `process.env.X ?? ''`, or `process.env.X ?? 'placeholder'`. Never access a server credential from a Client Component or hook.

---

### Rule 3 — Never swallow errors

```ts
// WRONG
try { return await doSomething() } catch { return null }

// RIGHT
try {
  return await doSomething()
} catch (e) {
  console.error('[module/functionName] Failed:', e)
  throw new Error(`[module/functionName] Failed: ${e instanceof Error ? e.message : String(e)}`)
}
```

Every Supabase call checks both `data` and `error`. Always use `.maybeSingle()` not `.single()` — `.single()` throws on zero rows, which is a valid state.

```ts
const { data, error } = await supabase.from('table').select('*').eq('id', id).maybeSingle()
if (error) { console.error('[fn]', error); return { data: null, error: error.message } }
if (!data)  return { data: null, error: 'Not found' }
return { data, error: null }
```

---

### Rule 4 — Never hardcode secrets

No API key, token, webhook secret, phone number, email address, or environment-specific URL as a string literal in any `.ts` or `.tsx` file. Prohibited as literals: anything starting with `eyJ`, `sk_`, `pk_`, `SG.`, `AC`, `retell-`, `sk-ant-`. Any phone number. Any config email address. The app's own production URL.

---

### Rule 5 — Never let secrets reach GitHub

`.gitignore` is the first file created in Phase 1 — before anything else. Verify immediately:

```bash
echo "TEST=secret" > .env.local && git status
```

`.env.local` must appear under "Untracked files" only. If it's tracked: stop, fix `.gitignore`, re-verify before continuing.

Before every commit:
```bash
git ls-files | grep -E "^\.env"
git diff --cached --name-only | xargs grep -l \
  -E "(sk_live|sk_test|pk_live|pk_test|SG\.|AC[a-z0-9]{32}|whsec_|retell-|sk-ant-)" 2>/dev/null
```
Both must produce no output.

---

### Rule 6 — One phase at a time

Build exactly what the current phase describes — nothing more. The scope boundary is a hard line. Do not add features "for later." Do not refactor previous phases unless the current phase explicitly requires it.

---

### Rule 7 — TypeScript strict mode, always

`tsconfig.json` must have `"strict": true`. No `any` — use `unknown` with type guards. Run `npx tsc --noEmit` before every exit gate. Zero errors is required — not "mostly clean".

---

### Rule 8 — Write for a non-technical founder

Every file: one-line plain-English comment at top. Every exported function: JSDoc. User-facing errors: readable sentences — never error codes or stack traces.

---

### Rule 9 — No test data in production code paths

Test scripts live in `/scripts/` only. Never imported by `/app/`, `/lib/`, or `/components/`. All rows inserted by a test script must be deleted at the end of that script.

---

### Rule 10 — Security on every API route and Edge Function

In this exact order, before any database access:
1. Verify authentication → `401` if no valid session
2. Verify authorisation → `403` if user lacks permission for this specific resource
3. Validate all inputs → `400` if required fields are missing or malformed
4. Return only the minimum data the caller needs

---

### Rule 11 — Modular service architecture from Phase 1

Every feature depending on an external paid service is built behind a TypeScript interface with a stub. Real services are plugged in during Add-On milestones. `/lib/providers.ts` is the only file that selects stub vs real. Application code imports from `providers.ts` only — never from `/lib/stubs/` or `/lib/services/` directly. When a real service is added: only the new implementation file and `providers.ts` change.

---

### Rule 12 — Placeholder pages from Phase 1

Every route that will be built in M7–M18 must exist now as a minimal "Coming soon" shell. No business logic. No database calls. No imports beyond the page itself. This prevents 404s and makes navigation work from day one.

Required placeholders (all created in Phase 1):
```
/app/navigator/page.tsx, /app/admin/page.tsx, /app/dashboard/calls/page.tsx,
/app/dashboard/concierge/page.tsx, /app/dashboard/billing/page.tsx,
/app/privacy/page.tsx, /app/volunteer/page.tsx, /app/student/page.tsx,
/app/dashboard/events/page.tsx, /app/dashboard/groups/page.tsx,
/app/dashboard/skill-exchange/page.tsx, /app/dashboard/cultural-circles/page.tsx,
/app/dashboard/benefits/page.tsx, /app/employers/page.tsx,
/app/dashboard/celebrations/page.tsx, /app/dashboard/life-story/page.tsx,
/app/dashboard/grief-support/page.tsx, /app/dashboard/services/page.tsx,
/app/outcomes/page.tsx
```

Placeholder pattern:
```tsx
export default function PageName() {
  return (
    <div className="min-h-screen bg-brand-warm-white flex items-center justify-center">
      <div className="text-center p-8 max-w-md">
        <h1 className="text-2xl font-semibold text-brand-navy mb-2">[Feature Name]</h1>
        <p className="text-gray-500 text-lg">This feature is coming soon.</p>
      </div>
    </div>
  )
}
```

---

### Rule 13 — Edge Functions for all server-side business logic

Server-side business logic goes in Supabase Edge Functions, not Next.js API routes.

What goes in Edge Functions: alert creation and detection, Realtime notification push, call scheduling, webhook handlers, cron jobs, any operation requiring `SUPABASE_SERVICE_ROLE_KEY`.

What stays in Next.js routes: `/app/api/auth/callback` (Supabase Auth requires it), Stripe checkout redirect, any route needing Next.js middleware.

Edge Function boilerplate:
```ts
// supabase/functions/[name]/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    // ... logic
    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    console.error('[function-name]:', e)
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
```

Local: `supabase functions serve`. Deploy: `supabase functions deploy [name] --project-ref <ref>`.

---

### Rule 14 — RLS on every table before any data is inserted

RLS enabled on every table in the same migration that creates it. Never disable RLS to fix a data access problem — write the correct policy. After every RLS change: test cross-user isolation with two real Supabase Auth users. Confirm User A's query for Member B returns empty array — not a row, not an error.

---

### Rule 15 — Seed data before every dashboard phase

`/scripts/seed-test-data.ts` must be idempotent (check by email before every insert). Creates: auth user `test-family@thriveathome.dev`/`TestPassword123!`, senior "Margaret Chen", 14 calls with mood arc 8,8,7,8,7,6,7,6,5,6,5,5,4,5, 2 alerts, 2 notifications, navigator assignment, 3 tasks. Prints login credentials at end. Companion `/scripts/clear-test-data.ts` removes all seeded rows without error if some don't exist.

---

## SECTION 3 — Debugging Protocol

This section defines exactly how to diagnose failures inside the inner debug loop. Read it before forming any hypothesis.

---

### 3.1 — Hypothesis discipline

One hypothesis at a time. Make the minimal change that tests it. Observe the result before changing anything else. Never make multiple simultaneous changes — if the problem goes away you won't know which change fixed it, and if it persists you've muddied the signal.

**Wrong:** "I'll try changing the database query, the RLS policy, and the component fetch at the same time."

**Right:** "The component renders 'undefined'. Hypothesis 1: `getMember()` is returning null. Test: add `console.log('[debug] getMember result:', result)` and check the terminal. Result: data is null with error 'Not found'. Revised hypothesis 2: the member ID is wrong. Test: log the member ID being passed. Result: it's correct. Hypothesis 3: RLS policy blocking the query. Test: run the query directly in Supabase SQL editor with the anon key. Result: empty array. Resolution: family_members.member_id not linked — check signup flow."

---

### 3.2 — Diagnosis by symptom

**Symptom: Page shows "undefined" or blank where data should be**
Diagnosis steps:
1. Log the raw return value of the data-fetching function in the server component
2. Check if `error` is non-null — if so, read the exact Supabase error message
3. Check if `data` is null — if so, the row doesn't exist or RLS blocked it
4. Run the exact query in Supabase SQL Editor with the anon key — if it returns empty, RLS is blocking
5. Run the query in Supabase SQL Editor with the service role key — if it returns data, RLS is confirmed as the cause
6. Check that the family_members row has `member_id` set (not null)

**Symptom: TypeScript error on `npx tsc --noEmit`**
Diagnosis steps:
1. Read the exact error message — file path, line number, error code
2. Fix only the error on that specific line — do not touch other files
3. Re-run `npx tsc --noEmit` — if new errors appear, they were masked by the previous error
4. Repeat until zero errors
5. Common causes: `any` type, missing return type, wrong import path (`@/` vs relative), missing `'use client'`

**Symptom: Supabase RLS blocking access unexpectedly**
Diagnosis steps:
1. Run the failing query in Supabase SQL Editor using the anon key — if empty, RLS is blocking
2. Run the same query with the service role key — if it returns data, the row exists and RLS is the issue
3. Check `SELECT * FROM pg_policies WHERE tablename = 'your_table';` — verify the policy exists
4. Check the USING clause: `auth.uid()` must match `supabase_auth_id` in the linking table
5. Confirm the user's `supabase_auth_id` in `family_members` matches the auth user's UUID in Supabase → Authentication → Users

**Symptom: Realtime notification not appearing in browser**
Diagnosis steps:
1. Check Supabase → Database → Replication — confirm `realtime_notifications` has INSERT enabled. If not, toggle it on.
2. Check the Supabase Realtime logs in the dashboard — look for subscription errors
3. Check the client channel filter: `filter: \`member_id=eq.${memberId}\`` — the `memberId` must be correct (log it)
4. Confirm RLS has a SELECT policy for the user on `realtime_notifications` — Realtime only broadcasts rows the user can SELECT
5. Check the `useEffect` return function — confirm `supabase.removeChannel(channel)` is returned, not just called

**Symptom: Edge Function returns 404**
Diagnosis steps:
1. Confirm the function was deployed: `supabase functions list --project-ref <ref>`
2. Confirm the function folder name exactly matches the name in the deploy command and in `callEdgeFunction(name, ...)`
3. Check the Supabase dashboard → Edge Functions — confirm it appears in the list and is not in error state
4. Confirm the Supabase URL used in `callEdgeFunction` matches your project URL exactly

**Symptom: Edge Function returns 500**
Diagnosis steps:
1. Check Supabase → Edge Functions → Logs for the specific invocation
2. The error is logged in the function's catch block — read it completely
3. Common causes: `SUPABASE_SERVICE_ROLE_KEY` not set in Edge Function secrets, invalid JSON body, missing required field

**Symptom: Vercel build fails**
Diagnosis steps:
1. Open Vercel → your project → the failing deployment → "Build Logs"
2. Read the error completely — never guess from a summary
3. Common causes: TypeScript error not caught locally (run `npx tsc --noEmit`), missing env var in Vercel settings, import using `@/` alias that doesn't resolve in the build
4. Fix only the specific error shown — never make speculative changes

**Symptom: Middleware causing infinite redirect loop**
Diagnosis steps:
1. Add `console.log('[middleware] path:', pathname, 'user:', !!user, 'role:', role)` at the top of middleware
2. Check terminal output — identify which condition is triggering incorrectly
3. Common cause: the `matcher` pattern is matching pages it shouldn't (static files, the login page itself)
4. Confirm the `matcher` excludes `_next/static`, `_next/image`, `favicon.ico`, and common image extensions

**Symptom: Form data lost on page refresh**
Diagnosis steps:
1. Confirm the `useEffect` that writes to `localStorage` has the form state in its dependency array
2. Confirm the `useEffect` that reads from `localStorage` on mount runs before the first render
3. Log `localStorage.getItem('onboarding-form')` in the browser console to verify it's being written
4. Common cause: the read effect and write effect are out of order — read must happen before first render

**Symptom: Auth user created but `family_members` insert failing silently**
Diagnosis steps:
1. Check the exact Supabase error from the `family_members` insert — log it
2. Common causes: RLS blocking the insert (check INSERT policy), missing required field (check NOT NULL constraints), duplicate `supabase_auth_id` (user already registered)
3. Confirm the rollback is running: check Supabase → Authentication → Users — the new user must be deleted if the insert fails

**Symptom: Component renders but Realtime updates stop after some time**
Diagnosis steps:
1. The Supabase Realtime connection has a default timeout — check if the channel is being cleaned up too early
2. Confirm `useEffect` cleanup only runs on unmount, not on every re-render — check the dependency array
3. Common cause: the cleanup function runs on every state change because a dependency was added incorrectly

---

### 3.3 — Things that are never the problem

Do not waste a hypothesis on:
- The Supabase project being down (check status.supabase.com — it's almost never down)
- A Node.js version issue (you confirmed v18+ in setup)
- Tailwind classes not working (they work if the config is correct — check the class name first)
- TypeScript being "too strict" — strict mode is required and will not be turned off
- Browser caching (clear cache with Cmd+Shift+R, then test before blaming caching)

---

### 3.4 — When to HALT vs when to keep trying

**Keep trying (DEBUGGING state):** The error message gives a clear signal. You have a testable hypothesis. The failure is isolated to one component, function, or policy.

**HALT and write BLOCKED:** The error message is ambiguous after 3 hypotheses. The problem requires a manual action (e.g., a Supabase dashboard change you can't verify in code). The problem requires information only the human has (e.g., the correct value of an environment variable). The fix would require changing the project architecture.

---

## SECTION 4 — Comprehensive Edge Case Handling

Check every item in this section before presenting any phase review. These are the most common failure modes in the exact order they tend to appear.

---

### 4.1 — Supabase

- `.single()` used instead of `.maybeSingle()` — scan every data function. Replace all instances. `.single()` throws on zero rows.
- RLS policy written but `ALTER TABLE x ENABLE ROW LEVEL SECURITY` not run — always enable in the same migration.
- Service role key used in a client-callable path — it bypasses all RLS. Only use in Edge Functions and server-only routes.
- `family_members` insert failing after auth user created — the rollback must run `supabase.auth.admin.deleteUser(userId)` if the insert fails. Test this path explicitly.
- Realtime not enabled for `realtime_notifications` — check Supabase → Database → Replication. This is the most common Realtime failure.
- Row exists but query returns empty — RLS is blocking it. Run the query with service role key to confirm the row exists.
- `maybeSingle()` returns `data: null` with no error — row doesn't exist. This is not an error — handle it with `if (!data) return { data: null, error: 'Not found' }`.

---

### 4.2 — TypeScript

- `any` type anywhere — replace with `unknown` + type guard. Never suppress with `// @ts-ignore`.
- Non-null assertion `!` on env var — use `requireEnv()`.
- Missing return type on exported function — add it.
- Missing `'use client'` on a component using React hooks — add it at the top of the file.
- Client Component importing `lib/supabase/admin.ts` — the admin client is server-only. Move the call.
- `npx tsc --noEmit` errors — fix all before any exit gate. Zero errors required.

---

### 4.3 — Next.js / Vercel

- `NEXT_PUBLIC_` prefix on any credential — remove immediately. Credentials are server-only.
- Missing `export const metadata` on a page — every page needs `export const metadata: Metadata = { title: '...' }`.
- Vercel build fails — read the full build log. Never guess. Fix the specific error shown.
- `Module not found` in Vercel build — check import uses `@/` alias consistently throughout.
- `'use client'` missing — any component using `useState`, `useEffect`, or browser APIs needs it.

---

### 4.4 — Environment / Secrets

- `.env.local` appearing tracked by git — `.gitignore` broken. Fix before any other step.
- `VAR=` with empty value treated as set — `requireEnv()` catches this with `.trim()` check.
- Credential pasted into source code — revoke and regenerate at the service dashboard immediately. Then fix the code.
- Env var set in `.env.local` but not in Vercel — Vercel builds use its own env vars. Both must be set.

---

### 4.5 — Edge Functions

- Missing CORS headers — every Edge Function needs the `corsHeaders` response and an OPTIONS handler.
- Missing auth check — every user-callable Edge Function must verify the caller's JWT before any operation.
- Not deployed after changes — always run `supabase functions deploy [name]` after editing.
- Deno import from npm — use `https://esm.sh/[package]@[version]` pattern. Never `require()` or `import from 'package'` without the esm.sh URL.
- Secrets not available in Edge Function — add them in Supabase → Edge Functions → Secrets (not just in `.env.local`).

---

### 4.6 — Database schema

- Enum created after a table that uses it — all `CREATE TYPE` statements must appear before all `CREATE TABLE` statements.
- FK references a table created later — reorder so referenced tables appear first.
- `ALTER TABLE` not in migration file after a schema change — the migration file is the source of truth. Always update it.
- `CREATE TABLE IF NOT EXISTS` missing — if the SQL is run twice, it will error on the second run without `IF NOT EXISTS`.

---

### 4.7 — Forms

- Form advances with empty required fields — client-side validation must block `Next` button. Test with all fields empty.
- DOB accepts any date — validate person is ≥ 60 years old using `differenceInYears(new Date(), dob) >= 60`. Reject future dates.
- Phone accepts non-numeric input — validate against E.164 (`/^\+[1-9]\d{1,14}$/`) or US format.
- `localStorage` not cleared after successful submission — clear on success, not on error.

---

### 4.8 — Mobile / Accessibility

- Text smaller than 18px — check every text element in DevTools
- Button height less than 52px — check every interactive element
- Horizontal scroll at 375px — test every page in browser dev tools at 375px width before review
- Colour alone conveys meaning — always pair colour with a label or icon
- Focus ring invisible — never `outline: none` without a visible replacement

---

### 4.9 — Agent self-check before every exit gate

Before presenting any phase review, run through this checklist internally:

```
□ npx tsc --noEmit → zero errors
□ Every checklist item for this phase has a corresponding verification I personally ran
□ No item is marked [x] that I did not run a specific verification for
□ .gitignore check: git ls-files | grep .env → no output
□ No secret appears as a string literal in any file I created or modified
□ No .single() calls — all deduplication and existence checks use .maybeSingle()
□ Every API route and Edge Function checks auth before database access
□ Every user-facing error message is a readable sentence, not an error code
□ All pages have export const metadata with a title
□ No placeholder page has been accidentally given business logic
□ All stub methods have [STUB] in their console.log output
□ Every new npm package is listed in checklist.md
```

If any box cannot be checked: do not present the phase review. Fix the issue first.

---

## SECTION 5 — Secrets Management

### 5.1 — `.gitignore` (first file, before any commit)

```gitignore
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.env.production
.env*.local
node_modules/
.next/
out/
dist/
build/
.DS_Store
Thumbs.db
.vscode/settings.json
.idea/
*.log
npm-debug.log*
coverage/
.nyc_output/
supabase/.temp/
supabase/config.toml
.vercel/
```

### 5.2 — `.env.local.example` (committed — values always empty)

```bash
# THRIVE@HOME — Environment Variables (v1.0 — M1–M6 scope)
# Copy to .env.local and fill in real values.
# .env.local is gitignored and will NEVER be committed.

# ── CORE ─────────────────────────────────────────
NEXT_PUBLIC_APP_URL=
CARE_TEAM_EMAIL=
CRON_SECRET=

# ── SUPABASE (required from Phase 2) ─────────────
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
# ⚠️ Server-only. Bypasses ALL Row Level Security.
SUPABASE_SERVICE_ROLE_KEY=

# ── ADD-ON SERVICES (M7–M12 — leave blank until those milestones) ──
ANTHROPIC_API_KEY=
RETELL_API_KEY=
RETELL_AGENT_ID=
RETELL_WEBHOOK_SECRET=
RETELL_CONCIERGE_AGENT_ID=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
TWILIO_CONCIERGE_NUMBER=
ONCALL_NAVIGATOR_PHONE=
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID_BASICS=
STRIPE_PRICE_ID_CONNECT=
STRIPE_PRICE_ID_COMPLETE=
STRIPE_PRICE_ID_PREMIER=
CHECKR_API_KEY=
CHECKR_WEBHOOK_SECRET=
LANGUAGE_LINE_ACCOUNT_NUMBER=
LANGUAGE_LINE_SIP_ENDPOINT=

# ── ADVANCED SERVICES (M13–M18 — leave blank until those milestones) ──
LYFT_HEALTHCARE_API_KEY=
INSTACART_API_KEY=
TELADOC_API_KEY=
ARTIFACT_UPRISING_API_KEY=
ONE800FLOWERS_API_KEY=
```

### 5.3 — Server-only vs browser-safe

Only three `NEXT_PUBLIC_` variables allowed: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`. Everything else uses `requireServerEnv()`. Never prefix a credential with `NEXT_PUBLIC_`.

---

## SECTION 6 — Project Architecture

### 6.1 — Folder structure

```
/app
  /api/auth              Auth callback (Next.js — required by Supabase Auth)
  /dashboard
    /family              Family coordination tools (Phase 14)
    /documents           Document vault (Phase 14)
    /calls               Call history (Phase 13) + placeholder for M8
    [all other dashboard subpaths → placeholders until their milestone]
  /navigator             [placeholder — M7]
  /admin                 [placeholder — M7]
  /volunteer             [placeholder — M13]
  /student               [placeholder — M13]
  /onboarding            3-step enrollment (Phase 6)
  /login  /signup        (Phase 5)
  [all other routes → placeholders]

/components
  /ui                    All primitives (Phase 8)
  /dashboard             Dashboard components (Phase 12)
  /onboarding            Onboarding form steps (Phase 6)
  /shared                Reused across sections

/lib
  /supabase              client.ts, server.ts, admin.ts, functions.ts
  /interfaces            All 8 service interfaces (Phase 1 — never modified)
  /stubs                 All 8 stub implementations (Phase 1)
  /services              Real implementations (created in Add-On milestones — empty in v1)
  /providers.ts          THE ONE FILE that selects stub vs real
  /data                  Typed query functions (Phase 7)
  /alerts                Alert logic (Phase 10)
  /realtime              Realtime push helper + useNotifications hook (Phase 9)
  /env.ts                requireEnv, requireServerEnv
  /auth.ts               getCurrentUser, getUserRole, requireAuth

/supabase
  /functions
    /push-notification   index.ts (Phase 9)
    /create-alert        index.ts (Phase 10)
    /check-missed-calls  index.ts (Phase 10)
    /family-nudge-check  index.ts (Phase 14)
  /migrations
    001_initial_schema.sql
    002_audit.sql

/types                   TypeScript types — no implementation code
/scripts                 Seed and test scripts — never imported by app
```

### 6.2 — All 8 service interfaces (Phase 1 — never modified after creation)

```ts
// /lib/interfaces/CallProvider.ts
export interface CallContext {
  preferredName: string; interests: string[]
  priorCallSummaries: string[]; preferredLanguage: string
}
export interface CallProvider {
  scheduleCall(memberId: string, phone: string, ctx: CallContext): Promise<string>
}

// /lib/interfaces/SmsProvider.ts
export interface SmsProvider {
  send(to: string, body: string): Promise<void>
  sendUrgent(to: string, body: string): Promise<void>
}

// /lib/interfaces/EmailProvider.ts
export interface CallScores {
  mood_score: number | null; energy_score: number | null
  pain_score: number | null; medication_taken: boolean | null; alert_flags: string[]
}
export interface PostCallEmailData {
  seniorName: string; summary: string; scores: CallScores
  hasAlerts: boolean; alertMessage?: string; dashboardUrl: string
}
export interface EmailProvider {
  sendPostCallSummary(to: string, data: PostCallEmailData): Promise<void>
  sendAlert(to: string, memberName: string, alertMessage: string): Promise<void>
  sendPaymentFailed(to: string, memberName: string, updateUrl: string): Promise<void>
  sendWelcome(to: string, memberName: string): Promise<void>
  sendGriefSupportNotification(to: string, memberName: string, details: string): Promise<void>
  sendWeeklyDigest(to: string, memberName: string, content: string): Promise<void>
  sendMonthlySummary(to: string, memberName: string, content: string): Promise<void>
}

// /lib/interfaces/AiProvider.ts
export interface ConciergeTriage {
  intent: 'service_request'|'companionship_call'|'emergency'|'information'|'care_team_transfer'
  serviceType?: 'transport'|'meal'|'companion'|'tech_help'|'home_service'
  urgency: 'low'|'medium'|'high'|'emergency'; summary: string
}
export interface CarePlan {
  wellnessSummary: string; topStrengths: string[]; areasForAttention: string[]
  recommendedActions: string[]; communityOpportunities: string[]
  familyTalkingPoints: string[]; nextReviewDate: string | null
}
export interface AiProvider {
  generateCallSummary(transcript: string): Promise<string | null>
  extractCallScores(seniorSpeechOnly: string): Promise<CallScores>
  disambiguateCrisisContext(phrase: string, context: string): Promise<boolean>
  generateNavigatorBrief(memberId: string, summaries: string[]): Promise<string>
  generateCarePlan(member: Member, calls: CheckInCall[]): Promise<CarePlan>
  generateWeeklyDigest(member: Member, calls: CheckInCall[]): Promise<string>
  generateMonthlySummary(member: Member, calls: CheckInCall[]): Promise<string>
  generateCelebrationPersonalisation(member: Member, type: string): Promise<string>
  generateConciergeTriage(transcript: string): Promise<ConciergeTriage>
  generateFamilyNudgeTopic(member: Member, recentCalls: CheckInCall[]): Promise<string>
}

// /lib/interfaces/BillingProvider.ts
export type PlanTier = 'basics'|'connect'|'complete'|'premier'
export interface BillingProvider {
  createCheckoutSession(planTier: PlanTier, memberId: string, familyMemberId: string): Promise<string>
  getCustomerPortalUrl(stripeCustomerId: string): Promise<string>
  handleWebhookEvent(rawBody: string, signature: string): Promise<void>
}

// /lib/interfaces/TransportProvider.ts
export interface TransportBookingRequest {
  memberId: string; pickupAddress: string; destinationAddress: string
  requestedDate: string; requestedTime: string; tripType: string; isRecurring: boolean
}
export interface TransportProvider {
  bookRide(req: TransportBookingRequest): Promise<{ bookingId: string; estimatedArrival?: string }>
  cancelRide(bookingId: string): Promise<void>
  getRideStatus(bookingId: string): Promise<string>
}

// /lib/interfaces/MealProvider.ts
export interface MealOrder {
  memberId: string; providerName: string; items: string[]
  deliveryDate: string; deliveryAddress: string; dietaryRestrictions: string[]
}
export interface MealProvider {
  placeMealOrder(order: MealOrder): Promise<{ orderId: string }>
  cancelMealOrder(orderId: string): Promise<void>
  getOrderStatus(orderId: string): Promise<string>
}

// /lib/interfaces/GoodsProvider.ts
export interface GoodsProvider {
  sendBirthdayCard(recipientAddress: string, message: string, senderName: string): Promise<void>
  orderPhotoBook(memberId: string, images: string[], dedicationText: string): Promise<void>
  sendFlowers(recipientAddress: string, occasionNote: string): Promise<void>
}
```

### 6.3 — `/lib/providers.ts` (created Phase 1 — only this file changes when activating real services)

```ts
// /lib/providers.ts
// THE ONE FILE that selects stub vs real for every external service.
// Application code imports from here ONLY — never from /lib/stubs/ or /lib/services/ directly.
// To add a real service: create its implementation in /lib/services/ and update the resolver below.
// Nothing else in the codebase changes.

import { StubCallProvider }      from './stubs/StubCallProvider'
import { StubSmsProvider }       from './stubs/StubSmsProvider'
import { StubEmailProvider }     from './stubs/StubEmailProvider'
import { StubAiProvider }        from './stubs/StubAiProvider'
import { StubBillingProvider }   from './stubs/StubBillingProvider'
import { StubTransportProvider } from './stubs/StubTransportProvider'
import { StubMealProvider }      from './stubs/StubMealProvider'
import { StubGoodsProvider }     from './stubs/StubGoodsProvider'
import type { CallProvider }     from './interfaces/CallProvider'
import type { SmsProvider }      from './interfaces/SmsProvider'
import type { EmailProvider }    from './interfaces/EmailProvider'
import type { AiProvider }       from './interfaces/AiProvider'
import type { BillingProvider }  from './interfaces/BillingProvider'
import type { TransportProvider } from './interfaces/TransportProvider'
import type { MealProvider }     from './interfaces/MealProvider'
import type { GoodsProvider }    from './interfaces/GoodsProvider'

function resolveAiProvider(): AiProvider {
  if (process.env.ANTHROPIC_API_KEY) {
    const { AnthropicAiProvider } = require('./services/AnthropicAiProvider')  // Added in M8
    return new AnthropicAiProvider()
  }
  return new StubAiProvider()
}
function resolveCallProvider(): CallProvider {
  if (process.env.RETELL_API_KEY && process.env.TWILIO_ACCOUNT_SID) {
    const { RetellCallProvider } = require('./services/RetellCallProvider')  // Added in M8
    return new RetellCallProvider()
  }
  return new StubCallProvider()
}
function resolveSmsProvider(): SmsProvider {
  if (process.env.TWILIO_ACCOUNT_SID) {
    const { TwilioSmsProvider } = require('./services/TwilioSmsProvider')  // Added in M10
    return new TwilioSmsProvider()
  }
  return new StubSmsProvider()
}
function resolveEmailProvider(): EmailProvider {
  if (process.env.SENDGRID_API_KEY) {
    const { SendGridEmailProvider } = require('./services/SendGridEmailProvider')  // Added in M10
    return new SendGridEmailProvider()
  }
  return new StubEmailProvider()
}
function resolveBillingProvider(): BillingProvider {
  if (process.env.STRIPE_SECRET_KEY) {
    const { StripeBillingProvider } = require('./services/StripeBillingProvider')  // Added in M11
    return new StripeBillingProvider()
  }
  return new StubBillingProvider()
}
function resolveTransportProvider(): TransportProvider {
  if (process.env.LYFT_HEALTHCARE_API_KEY) {
    const { LyftTransportProvider } = require('./services/LyftTransportProvider')  // Added in M17
    return new LyftTransportProvider()
  }
  return new StubTransportProvider()
}
function resolveMealProvider(): MealProvider {
  if (process.env.INSTACART_API_KEY) {
    const { InstacartMealProvider } = require('./services/InstacartMealProvider')  // Added in M17
    return new InstacartMealProvider()
  }
  return new StubMealProvider()
}
function resolveGoodsProvider(): GoodsProvider {
  if (process.env.ONE800FLOWERS_API_KEY || process.env.ARTIFACT_UPRISING_API_KEY) {
    const { RealGoodsProvider } = require('./services/RealGoodsProvider')  // Added in M16
    return new RealGoodsProvider()
  }
  return new StubGoodsProvider()
}

export const aiProvider:        AiProvider        = resolveAiProvider()
export const callProvider:      CallProvider      = resolveCallProvider()
export const smsProvider:       SmsProvider       = resolveSmsProvider()
export const emailProvider:     EmailProvider     = resolveEmailProvider()
export const billingProvider:   BillingProvider   = resolveBillingProvider()
export const transportProvider: TransportProvider = resolveTransportProvider()
export const mealProvider:      MealProvider      = resolveMealProvider()
export const goodsProvider:     GoodsProvider     = resolveGoodsProvider()
```

### 6.4 — Stub standard

Every stub method: logs with `[STUB]` prefix, returns a typed placeholder, never throws, no side effects.

```ts
// Example: /lib/stubs/StubSmsProvider.ts
import type { SmsProvider } from '../interfaces/SmsProvider'
export class StubSmsProvider implements SmsProvider {
  async send(to: string, body: string): Promise<void> {
    console.log(`[STUB][SMS] Would send to ${to.substring(0,6)}xxx: "${body.substring(0,100)}..."`)
  }
  async sendUrgent(to: string, body: string): Promise<void> {
    console.log(`[STUB][SMS][URGENT] Would send to ${to.substring(0,6)}xxx: "${body.substring(0,100)}..."`)
  }
}
```

### 6.5 — Supabase Realtime pattern

```ts
// /lib/realtime/notifications.ts
import { createAdminClient } from '../supabase/admin'
export interface RealtimeNotification {
  type: 'new_alert'|'call_completed'|'call_summary_ready'|'medication_reminder'
    |'system_message'|'service_booking_update'|'grief_support_assigned'
    |'family_nudge'|'celebration_upcoming'|'volunteer_matched'
  memberId: string; title: string; body: string
  severity?: 'info'|'concern'|'urgent'|'emergency'
  callId?: string; alertId?: string
}
export async function pushRealtimeNotification(n: RealtimeNotification): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin.from('realtime_notifications').insert({
    type: n.type, member_id: n.memberId, title: n.title, body: n.body,
    severity: n.severity ?? 'info', call_id: n.callId ?? null, alert_id: n.alertId ?? null,
  })
  if (error) console.error('[realtime/push] Insert failed:', error)
  // Log but never throw — notification failure must not crash the calling pipeline
}
```

---

## SECTION 7 — Database Schema

All SQL lives in `/supabase/migrations/`. Write completely before running in Supabase. Migration file = source of truth.

### 7.1 — Schema standards

PKs: `id uuid DEFAULT gen_random_uuid() PRIMARY KEY`. Timestamps: `created_at timestamptz DEFAULT now() NOT NULL`. FKs: `ON DELETE CASCADE`. Enums: `CREATE TYPE` before any table using them. Arrays: `text[]`. JSON: `jsonb`. Phone numbers: `text`. Enum values: `lowercase_with_underscores`. RLS: enabled on every table in the same migration file.

### 7.2 — Core enums

```sql
CREATE TYPE plan_tier          AS ENUM ('basics','connect','complete','premier');
CREATE TYPE member_status      AS ENUM ('active','inactive','paused');
CREATE TYPE user_role          AS ENUM ('family','navigator','admin');
CREATE TYPE call_status        AS ENUM ('scheduled','in_progress','completed','missed','failed');
CREATE TYPE call_type          AS ENUM ('check_in','concierge','navigator');
CREATE TYPE alert_type         AS ENUM ('missed_call','mood_drop','medication_miss','wellness_drift','fall','crisis','emergency');
CREATE TYPE alert_severity     AS ENUM ('informational','concern','urgent','emergency');
CREATE TYPE task_priority      AS ENUM ('low','medium','high','critical');
CREATE TYPE notif_type         AS ENUM ('new_alert','call_completed','call_summary_ready','medication_reminder','system_message','service_booking_update','grief_support_assigned','family_nudge','celebration_upcoming','volunteer_matched');
CREATE TYPE notif_severity     AS ENUM ('info','concern','urgent','emergency');
CREATE TYPE notif_channel      AS ENUM ('realtime','sms','email');
CREATE TYPE notif_status       AS ENUM ('sent','failed','stub');
CREATE TYPE check_in_frequency AS ENUM ('daily','every_other_day','weekly');
```

### 7.3 — Tables (`/supabase/migrations/001_initial_schema.sql`)

```sql
CREATE TABLE members (
  id                        uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at                timestamptz DEFAULT now() NOT NULL,
  full_name                 text NOT NULL,
  preferred_name            text NOT NULL,
  date_of_birth             date NOT NULL,
  phone_number              text NOT NULL,
  preferred_language        text NOT NULL DEFAULT 'english',
  preferred_call_time       text,
  timezone                  text NOT NULL DEFAULT 'America/New_York',
  check_in_frequency        check_in_frequency NOT NULL DEFAULT 'daily',
  topics_enjoy              text[] DEFAULT '{}',
  topics_avoid              text,
  lives_alone               boolean,
  mobility_devices          text[] DEFAULT '{}',
  health_conditions         text,
  medications               text,
  plan_tier                 plan_tier NOT NULL DEFAULT 'basics',
  status                    member_status NOT NULL DEFAULT 'active',
  address                   text,
  emergency_contact_1_name  text,
  emergency_contact_1_phone text,
  emergency_contact_1_rel   text,
  emergency_contact_2_name  text,
  emergency_contact_2_phone text,
  emergency_contact_2_rel   text,
  doctor_name               text,
  doctor_phone              text
);
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

CREATE TABLE family_members (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        timestamptz DEFAULT now() NOT NULL,
  member_id         uuid REFERENCES members(id) ON DELETE CASCADE,
  supabase_auth_id  uuid NOT NULL UNIQUE,
  full_name         text NOT NULL,
  email             text NOT NULL,
  phone             text,
  relationship      text,
  notification_prefs jsonb NOT NULL DEFAULT '{"sms":true,"email":true,"realtime":true}',
  alert_level       text NOT NULL DEFAULT 'all',
  role              user_role NOT NULL DEFAULT 'family',
  last_login_at     timestamptz
);
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE check_in_calls (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       timestamptz DEFAULT now() NOT NULL,
  member_id        uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  call_type        call_type NOT NULL DEFAULT 'check_in',
  scheduled_at     timestamptz,
  started_at       timestamptz,
  ended_at         timestamptz,
  duration_seconds int,
  status           call_status NOT NULL DEFAULT 'scheduled',
  mood_score       int CHECK (mood_score BETWEEN 1 AND 10),
  energy_score     int CHECK (energy_score BETWEEN 1 AND 10),
  pain_score       int CHECK (pain_score BETWEEN 1 AND 10),
  medication_taken boolean,
  transcript       text,
  ai_summary       text,
  alert_flags      jsonb NOT NULL DEFAULT '[]',
  recording_url    text,
  retell_call_id   text
);
ALTER TABLE check_in_calls ENABLE ROW LEVEL SECURITY;

CREATE TABLE alerts (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      timestamptz DEFAULT now() NOT NULL,
  member_id       uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  alert_type      alert_type NOT NULL,
  severity        alert_severity NOT NULL,
  message         text NOT NULL,
  acknowledged    boolean NOT NULL DEFAULT false,
  acknowledged_by uuid REFERENCES family_members(id) ON DELETE SET NULL,
  acknowledged_at timestamptz
);
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE TABLE care_navigators (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       timestamptz DEFAULT now() NOT NULL,
  supabase_auth_id uuid UNIQUE,
  full_name        text NOT NULL,
  email            text NOT NULL,
  phone            text,
  certifications   text[] DEFAULT '{}',
  caseload_limit   int NOT NULL DEFAULT 150,
  is_active        boolean NOT NULL DEFAULT true
);
ALTER TABLE care_navigators ENABLE ROW LEVEL SECURITY;

CREATE TABLE navigator_assignments (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   timestamptz DEFAULT now() NOT NULL,
  member_id    uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  navigator_id uuid NOT NULL REFERENCES care_navigators(id) ON DELETE CASCADE,
  assigned_at  timestamptz NOT NULL DEFAULT now(),
  is_primary   boolean NOT NULL DEFAULT true,
  UNIQUE(member_id, navigator_id)
);
ALTER TABLE navigator_assignments ENABLE ROW LEVEL SECURITY;

CREATE TABLE navigator_tasks (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   timestamptz DEFAULT now() NOT NULL,
  member_id    uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  navigator_id uuid REFERENCES care_navigators(id) ON DELETE SET NULL,
  task_type    text NOT NULL,
  description  text NOT NULL,
  priority     task_priority NOT NULL DEFAULT 'medium',
  due_by       timestamptz,
  completed    boolean NOT NULL DEFAULT false,
  completed_at timestamptz
);
ALTER TABLE navigator_tasks ENABLE ROW LEVEL SECURITY;

CREATE TABLE navigator_notes (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   timestamptz DEFAULT now() NOT NULL,
  member_id    uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  navigator_id uuid NOT NULL REFERENCES care_navigators(id) ON DELETE CASCADE,
  note         text NOT NULL
);
ALTER TABLE navigator_notes ENABLE ROW LEVEL SECURITY;

CREATE TABLE subscriptions (
  id                     uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at             timestamptz DEFAULT now() NOT NULL,
  member_id              uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  stripe_customer_id     text,
  stripe_subscription_id text,
  plan_tier              plan_tier NOT NULL DEFAULT 'basics',
  status                 text NOT NULL DEFAULT 'active',
  current_period_start   timestamptz,
  current_period_end     timestamptz,
  monthly_amount_cents   int
);
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE TABLE realtime_notifications (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  member_id  uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  type       notif_type NOT NULL,
  title      text NOT NULL,
  body       text NOT NULL,
  severity   notif_severity NOT NULL DEFAULT 'info',
  call_id    uuid REFERENCES check_in_calls(id) ON DELETE SET NULL,
  alert_id   uuid REFERENCES alerts(id) ON DELETE SET NULL,
  read       boolean NOT NULL DEFAULT false,
  read_at    timestamptz
);
ALTER TABLE realtime_notifications ENABLE ROW LEVEL SECURITY;

CREATE TABLE notification_log (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       timestamptz DEFAULT now() NOT NULL,
  member_id        uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  family_member_id uuid REFERENCES family_members(id) ON DELETE SET NULL,
  channel          notif_channel NOT NULL,
  status           notif_status NOT NULL,
  message_preview  text,
  error_message    text
);
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

CREATE TABLE emergency_log (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       timestamptz DEFAULT now() NOT NULL,
  member_id        uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  call_id          uuid REFERENCES check_in_calls(id) ON DELETE SET NULL,
  alert_type       text NOT NULL,
  triggered_phrase text,
  logged_at        timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE emergency_log ENABLE ROW LEVEL SECURITY;

CREATE TABLE medication_schedules (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   timestamptz DEFAULT now() NOT NULL,
  member_id    uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  reminder_time time NOT NULL,
  days_of_week  text[] NOT NULL DEFAULT
    '{"monday","tuesday","wednesday","thursday","friday","saturday","sunday"}',
  label        text NOT NULL DEFAULT 'Medications',
  is_active    boolean NOT NULL DEFAULT true
);
ALTER TABLE medication_schedules ENABLE ROW LEVEL SECURITY;

CREATE TABLE family_task_items (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   timestamptz DEFAULT now() NOT NULL,
  member_id    uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  created_by   uuid NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  assigned_to  uuid REFERENCES family_members(id) ON DELETE SET NULL,
  title        text NOT NULL,
  task_type    text NOT NULL DEFAULT 'other',
  due_date     date,
  completed    boolean NOT NULL DEFAULT false,
  completed_at timestamptz
);
ALTER TABLE family_task_items ENABLE ROW LEVEL SECURITY;

CREATE TABLE family_messages (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  member_id  uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  sender_id  uuid NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  body       text NOT NULL
);
ALTER TABLE family_messages ENABLE ROW LEVEL SECURITY;

CREATE TABLE document_vault_items (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at          timestamptz DEFAULT now() NOT NULL,
  member_id           uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  uploaded_by         uuid NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  file_name           text NOT NULL,
  file_type           text NOT NULL,
  description         text,
  storage_path        text NOT NULL,
  is_advance_directive boolean NOT NULL DEFAULT false,
  last_reviewed_at    timestamptz
);
ALTER TABLE document_vault_items ENABLE ROW LEVEL SECURITY;

CREATE TABLE audit_log (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at    timestamptz DEFAULT now() NOT NULL,
  user_id       uuid,
  action        text NOT NULL,
  resource_type text NOT NULL,
  resource_id   text
);
-- No user-level RLS on audit_log — written by service role only
```

### 7.4 — Indexes

```sql
CREATE INDEX idx_calls_member_scheduled  ON check_in_calls(member_id, scheduled_at DESC);
CREATE INDEX idx_alerts_member_unacked   ON alerts(member_id, acknowledged) WHERE acknowledged = false;
CREATE INDEX idx_family_auth_id          ON family_members(supabase_auth_id);
CREATE INDEX idx_nav_assignments_nav     ON navigator_assignments(navigator_id);
CREATE INDEX idx_notifs_member_unread    ON realtime_notifications(member_id, read, created_at DESC);
CREATE INDEX idx_tasks_member_incomplete ON family_task_items(member_id, completed) WHERE completed = false;
CREATE INDEX idx_messages_member         ON family_messages(member_id, created_at ASC);
```

### 7.5 — RLS policies

```sql
-- MEMBERS
CREATE POLICY "family_select_own_member" ON members FOR SELECT
USING (EXISTS (SELECT 1 FROM family_members fm WHERE fm.member_id = members.id AND fm.supabase_auth_id = auth.uid()));

CREATE POLICY "navigator_select_assigned_members" ON members FOR SELECT
USING (EXISTS (SELECT 1 FROM navigator_assignments na JOIN care_navigators cn ON cn.id = na.navigator_id WHERE na.member_id = members.id AND cn.supabase_auth_id = auth.uid()));

-- FAMILY_MEMBERS
CREATE POLICY "family_select_own_row" ON family_members FOR SELECT
USING (supabase_auth_id = auth.uid());

CREATE POLICY "family_select_linked_members" ON family_members FOR SELECT
USING (EXISTS (SELECT 1 FROM family_members fm WHERE fm.member_id = family_members.member_id AND fm.supabase_auth_id = auth.uid()));

-- CHECK_IN_CALLS
CREATE POLICY "family_select_own_calls" ON check_in_calls FOR SELECT
USING (EXISTS (SELECT 1 FROM family_members fm WHERE fm.member_id = check_in_calls.member_id AND fm.supabase_auth_id = auth.uid()));

-- ALERTS
CREATE POLICY "family_select_own_alerts" ON alerts FOR SELECT
USING (EXISTS (SELECT 1 FROM family_members fm WHERE fm.member_id = alerts.member_id AND fm.supabase_auth_id = auth.uid()));

CREATE POLICY "family_update_own_alerts" ON alerts FOR UPDATE
USING (EXISTS (SELECT 1 FROM family_members fm WHERE fm.member_id = alerts.member_id AND fm.supabase_auth_id = auth.uid()));

-- REALTIME_NOTIFICATIONS
CREATE POLICY "family_select_own_notifications" ON realtime_notifications FOR SELECT
USING (EXISTS (SELECT 1 FROM family_members fm WHERE fm.member_id = realtime_notifications.member_id AND fm.supabase_auth_id = auth.uid()));

CREATE POLICY "family_update_own_notifications" ON realtime_notifications FOR UPDATE
USING (EXISTS (SELECT 1 FROM family_members fm WHERE fm.member_id = realtime_notifications.member_id AND fm.supabase_auth_id = auth.uid()));

-- FAMILY_TASK_ITEMS
CREATE POLICY "family_all_own_tasks" ON family_task_items FOR ALL
USING (EXISTS (SELECT 1 FROM family_members fm WHERE fm.member_id = family_task_items.member_id AND fm.supabase_auth_id = auth.uid()));

-- FAMILY_MESSAGES
CREATE POLICY "family_all_own_messages" ON family_messages FOR ALL
USING (EXISTS (SELECT 1 FROM family_members fm WHERE fm.member_id = family_messages.member_id AND fm.supabase_auth_id = auth.uid()));

-- DOCUMENT_VAULT_ITEMS
CREATE POLICY "family_all_own_documents" ON document_vault_items FOR ALL
USING (EXISTS (SELECT 1 FROM family_members fm WHERE fm.member_id = document_vault_items.member_id AND fm.supabase_auth_id = auth.uid()));

-- NAVIGATOR TABLES
CREATE POLICY "navigator_select_assignments" ON navigator_assignments FOR SELECT
USING (EXISTS (SELECT 1 FROM care_navigators cn WHERE cn.id = navigator_assignments.navigator_id AND cn.supabase_auth_id = auth.uid()));

CREATE POLICY "navigator_all_tasks" ON navigator_tasks FOR ALL
USING (EXISTS (SELECT 1 FROM care_navigators cn WHERE cn.id = navigator_tasks.navigator_id AND cn.supabase_auth_id = auth.uid()));

CREATE POLICY "navigator_all_notes" ON navigator_notes FOR ALL
USING (EXISTS (SELECT 1 FROM care_navigators cn WHERE cn.id = navigator_notes.navigator_id AND cn.supabase_auth_id = auth.uid()));
```

### 7.6 — Audit triggers (`/supabase/migrations/002_audit.sql`)

```sql
CREATE OR REPLACE FUNCTION log_data_access()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO audit_log (user_id, action, resource_type, resource_id)
  VALUES (auth.uid(), TG_OP, TG_TABLE_NAME,
    CASE WHEN TG_OP = 'DELETE' THEN OLD.id::text ELSE NEW.id::text END);
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

CREATE TRIGGER members_audit AFTER INSERT OR UPDATE OR DELETE ON members FOR EACH ROW EXECUTE FUNCTION log_data_access();
CREATE TRIGGER calls_audit   AFTER INSERT OR UPDATE OR DELETE ON check_in_calls FOR EACH ROW EXECUTE FUNCTION log_data_access();
CREATE TRIGGER alerts_audit  AFTER INSERT OR UPDATE OR DELETE ON alerts FOR EACH ROW EXECUTE FUNCTION log_data_access();
```

---

## SECTION 8 — Phase-by-Phase Build Instructions

---

## ═══ M1 — FOUNDATION ═══

### PHASE 1 — Project Scaffold

**Prerequisites:** GitHub repo `thrive-at-home` (Private) exists. Vercel connected to GitHub. Supabase project created and 3 credentials saved.

**Checklist items and their verification methods:**

```
PHASE 1 CHECKLIST
[ ] .gitignore exists and .env.local is untracked
    VERIFY: echo "TEST=secret" > .env.local && git status
    PASS: .env.local appears under "Untracked files" only

[ ] Project created and deploys to Vercel
    VERIFY: Open Vercel deployment URL in browser
    PASS: "Thrive@Home" in navy text, zero console errors, tagline in teal

[ ] Auto-deploy works
    VERIFY: Push trivial change to main, watch Vercel dashboard
    PASS: New deployment triggered within 60 seconds and completes

[ ] npx tsc --noEmit passes
    VERIFY: Run in terminal
    PASS: Zero output (zero errors)

[ ] All 8 interfaces exist
    VERIFY: ls lib/interfaces/ | wc -l
    PASS: Shows 8

[ ] All 8 stubs exist
    VERIFY: ls lib/stubs/ | wc -l
    PASS: Shows 8

[ ] providers.ts all resolve to stubs
    VERIFY: node -e "const p=require('./lib/providers'); console.log(Object.keys(p).map(k=>p[k].constructor.name).every(n=>n.startsWith('Stub')))"
    PASS: prints "true"

[ ] All 19 placeholder routes return 200
    VERIFY: Navigate to each in browser
    PASS: Every route shows "Coming soon" content, no 404

[ ] No .env file tracked by git
    VERIFY: git ls-files | grep -E "^\.env"
    PASS: No output
```

**Build steps:**

Step 1 — Create `.gitignore` first (Section 5.1). Verify with `echo "TEST=secret" > .env.local && git status`. If tracked: fix `.gitignore` before any other step.

Step 2 — Create project:
```bash
npx create-next-app@latest thrive-at-home \
  --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
cd thrive-at-home
node --version  # Stop if < v18
```

Step 3 — `.env.local.example` (Section 5.2). Committed. `.env.local` from `cp .env.local.example .env.local`, fill Supabase + core values only.

Step 4 — Tailwind brand tokens:
```ts
// tailwind.config.ts
theme: {
  extend: {
    colors: { brand: { navy: '#1B3A6B', 'navy-light': '#2A5298', teal: '#2A9D8F', 'teal-light': '#3DBFB0', 'warm-white': '#FAFAF8' } },
    fontSize: { base: ['18px', { lineHeight: '1.6' }] },
    minHeight: { touch: '52px' },
    minWidth: { touch: '52px' },
  },
}
```

Step 5 — Create folder structure:
```bash
mkdir -p app/api/auth \
  "app/dashboard/family" "app/dashboard/documents" "app/dashboard/calls" \
  "app/dashboard/life-story" "app/dashboard/grief-support" "app/dashboard/services" \
  "app/dashboard/events" "app/dashboard/groups" "app/dashboard/skill-exchange" \
  "app/dashboard/cultural-circles" "app/dashboard/benefits" "app/dashboard/billing" \
  "app/dashboard/concierge" "app/dashboard/celebrations" \
  app/navigator app/admin app/volunteer app/student \
  app/onboarding app/login app/signup app/pricing app/privacy app/outcomes app/employers \
  components/ui components/dashboard components/onboarding components/shared \
  lib/supabase lib/interfaces lib/stubs lib/services lib/data lib/alerts lib/realtime \
  supabase/functions/push-notification supabase/functions/create-alert \
  supabase/functions/check-missed-calls supabase/functions/family-nudge-check \
  supabase/migrations types scripts
find components lib types scripts supabase/functions -type d -exec touch {}/.gitkeep \;
```

Step 6 — `/lib/env.ts` (Section 2, Rule 2 exact content).

Step 7 — All 8 interfaces (Section 6.2 exact content).

Step 8 — All 8 stubs (Section 6.4 pattern). Every method logs `[STUB]`, returns typed placeholder, never throws.

Step 9 — `/lib/providers.ts` (Section 6.3 exact content).

Step 10 — All 19 placeholder pages (Rule 12 pattern + list).

Step 11 — `/app/page.tsx` landing page: brand colours, "Thrive@Home" heading, tagline, links to `/login` and `/signup`.

Step 12 — Commit and deploy:
```bash
git ls-files | grep -E "^\.env"  # Must produce no output
git add .
git commit -m "Phase 1: scaffold, interfaces, stubs, providers, placeholders"
git push
```
Import in Vercel. Update `NEXT_PUBLIC_APP_URL` once URL is known.

**Debug: `.env.local` appears tracked** → Show user the `.gitignore` content, run `git rm --cached .env.local`, re-verify before continuing.

**Debug: Vercel build fails** → Open Vercel → deployment → Build Logs. Read the specific error. Fix only that error. Never guess.

**Debug: `npx tsc --noEmit` errors** → Read each error individually. Fix in the order TypeScript reports them — later errors are sometimes caused by earlier ones.

---

### PHASE 2 — Supabase Connection

**Checklist items:**
```
PHASE 2 CHECKLIST
[ ] Browser client connects successfully
    VERIFY: /test page shows text from connection_test table
    PASS: Row text visible, not "undefined" or "null"

[ ] Error state is human-readable
    VERIFY: Corrupt NEXT_PUBLIC_SUPABASE_URL, restart dev server, load any page
    PASS: Human-readable error message, no stack trace
    (restore URL after)

[ ] Admin client is server-only
    VERIFY: Attempt import in a Client Component — should error
    PASS: TypeScript or runtime error with clear message about server-only access

[ ] npx tsc --noEmit passes
    VERIFY: Run in terminal after deleting test page
    PASS: Zero errors
```

Install: `npm install @supabase/supabase-js @supabase/ssr`

Create `/lib/supabase/client.ts`, `/lib/supabase/server.ts`, `/lib/supabase/admin.ts`, `/lib/supabase/functions.ts`, `/middleware.ts` using the exact patterns from Section 8 of the previous prompt version (inline code for each file).

**Exact implementations:**

`/lib/supabase/client.ts`:
```ts
import { createBrowserClient } from '@supabase/ssr'
import { requireEnv } from '../env'
export function createClient() {
  return createBrowserClient(requireEnv('NEXT_PUBLIC_SUPABASE_URL'), requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'))
}
```

`/lib/supabase/server.ts`:
```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { requireEnv } from '../env'
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(requireEnv('NEXT_PUBLIC_SUPABASE_URL'), requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'), {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => { try { toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {} },
    },
  })
}
```

`/lib/supabase/admin.ts`:
```ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { requireServerEnv } from '../env'
let _client: ReturnType<typeof createSupabaseClient> | null = null
export function createAdminClient() {
  if (!_client) _client = createSupabaseClient(requireServerEnv('NEXT_PUBLIC_SUPABASE_URL'), requireServerEnv('SUPABASE_SERVICE_ROLE_KEY'), { auth: { autoRefreshToken: false, persistSession: false } })
  return _client
}
```

`/middleware.ts`:
```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => request.cookies.getAll(), setAll: (toSet) => { toSet.forEach(({ name, value }) => request.cookies.set(name, value)); response = NextResponse.next({ request }); toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options)) } } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname
  if (['/dashboard','/navigator','/admin'].some(p => path.startsWith(p)) && !user) {
    const url = request.nextUrl.clone(); url.pathname = '/login'; return NextResponse.redirect(url)
  }
  return response
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'] }
```

Connection test: create `connection_test` table, insert row manually, create `/app/test/page.tsx`, verify, then delete both. Run `npx tsc --noEmit`.

**Debug: test page shows nothing** → Verify the row was inserted in Supabase Table Editor. Check that RLS is not enabled on the test table.

**Debug: 401 from Supabase** → Anon key is wrong. Copy fresh from Supabase → Settings → API.

---

### PHASE 3 — Database Schema

**Checklist items:**
```
PHASE 3 CHECKLIST
[ ] All 17 tables exist in Supabase
    VERIFY: Supabase → Table Editor — count tables
    PASS: members, family_members, check_in_calls, alerts, care_navigators,
          navigator_assignments, navigator_tasks, navigator_notes, subscriptions,
          realtime_notifications, notification_log, emergency_log, medication_schedules,
          family_task_items, family_messages, document_vault_items, audit_log — all present

[ ] All FK relationships exist
    VERIFY: Supabase → Database → Foreign Keys
    PASS: All major FK relationships visible in visualiser

[ ] Cascade delete works
    VERIFY: Insert member + family_member, delete member, query family_member
    PASS: family_member row deleted automatically (cascade)

[ ] RLS enabled on all tables
    VERIFY: Supabase → Authentication → Policies
    PASS: Every table shows "RLS enabled"

[ ] Realtime enabled for realtime_notifications
    VERIFY: Supabase → Database → Replication
    PASS: realtime_notifications listed with INSERT checked

[ ] Audit triggers exist
    VERIFY: SELECT trigger_name FROM information_schema.triggers WHERE trigger_schema='public';
    PASS: members_audit, calls_audit, alerts_audit all listed
```

Write `001_initial_schema.sql` (Section 7.2–7.5) and `002_audit.sql` (Section 7.6) completely before running anything. Paste into Supabase SQL Editor in order. Enable Realtime for `realtime_notifications` in Supabase → Database → Replication.

**Debug: `type "xyz" does not exist`** → Enum referenced before creation. Move all `CREATE TYPE` to top of file.

**Debug: `relation "xyz" already exists`** → Previous partial run. Add `DROP TABLE IF EXISTS xyz CASCADE` at top, or use `CREATE TABLE IF NOT EXISTS`.

---

### PHASE 4 — RLS Verification

**Checklist items:**
```
PHASE 4 CHECKLIST
[ ] Cross-user isolation confirmed
    VERIFY: npx tsx scripts/test-rls.ts
    PASS: "✅ Cross-user isolation: PASSED"
         "✅ Own data access: PASSED"
         "✅ Service role reads all: PASSED"
         "✅ All test data cleaned up"

[ ] No test rows remain after script
    VERIFY: Supabase → Table Editor → members — check for test rows
    PASS: No rows with test email addresses
```

Create `/scripts/test-rls.ts`. It must: create two Supabase Auth users via admin client, create two members + family_members, sign in as User A and query Member B (assert empty), sign in as User A and query Member A (assert one row), run same in reverse for User B, use service role to read all (assert both rows), delete all test data.

**Debug: User A can read Member B** → Policy USING clause wrong. Check `fm.supabase_auth_id = auth.uid()` is the correct join condition. Run `RAISE LOG 'uid: %', auth.uid()` inside the policy to trace.

---

## ═══ M2 — MEMBER DATA ═══

### PHASE 5 — Authentication

**Checklist items:**
```
PHASE 5 CHECKLIST
[ ] Signup creates auth user + family_members row
    VERIFY: Sign up, check Supabase → Auth → Users and family_members table
    PASS: Both rows created, role='family'

[ ] Unauthenticated user redirected from /dashboard
    VERIFY: Log out, navigate to /dashboard
    PASS: Immediately redirected to /login

[ ] Family user blocked from /navigator
    VERIFY: Log in as family, navigate to /navigator
    PASS: Redirected to /dashboard

[ ] Navigator user redirected to /navigator on login
    VERIFY: Set role='navigator' in Supabase, log in
    PASS: Lands on /navigator, not /dashboard

[ ] Orphaned auth user prevented
    VERIFY: Break family_members insert, attempt signup
    PASS: Auth user deleted, user sees clear error message
```

Create `/lib/auth.ts`, `/app/signup/page.tsx`, `/app/login/page.tsx`, `/app/api/auth/callback/route.ts`, update `/middleware.ts` with role-based routing.

Signup atomicity: if `family_members` insert fails, call `supabase.auth.admin.deleteUser(userId)` and show clear error. Test this path explicitly by temporarily throwing after auth creation.

**Debug: Redirect loop** → Add `console.log('[middleware] path:', path, 'user:', !!user)` to trace. Check the `matcher` does not match the login page itself.

---

### PHASE 6 — Member Onboarding Form (3 Steps — No Plan Selection)

**Checklist items:**
```
PHASE 6 CHECKLIST
[ ] Form blocks Next with empty required fields
    VERIFY: Click Next with all fields empty
    PASS: Error messages appear below every required field, does not advance

[ ] DOB validation: rejects anyone under 60
    VERIFY: Enter today's date as DOB
    PASS: Validation error — must be at least 60 years old

[ ] Phone validation: rejects non-E.164/US format
    VERIFY: Enter "abc-xyz-123" as phone
    PASS: Validation error with format example

[ ] Successful submission creates member row
    VERIFY: Complete all 3 steps, check Supabase → members
    PASS: Row created, plan_tier='basics', family_members.member_id linked

[ ] Confirmation shows correct preferred name
    VERIFY: Complete form, read confirmation page
    PASS: Shows preferred name entered, not "undefined"

[ ] Form state survives page refresh
    VERIFY: Fill Step 2, refresh browser
    PASS: Step 2 data preserved via localStorage

[ ] Mobile layout at 375px
    VERIFY: DevTools → 375px width, scroll through all steps
    PASS: No horizontal scroll, all fields accessible
```

3-step form. State in `localStorage`, saved on every change, cleared on success. `plan_tier` defaults to `'basics'` server-side. DOB validation uses `differenceInYears(new Date(), dob) >= 60` from `date-fns` (install: `npm install date-fns`). Submission: Supabase RPC or sequential inserts — if either fails, show error and do NOT redirect.

---

### PHASE 7 — App Data Layer & Seed Data

**Checklist items:**
```
PHASE 7 CHECKLIST
[ ] All data functions return {data, error} and never throw
    VERIFY: npx tsx scripts/test-data-layer.ts
    PASS: "✅ All data layer tests passed"

[ ] Invalid ID returns {data: null, error: 'Not found'} not a crash
    VERIFY: test-data-layer.ts includes invalid-id test case
    PASS: Assertion passes for invalid UUID

[ ] Seed script creates correct data
    VERIFY: npx tsx scripts/seed-test-data.ts
    PASS: Prints "Login: test-family@thriveathome.dev / TestPassword123!"
          Supabase: Margaret Chen row, 14 call rows

[ ] Seed script is idempotent
    VERIFY: Run seed script twice in a row
    PASS: Same row count after second run, no duplicate error

[ ] Clear script removes all seeded data
    VERIFY: npx tsx scripts/clear-test-data.ts then check tables
    PASS: All seeded rows removed, no errors

[ ] npx tsc --noEmit passes
    VERIFY: Run in terminal
    PASS: Zero errors
```

Every data function: `Promise<{ data: T | null; error: string | null }>`, uses `.maybeSingle()`, never throws. Create all files in `/lib/data/` and `/types/`.

---

## ═══ M3 — UI SYSTEM ═══

### PHASE 8 — Primitive UI Components

**Checklist items:**
```
PHASE 8 CHECKLIST
[ ] All 13 components render in all variants
    VERIFY: Navigate to /test-ui, visually inspect every variant
    PASS: No missing component, no rendering error in any variant

[ ] All interactive elements keyboard-reachable
    VERIFY: Tab through /test-ui with no mouse
    PASS: Every button/interactive element reached, focus ring always visible

[ ] Modal focus trap and Escape close work
    VERIFY: Open Modal, press Tab (stays inside), press Escape (closes)
    PASS: Both behaviours confirmed

[ ] npx tsc --noEmit passes
    VERIFY: Run after test-ui confirmed
    PASS: Zero errors

[ ] Test-ui page deleted
    VERIFY: ls app/test-ui — should not exist
    PASS: Directory not found
```

13 components: Button, Card, Badge, Input, Select, Textarea, Skeleton, StatusDot, MoodEmoji, NotificationBell, Toast, Modal, Tabs, ProgressBar. All use `brand.*` tokens, `min-h-[52px]`, `text-lg`, ARIA labels. Modal uses `focus-trap-react` (install: `npm install focus-trap-react`).

---

## ═══ M4 — REALTIME NOTIFICATIONS ═══

### PHASE 9 — Supabase Realtime Notification System

**Checklist items:**
```
PHASE 9 CHECKLIST
[ ] Notification appears in browser within 2 seconds of insert
    VERIFY: Dashboard open → insert into realtime_notifications via SQL Editor
    PASS: Toast appears within 2 seconds, no page refresh

[ ] Bell count increments and decrements correctly
    VERIFY: Insert notification → bell shows 1 → mark read → bell shows 0
    PASS: Both transitions confirmed

[ ] Cross-user isolation: User A cannot see Member B's notifications
    VERIFY: Insert notification for Member B while logged in as User A
    PASS: Notification does NOT appear for User A

[ ] pushRealtimeNotification does not throw on failure
    VERIFY: Call with non-existent member_id
    PASS: Function logs error, calling code continues

[ ] Edge Function deployed successfully
    VERIFY: supabase functions list --project-ref <ref>
    PASS: push-notification appears in list
```

Create `push-notification` Edge Function (Section 13, Rule boilerplate). Create `useNotifications` hook in `/lib/realtime/useNotifications.ts`. Create `pushRealtimeNotification` in `/lib/realtime/notifications.ts`. Enable Realtime for `realtime_notifications` in Supabase dashboard.

---

## ═══ M5 — ALERT ENGINE ═══

### PHASE 10 — Alert Logic & Detection

**Checklist items:**
```
PHASE 10 CHECKLIST
[ ] All 8 alert rules create correct type and severity
    VERIFY: npx tsx scripts/test-alert-rules.ts
    PASS: "✅ All alert rule tests passed"

[ ] Deduplication: same type within 24 hours creates only 1 row
    VERIFY: test-alert-rules.ts includes deduplication test
    PASS: Exactly 1 row, not 2

[ ] New alert triggers Realtime notification
    VERIFY: Dashboard open → create test alert → notification appears
    PASS: Toast within 2 seconds, no page refresh

[ ] Wellness drift detects decline, not flat scores
    VERIFY: npx tsx scripts/test-wellness-drift.ts
    PASS: Declining scores → concern alert; flat scores → no alert

[ ] Emergency log written before alert on crisis
    VERIFY: test-alert-rules.ts mocks alerts insert to fail on crisis
    PASS: emergency_log row exists even when alerts insert fails

[ ] Edge Functions deployed
    VERIFY: supabase functions list --project-ref <ref>
    PASS: create-alert and check-missed-calls both listed
```

Create `create-alert` and `check-missed-calls` Edge Functions. Alert rules table in Section 8. Wellness drift: minimum 4 calls in last 7 days required; 14-call rolling average; 7-day deduplication.

---

### PHASE 11 — Crisis Detection

**Checklist items:**
```
PHASE 11 CHECKLIST
[ ] Crisis transcript triggers all 5 escalation steps
    VERIFY: npx tsx scripts/test-crisis-detection.ts with crisis phrase
    PASS: emergency_log row, emergency alert, critical navigator task,
          Realtime notification, [STUB][SMS][URGENT] log — all 5 present

[ ] Normal transcript produces no false positive
    VERIFY: test with normal transcript
    PASS: None of the 5 steps fire

[ ] "fell asleep watching TV" produces no false positive
    VERIFY: test with this specific phrase
    PASS: No crisis detection fires

[ ] Crisis detection failure creates navigator task
    VERIFY: Mock phrase scanner to throw, run test
    PASS: Navigator task created: "Crisis detection failed — manual review required"
          Call processing continues normally
```

Crisis detection runs FIRST in every call processing pipeline. Wrap entire crisis detection block in its own try/catch. 15-phrase list in Section 8. Stub `disambiguateCrisisContext` returns `false` in v1. On API failure in M8+: default to `true`.

---

## ═══ M6 — FAMILY DASHBOARD ═══

### PHASE 12 — Family Dashboard Shell & Health Timeline

**Checklist items:**
```
PHASE 12 CHECKLIST
[ ] Dashboard loads < 3 seconds with seed data
    VERIFY: Log in as test-family@thriveathome.dev, navigate to /dashboard, time load
    PASS: All sections populated within 3 seconds

[ ] All 4 health timeline tabs render
    VERIFY: Click each tab (7-day, 30-day, 60-day, 90-day)
    PASS: Chart renders in each tab without error

[ ] New alert appears via Realtime without refresh
    VERIFY: Dashboard open → insert test alert via SQL Editor
    PASS: Alert card appears and StatusDot updates within 2 seconds

[ ] Error state shows human-readable message
    VERIFY: Break Supabase URL, reload dashboard
    PASS: Friendly error message, no raw error code visible

[ ] Mobile layout at 375px
    VERIFY: DevTools → 375px, scroll entire dashboard
    PASS: No horizontal scroll, all text readable, all buttons tappable
```

Parallel data fetch: `Promise.all([getMember, getRecentCalls, getActiveAlerts, getUnreadNotifications, getFamilyTasks])`. Every section has a Skeleton loading state. 8-second timeout per section with per-section error indicator. Recharts `LineChart` for mood trend.

---

### PHASE 13 — Call History Page

**Checklist items:**
```
PHASE 13 CHECKLIST
[ ] Calls listed newest-first, correct data per row
    VERIFY: Navigate to /dashboard/calls with seed data
    PASS: Dates descending, mood emojis correct, medication status shown

[ ] Expanded row shows plain-English flag labels
    VERIFY: Click a call row with alert flags
    PASS: "Aria noted a mention of a fall" — not "fall"

[ ] Load-more works without page reload
    VERIFY: With 25+ calls, scroll to bottom, click Load more
    PASS: More calls append, page does not reload
```

---

### PHASE 14 — Family Coordination Tools

**Checklist items:**
```
PHASE 14 CHECKLIST
[ ] Task board: task created by User A appears for User B within 2 seconds
    VERIFY: Two browser windows, same senior's family group, User A creates task
    PASS: Appears for User B via Realtime, no refresh

[ ] Family messaging: message appears for all linked members in real time
    VERIFY: Two browser windows, User A sends message
    PASS: Appears for User B within 2 seconds, no refresh

[ ] Document upload and download work
    VERIFY: Upload PDF < 10MB, click Download
    PASS: Upload succeeds, download starts immediately

[ ] Large file rejected with clear error
    VERIFY: Attempt to upload file > 10MB
    PASS: Clear error message, upload does not proceed

[ ] Family nudge fires after 7-day absence with active alert
    VERIFY: Set last_login_at to 8 days ago, ensure concern alert exists, trigger Edge Function
    PASS: family_nudge notification inserted in realtime_notifications

[ ] Family nudge does NOT fire within 7-day window
    VERIFY: Trigger nudge function again within 7 days
    PASS: No second notification inserted
```

Requires Realtime enabled for `family_task_items` and `family_messages` (Supabase → Database → Replication). Create `member-documents` Storage bucket (private). Signed URLs generated at click time, not page load. `family-nudge-check` Edge Function.

---

## SECTION 9 — Accessibility Standards (Every Phase)

Apply as build requirements, not a review checklist:

- Body text: `text-lg` (18px) minimum everywhere
- Buttons and touch targets: `min-h-[52px]` minimum
- Colour contrast: ≥ 4.5:1 for all text
- Form labels: visible `<label>` above every input — never placeholder-only
- Focus ring: never `outline: none` without a visible replacement
- Error messages: visible text below the failing field
- Every page: `export const metadata: Metadata = { title: '...' }`
- Colour never sole conveyor of meaning — always pair with a label or icon
- Mobile at 375px: no horizontal scroll on any page

Run `npx axe-cli [URL] --tags wcag2aa` before every milestone gate. Zero violations.

---

## SECTION 10 — What Comes After V1

When all 14 phases are APPROVED, the build continues by appending separate documents:

**Add-On Milestones** (`prompt-addons.md`): M7 Navigator Console, M8 AI Calls, M9 Concierge Line, M10 SMS + Email, M11 Stripe Billing, M12 HIPAA + Compliance.

**Advanced Milestones** (`prompt-advanced.md`): M13–M18.

To add an Add-On: start a new session, read `progress.md` + `checklist.md` + this file + the new document. All interfaces and stubs from Phase 1 are in place. Activating a real service requires only: (a) the new implementation in `/lib/services/`, (b) update `providers.ts`. Zero other changes.


---

## September 2026 Update — Platform Completion

All milestones M1-M27 are complete. Key additions since last prompt update:

**M22 — Device & Smart Home:** /dashboard/devices, wearables, fall detection, FHIR/Epic
**M23 — Advanced AI/ML:** Wellness baselines, fall risk, isolation scoring, grief pattern monitoring
**M24 — Professional Services:** Trusted advisors, VITA tax help, /crisis page, document vault
**M25 — Cultural Programming:** Festival calendar (23 festivals), Classes/Potlucks/Story Circle/Heritage/Oral History
**M26 — Premium Add-Ons:** 5 monthly + 4 one-time add-ons, Caregiver Family Plan, Memory Books
**M27 — Pet & Companion:** Pet profiles, pet birthdays, Pet Loss Circle, pet milestone celebrations

**12 AI voice agents built (Retell AI):** Aria, Rosa, Joy, Grace, Hope, Claire, Sam, Morgan, Nova, Alex, Quinn, Jordan.
Each has distinct name, personality, voice. Multilingual agents deferred to Phase 55.

**Aria opt-in:** Default NO. members.aria_call_opted_in = false. Human navigator calls first 21 days.
**Privacy settings:** members.family_can_see_mood/call_summaries/service_history/alerts all implemented.
**Migrations run:** 069_aria_call_opt_in, 070_member_privacy_settings both confirmed in Supabase.
