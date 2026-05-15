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

**What is deliberately NOT in this document:**
- M7 Navigator Console — Add-On, appended later as `prompt-addons.md`
- M8 AI Calls (Retell AI, Anthropic) — Add-On
- M9 Concierge Line — Add-On
- M10 SMS/Email Notifications (Twilio, SendGrid) — Add-On
- M11 Billing (Stripe) — Add-On
- M12 Compliance (HIPAA, SOC 2) — Add-On
- M13–M18 Advanced features — separate `prompt-advanced.md` appended later

**Placeholder pages are required for all excluded sections.** Every route that will be built later must exist now as a "Coming soon" shell — so the app never 404s and always feels complete.

---

## SECTION 1 — Rules (Non-Negotiable)

These apply to every phase, every file, every line of code. They are not guidelines. Any violation is a build error that must be fixed before proceeding.

---

### Rule 1 — Human approval before every phase transition

This is the most important rule. No exceptions. No "simple" phases. No "closely related" phases. Every phase. Every time.

When you believe a phase is complete:

1. Stop writing code immediately
2. Run every test for that phase defined in `tests.md`
3. Present your review in this **exact** format — do not change the structure:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ PHASE [N] — [PHASE NAME] — COMPLETE, AWAITING YOUR APPROVAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

What was built:
• [full path of every file created]
• [full path of every file modified — and what changed]
• [every Supabase table, column, policy, Edge Function, or Storage bucket created or changed]
• [every npm package installed]
• [every environment variable added]

Tests run:
• [Test ID]: PASSED — [one sentence: exactly what was verified]
• [Test ID]: FAILED — [exactly what was observed vs what was expected]

What to check right now:
• [specific URL or exact Supabase dashboard location — be precise, not vague]
• [another specific item]

Please verify the items above, then reply:
  APPROVED — I will immediately begin Phase [N+1]
  ISSUE: [describe exactly what you see] — I will fix before asking again
```

4. **Wait.** Do not begin N+1. Do not write preparatory code. Do not say "while you review, let me get started on…". Do not ask if you should proceed. Wait.

5. **APPROVED** → update `checklist.md` to mark Phase N as `[x]`, append entry to `progress.md`, begin N+1.

6. **ISSUE** → fix the problem, re-run affected tests, present the same review format again. Do not advance until APPROVED.

7. **Ambiguous reply** → ask exactly: "Should I proceed to Phase [N+1], or is there something to fix first?" Do not assume.

---

### Rule 2 — Never claim success without proof

A phase that compiles is not complete. Code that looks right is not tested. The test in `tests.md` is the only acceptable proof. If a test cannot run because an environment variable is missing: stop, name the exact variable, say exactly where to find it in the service dashboard, say exactly where to put it (`.env.local` and Vercel). Do not skip, approximate, or work around.

---

### Rule 3 — Never assume environment variables are set

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

**Never:**
- `process.env.X!` — non-null assertion hides missing vars
- `process.env.X ?? ''` — empty string silently breaks downstream code
- `process.env.X ?? 'placeholder'` — placeholder hides missing vars
- Any credential accessed from a Client Component or client-side hook

---

### Rule 4 — Never swallow errors

```ts
// WRONG — silent failure, impossible to debug
try { return await doSomething() } catch { return null }

// RIGHT
try {
  return await doSomething()
} catch (e) {
  console.error('[module/functionName] Failed:', e)
  throw new Error(`[module/functionName] Failed: ${e instanceof Error ? e.message : String(e)}`)
}
```

**Supabase — always check both `data` and `error`:**
```ts
const { data, error } = await supabase.from('members').select('*').eq('id', id).maybeSingle()
if (error) { console.error('[getMember]', error); return { data: null, error: error.message } }
if (!data)  return { data: null, error: 'Not found' }
return { data, error: null }
```

Use `.maybeSingle()` for any query that may return zero rows. Never use `.single()` — it throws when no rows are found, which is a valid state.

---

### Rule 5 — Never hardcode secrets

No API key, token, webhook secret, phone number, email address, or environment-specific URL as a string literal in any `.ts` or `.tsx` file. If it could grant access to a service or leak configuration — it belongs in `.env.local`. Specifically prohibited as literals: anything starting with `eyJ`, `sk_`, `pk_`, `SG.`, `AC`, `retell-`, `sk-ant-`. Any phone number. Any config email address. The app's own production URL.

---

### Rule 6 — Never let secrets reach GitHub

`.gitignore` is created before any other file, before the first commit. After creating it, immediately verify:

```bash
echo "TEST=secret" > .env.local && git status
```

`.env.local` must appear under **"Untracked files"** only — never under "Changes to be committed". If it's tracked: fix `.gitignore` before any other step.

Before every commit run both:
```bash
git ls-files | grep -E "^\.env"
git diff --cached --name-only | xargs grep -l \
  -E "(sk_live|sk_test|pk_live|pk_test|SG\.|AC[a-z0-9]{32}|whsec_|retell-|sk-ant-)" 2>/dev/null
```
Both must produce **no output**. If either produces output: stop, do not commit, fix first.

---

### Rule 7 — One phase at a time

Read the current phase section fully before writing any code. Build exactly what it describes — nothing more. Do not add "useful" extras. Do not start the next phase. Do not refactor previous phases unless the current phase explicitly requires it. Scope creep is the primary failure mode.

---

### Rule 8 — When a session ends mid-phase

Before closing a conversation that is mid-phase:
1. Append a `STATUS: IN_PROGRESS` entry to `progress.md`
2. List every file touched, every test run, every decision made this session
3. In `NEXT SESSION MUST`, describe exactly where to resume — specific file name, specific function, specific line number or step number
4. Update `checklist.md` to mark the phase `[~]`

Starting the next session:
1. Read `progress.md` completely from top to bottom
2. Find the `[~]` phase in `checklist.md`
3. Resume exactly from where the last entry says — never redo completed steps, never jump ahead

---

### Rule 9 — Write for a non-technical founder

Every file: one-line plain-English comment at top explaining its purpose. Every exported function: JSDoc comment. User-facing error messages: readable sentences, never error codes or stack traces.

```ts
// WRONG
throw new Error('PGRST116: multiple rows returned')
// RIGHT
return { error: "We couldn't find your account. Please try signing in again." }
```

Comments explain **why** — not what. If the what is obvious from reading the code, the comment adds nothing.

---

### Rule 10 — TypeScript strict mode, always

`tsconfig.json` must have `"strict": true`. No `any` — use `unknown` with type guards. All exported function parameters and return types explicitly typed. `npx tsc --noEmit` before every phase review. Zero errors is the requirement — not "mostly clean".

---

### Rule 11 — No test data in production code paths

Test scripts and seed scripts live in `/scripts/` only. Never imported by `/app/`, `/lib/`, or `/components/`. All rows inserted by a test script must be deleted at the end of the same script. Never leave test data in the database after a test run.

---

### Rule 12 — Security on every API route and Edge Function

In this exact order, before any database access:
1. Verify authentication → `401` if no valid session
2. Verify authorisation → `403` if the authenticated user lacks permission for **this specific resource** (not just any resource of this type)
3. Validate inputs → `400` with a specific message if required fields are missing or invalid
4. Return only the minimum data the caller needs

Never skip step 2 because step 1 passed. A logged-in user is not necessarily authorised to read any given row.

---

### Rule 13 — Modular service architecture from Phase 1

Every feature depending on an external paid service (AI, SMS, email, billing, voice calls, transport, meals, physical goods) is built behind a TypeScript interface with a stub implementation. The product is fully functional with stubs. Real services are added in Add-On milestones — they require zero changes to existing code.

**The pattern:**
```ts
// Interface — defined in Phase 1, never modified
// /lib/interfaces/SmsProvider.ts
export interface SmsProvider {
  send(to: string, body: string): Promise<void>
  sendUrgent(to: string, body: string): Promise<void>
}

// Stub — active by default, logs what would happen, never throws
// /lib/stubs/StubSmsProvider.ts
export class StubSmsProvider implements SmsProvider {
  async send(to: string, body: string): Promise<void> {
    console.log(`[STUB][SMS] Would send to ${to.substring(0,6)}xxx: "${body.substring(0,80)}..."`)
  }
  async sendUrgent(to: string, body: string): Promise<void> {
    console.log(`[STUB][SMS][URGENT] Would send to ${to.substring(0,6)}xxx: "${body.substring(0,80)}..."`)
  }
}

// Real implementation — created in the Add-On milestone, NOT in v1
// /lib/services/TwilioSmsProvider.ts  ← does not exist yet
```

`/lib/providers.ts` is the **only** file that selects stub vs real. Application code imports from `providers.ts` only — never from `/lib/stubs/` or `/lib/services/` directly. When a real service is added later, only two files change: the new implementation file and `providers.ts`. Everything else stays untouched.

---

### Rule 14 — Edge Functions for all server-side business logic

All server-side business logic goes in Supabase Edge Functions — not Next.js API routes. Edge Functions use Deno runtime, run at the edge, and use the service role key safely.

**What goes in Edge Functions:**
- Alert creation and detection
- Realtime notification push
- Call scheduling triggers
- Webhook handlers (Retell AI, Stripe, Checkr)
- Cron-triggered jobs (missed calls, wellness drift, nudges)
- Any operation requiring `SUPABASE_SERVICE_ROLE_KEY`

**What stays in Next.js routes (the exceptions):**
- `/app/api/auth/callback` — Supabase Auth requires this in Next.js
- Stripe checkout redirect — requires Next.js session + redirect
- Any route needing Next.js-specific middleware behaviour

**Edge Function boilerplate:**
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
    // Service-role client for operations requiring RLS bypass
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    // ... business logic
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (e) {
    console.error('[function-name] Error:', e)
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
```

Local development:
```bash
supabase start
supabase functions serve  # serves at http://localhost:54321/functions/v1/
```

Deploy: `supabase functions deploy [name] --project-ref <ref>`

---

### Rule 15 — RLS on every table before any data is inserted

RLS is enabled on every table in the same migration that creates it. A table with RLS enabled and no policies denies all user access — this is the correct safe default. Policies are additive. Never disable RLS to fix a data access problem — write the correct policy.

**The four access personas:**

| Persona | Who | Auth mechanism |
|---------|-----|---------------|
| `family` | Adult children | Supabase Auth JWT, `role = 'family'` |
| `navigator` | Care coordinators | Supabase Auth JWT, `role = 'navigator'` |
| `admin` | Platform staff | Supabase Auth JWT, `role = 'admin'` |
| `service_role` | Edge Functions, webhooks | `SUPABASE_SERVICE_ROLE_KEY` — bypasses RLS entirely |

**Policy pattern:**
```sql
-- Family reads only their own senior's data
CREATE POLICY "family_select_own_member" ON members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.member_id = members.id
      AND fm.supabase_auth_id = auth.uid()
  )
);
```

After every RLS change: test cross-user isolation with two real Supabase Auth test users. Confirm User A's query for Member B returns empty array — not a row, not an error.

---

### Rule 16 — Seed data before every dashboard phase

`/scripts/seed-test-data.ts` is created in Phase 7 and run before Phase 12 (Family Dashboard). It must be **idempotent** — running twice creates no duplicates. Check by email before every insert.

**What to create:**
- Auth user: `test-family@thriveathome.dev` / `TestPassword123!`
- Family member row linked to auth user, `role = 'family'`
- Senior: full name "Margaret Chen", preferred name "Margaret", DOB 1945-06-15, `topics_enjoy: ["Gardening","Books","Family stories"]`, phone `+15550001234`, `plan_tier: 'basics'`, `status: 'active'`
- 14 `check_in_calls` (status `completed`) with mood arc: 8,8,7,8,7,6,7,6,5,6,5,5,4,5 across the last 14 days. Each row has a short `ai_summary` stub sentence.
- 2 `alerts`: one `informational` (acknowledged), one `concern` (unacknowledged)
- 2 `realtime_notifications`: one `read=true`, one `read=false`
- 1 navigator row, 1 `navigator_assignments` row, 3 `navigator_tasks`
- Prints at the end: `Login: test-family@thriveathome.dev / TestPassword123! | Member: Margaret Chen`

Companion `/scripts/clear-test-data.ts` deletes all rows created by seed. Runs without error even if rows don't exist.

---

### Rule 17 — Placeholder pages for all future routes

Every route that will be built in M7–M18 must exist now as a placeholder. This prevents 404 errors and makes the app feel complete from day one. No business logic, no database calls, no imports beyond the page component itself.

**Placeholder pattern:**
```tsx
// Example: /app/navigator/page.tsx
export default function NavigatorPage() {
  return (
    <div className="min-h-screen bg-brand-warm-white flex items-center justify-center">
      <div className="text-center p-8 max-w-md">
        <h1 className="text-2xl font-semibold text-brand-navy mb-2">Navigator Console</h1>
        <p className="text-gray-500 text-lg">This feature is coming soon.</p>
      </div>
    </div>
  )
}
```

**Required placeholders — create all in Phase 1:**
```
/app/navigator/page.tsx              — M7
/app/admin/page.tsx                  — M7
/app/dashboard/calls/page.tsx        — M8
/app/dashboard/concierge/page.tsx    — M9
/app/dashboard/billing/page.tsx      — M11
/app/privacy/page.tsx                — M12
/app/volunteer/page.tsx              — M13
/app/student/page.tsx                — M13
/app/dashboard/events/page.tsx       — M14
/app/dashboard/groups/page.tsx       — M14
/app/dashboard/skill-exchange/page.tsx — M14
/app/dashboard/cultural-circles/page.tsx — M14
/app/dashboard/benefits/page.tsx     — M14
/app/employers/page.tsx              — M14
/app/dashboard/celebrations/page.tsx — M15
/app/dashboard/life-story/page.tsx   — M15
/app/dashboard/grief-support/page.tsx — M16
/app/dashboard/services/page.tsx     — M17
/app/outcomes/page.tsx               — M18
```

---

### Rule 18 — Comprehensive edge case handling

Check for every item below before presenting any phase review.

**Supabase queries:**
- `.single()` used where `.maybeSingle()` is correct — replace every deduplication and existence check
- `data` used without checking if it's null first — always check `if (!data)` before accessing properties
- RLS policy written but `ALTER TABLE x ENABLE ROW LEVEL SECURITY` not run — always enable first
- Service role key used in a client-callable path — it bypasses RLS; only use in Edge Functions and server-only routes
- Orphaned Supabase Auth user: `family_members` insert failed after auth user created — must delete the auth user if the insert fails, and show the user a clear error

**TypeScript:**
- `any` used — replace with `unknown` + type guard
- Non-null assertion `!` on env var — use `requireEnv()` instead
- Missing return type on exported function — add it
- `npx tsc --noEmit` has errors — zero errors required before any phase review
- Missing `'use client'` directive on a component using React hooks — add it
- Server-only import in a Client Component — move to a Server Component

**Next.js / Vercel:**
- `NEXT_PUBLIC_` prefix on any credential — remove the prefix immediately; credentials are server-only
- Client Component importing `lib/supabase/admin.ts` — the admin client is server-only; move the call
- Missing `export const metadata` on a page — every page needs a title
- Vercel build fails because env var not set in Vercel dashboard — add it there, not just in `.env.local`
- Vercel build fails with `Module not found` — check import paths use `@/` alias consistently

**Environment / secrets:**
- `.env.local` appearing in `git status` as tracked — `.gitignore` broken; fix before any commit
- `VAR=` with an empty value treated as set — `requireEnv()` catches this with the `.trim()` check
- Credential pasted into source code — revoke and regenerate at the service dashboard immediately

**Edge Functions:**
- Missing CORS headers — all Edge Functions need the `corsHeaders` response and OPTIONS handler
- Missing `Authorization` header check — every user-callable Edge Function must verify the caller
- Edge Function not deployed after changes — always run `supabase functions deploy [name]`
- Edge Function URL wrong in client call — local is `http://localhost:54321/functions/v1/[name]`, production is from Supabase project settings
- Deno import from npm — use `https://esm.sh/[package]@[version]` pattern

**Database:**
- Enum created after table that uses it — all `CREATE TYPE` statements must appear before all `CREATE TABLE` statements
- FK references a table created later in the file — reorder to put referenced tables first
- `ALTER TABLE` not included in migration file after schema change — migration file is the source of truth
- Realtime not enabled for `realtime_notifications` — check Supabase → Database → Replication

**Forms:**
- Form advances with empty required fields — validation must block advancement
- DOB accepts any date — validate person is ≥ 60 years old; reject future dates entirely
- Phone accepts non-numeric input — validate E.164 (`/^\+[1-9]\d{1,14}$/`) or US format
- `localStorage` not cleared after successful form submission — clear on success

**Mobile:**
- Text smaller than 18px — inspect every element before review
- Button height less than 52px — inspect every interactive element
- Horizontal scroll at 375px — test every page in browser dev tools at 375px
- Tap target smaller than 52×52px — check every interactive element

**Realtime:**
- Notifications not appearing — Realtime not enabled for `realtime_notifications` INSERT events in Supabase dashboard
- Duplicate notifications on reconnect — add a `Set` of seen IDs in hook state; skip if already seen
- Channel subscription leaking — confirm `supabase.removeChannel(channel)` is returned from `useEffect` cleanup
- User sees another member's notifications — RLS policy on `realtime_notifications` is missing or wrong

**Auth:**
- Infinite redirect loop in middleware — add `console.log('[middleware] path:', path, 'user:', !!user)` to trace
- Auth session not refreshed — middleware must call `supabase.auth.getUser()` on every request
- Role-based redirect wrong — check that `family_members.role` is set correctly on signup

---

## SECTION 2 — Secrets Management

### 2.1 — `.gitignore` (first file, before any commit)

```gitignore
# Environment — NEVER commit
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.env.production
.env*.local

# Dependencies and build output
node_modules/
.next/
out/
dist/
build/

# OS and editor
.DS_Store
Thumbs.db
.vscode/settings.json
.idea/

# Logs
*.log
npm-debug.log*
coverage/
.nyc_output/

# Supabase local (contains credentials)
supabase/.temp/
supabase/config.toml

# Vercel
.vercel/
```

### 2.2 — `.env.local.example` (committed — values always empty)

```bash
# THRIVE@HOME — Environment Variables (v1.0 — M1–M6 scope)
# Copy to .env.local and fill in real values.
# .env.local is gitignored and will NEVER be committed.

# ── CORE ─────────────────────────────────────────
NEXT_PUBLIC_APP_URL=
CARE_TEAM_EMAIL=
CRON_SECRET=

# ── SUPABASE (required from Phase 2) ─────────────
# supabase.com → your project → Settings → API
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

### 2.3 — Server-only vs browser-safe

Only three `NEXT_PUBLIC_` variables allowed:
- `NEXT_PUBLIC_SUPABASE_URL` — not a secret, RLS is the security layer
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public by design in Supabase's model
- `NEXT_PUBLIC_APP_URL` — the app's own URL, not a secret

Everything else uses `requireServerEnv()`. Never prefix a credential with `NEXT_PUBLIC_`.

---

## SECTION 3 — Project Architecture

### 3.1 — Folder structure (created in Phase 1, never reorganised)

```
/app
  /api
    /auth              Auth callback — Next.js only (Supabase Auth requires it here)
  /dashboard
    /family            Family coordination tools (Phase 14)
    /documents         Document vault (Phase 14)
    /life-story        [placeholder — M15]
    /grief-support     [placeholder — M16]
    /services          [placeholder — M17]
    /events            [placeholder — M14]
    /groups            [placeholder — M14]
    /skill-exchange    [placeholder — M14]
    /cultural-circles  [placeholder — M14]
    /benefits          [placeholder — M14]
    /billing           [placeholder — M11]
    /calls             Call history (Phase 13) + [placeholder for M8 AI calls]
    /concierge         [placeholder — M9]
    /celebrations      [placeholder — M15]
  /navigator           [placeholder — M7]
  /admin               [placeholder — M7]
  /volunteer           [placeholder — M13]
  /student             [placeholder — M13]
  /onboarding          3-step enrollment (Phase 6)
  /login               (Phase 5)
  /signup              (Phase 5)
  /pricing             [placeholder — M11]
  /privacy             [placeholder — M12]
  /outcomes            [placeholder — M18]
  /employers           [placeholder — M14]

/components
  /ui                  All primitives (Phase 8)
  /dashboard           Dashboard-specific components (Phase 12)
  /onboarding          Onboarding form steps (Phase 6)
  /shared              Reused across multiple sections

/lib
  /supabase
    client.ts          Browser Supabase client
    server.ts          Server Supabase client (SSR)
    admin.ts           Service role client — Edge Functions and server-only routes only
    functions.ts       callEdgeFunction() helper
  /interfaces          All 8 service interfaces — defined Phase 1, never modified
  /stubs               All 8 stub implementations — active by default
  /services            Real implementations — created in Add-On milestones (empty in v1)
  /providers.ts        THE ONE FILE that selects stub vs real
  /data                Typed Supabase query functions (Phase 7)
  /alerts              Alert detection and creation logic (Phase 10)
  /realtime            Realtime push helper and useNotifications hook (Phase 9)
  /env.ts              requireEnv and requireServerEnv
  /auth.ts             getUserRole, getCurrentUser, requireAuth

/supabase
  /functions
    /push-notification index.ts (Phase 9)
    /create-alert      index.ts (Phase 10)
    /check-missed-calls index.ts (Phase 10)
    /family-nudge-check index.ts (Phase 14)
  /migrations
    001_initial_schema.sql
    002_audit.sql

/types                 TypeScript types — no implementation code
/scripts               Seed, clear, and test scripts — never imported by app
```

### 3.2 — All 8 service interfaces (Phase 1 — never modified after)

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
  intent: 'service_request' | 'companionship_call' | 'emergency' | 'information' | 'care_team_transfer'
  serviceType?: 'transport' | 'meal' | 'companion' | 'tech_help' | 'home_service'
  urgency: 'low' | 'medium' | 'high' | 'emergency'
  summary: string
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
export type PlanTier = 'basics' | 'connect' | 'complete' | 'premier'
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
  bookRide(request: TransportBookingRequest): Promise<{ bookingId: string; estimatedArrival?: string }>
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

### 3.3 — `/lib/providers.ts` (created Phase 1 — only this file changes when adding real services)

```ts
// /lib/providers.ts
// THE ONE FILE that selects stub vs real for every external service.
// Application code imports from here ONLY — never from /lib/stubs/ or /lib/services/ directly.
// To activate a real service: add its implementation in /lib/services/ and update the resolver below.
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

// Each resolver: returns real implementation if env var present, stub otherwise.
// Real implementations are added in Add-On milestones — they don't exist yet in v1.

function resolveAiProvider(): AiProvider {
  if (process.env.ANTHROPIC_API_KEY) {
    // Added in M8
    const { AnthropicAiProvider } = require('./services/AnthropicAiProvider')
    return new AnthropicAiProvider()
  }
  return new StubAiProvider()
}

function resolveCallProvider(): CallProvider {
  if (process.env.RETELL_API_KEY && process.env.TWILIO_ACCOUNT_SID) {
    // Added in M8
    const { RetellCallProvider } = require('./services/RetellCallProvider')
    return new RetellCallProvider()
  }
  return new StubCallProvider()
}

function resolveSmsProvider(): SmsProvider {
  if (process.env.TWILIO_ACCOUNT_SID) {
    // Added in M10
    const { TwilioSmsProvider } = require('./services/TwilioSmsProvider')
    return new TwilioSmsProvider()
  }
  return new StubSmsProvider()
}

function resolveEmailProvider(): EmailProvider {
  if (process.env.SENDGRID_API_KEY) {
    // Added in M10
    const { SendGridEmailProvider } = require('./services/SendGridEmailProvider')
    return new SendGridEmailProvider()
  }
  return new StubEmailProvider()
}

function resolveBillingProvider(): BillingProvider {
  if (process.env.STRIPE_SECRET_KEY) {
    // Added in M11
    const { StripeBillingProvider } = require('./services/StripeBillingProvider')
    return new StripeBillingProvider()
  }
  return new StubBillingProvider()
}

function resolveTransportProvider(): TransportProvider {
  if (process.env.LYFT_HEALTHCARE_API_KEY) {
    // Added in M17
    const { LyftTransportProvider } = require('./services/LyftTransportProvider')
    return new LyftTransportProvider()
  }
  return new StubTransportProvider()
}

function resolveMealProvider(): MealProvider {
  if (process.env.INSTACART_API_KEY) {
    // Added in M17
    const { InstacartMealProvider } = require('./services/InstacartMealProvider')
    return new InstacartMealProvider()
  }
  return new StubMealProvider()
}

function resolveGoodsProvider(): GoodsProvider {
  if (process.env.ONE800FLOWERS_API_KEY || process.env.ARTIFACT_UPRISING_API_KEY) {
    // Added in M16
    const { RealGoodsProvider } = require('./services/RealGoodsProvider')
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

### 3.4 — Stub implementation standard

Every stub method: logs with `[STUB]` prefix, returns a sensible typed placeholder, never throws, never causes real side effects.

```ts
// /lib/stubs/StubAiProvider.ts
import type { AiProvider, CallScores, CarePlan, ConciergeTriage } from '../interfaces/AiProvider'
import type { Member } from '../../types/member'
import type { CheckInCall } from '../../types/call'

/** Stub AI provider — logs what would happen. Active until Anthropic is configured (M8). */
export class StubAiProvider implements AiProvider {
  async generateCallSummary(_transcript: string): Promise<string | null> {
    console.log('[STUB][AI] generateCallSummary called')
    return 'Margaret had a good morning. She mentioned enjoying her coffee on the porch and is looking forward to her granddaughter\'s visit this weekend. Her knee is feeling better today. [STUB — real summary activates in M8]'
  }
  async extractCallScores(_speech: string): Promise<CallScores> {
    console.log('[STUB][AI] extractCallScores called')
    return { mood_score: 7, energy_score: 6, pain_score: null, medication_taken: true, alert_flags: [] }
  }
  async disambiguateCrisisContext(_phrase: string, _context: string): Promise<boolean> {
    // In v1 no real calls are made, so stub safely returns false (no crisis)
    // In M8, the real Anthropic implementation replaces this
    console.log('[STUB][AI] disambiguateCrisisContext called — returning false (development mode)')
    return false
  }
  async generateNavigatorBrief(_memberId: string, summaries: string[]): Promise<string> {
    console.log('[STUB][AI] generateNavigatorBrief called')
    return `[STUB] Before calling this member: review their last ${summaries.length} call summaries. Real brief activates in M8.`
  }
  async generateCarePlan(_member: Member, _calls: CheckInCall[]): Promise<CarePlan> {
    console.log('[STUB][AI] generateCarePlan called')
    return { wellnessSummary: '[STUB]', topStrengths: [], areasForAttention: [], recommendedActions: [], communityOpportunities: [], familyTalkingPoints: [], nextReviewDate: null }
  }
  async generateWeeklyDigest(_member: Member, _calls: CheckInCall[]): Promise<string> {
    console.log('[STUB][AI] generateWeeklyDigest called'); return '[STUB] Weekly digest'
  }
  async generateMonthlySummary(_member: Member, _calls: CheckInCall[]): Promise<string> {
    console.log('[STUB][AI] generateMonthlySummary called'); return '[STUB] Monthly summary'
  }
  async generateCelebrationPersonalisation(_member: Member, _type: string): Promise<string> {
    console.log('[STUB][AI] generateCelebrationPersonalisation called'); return '[STUB] Celebration message'
  }
  async generateConciergeTriage(_transcript: string): Promise<ConciergeTriage> {
    console.log('[STUB][AI] generateConciergeTriage called')
    return { intent: 'information', urgency: 'low', summary: '[STUB]' }
  }
  async generateFamilyNudgeTopic(_member: Member, _calls: CheckInCall[]): Promise<string> {
    console.log('[STUB][AI] generateFamilyNudgeTopic called')
    return 'Ask about their week — they mentioned enjoying their morning coffee routine.'
  }
}
```

### 3.5 — Supabase Realtime pattern (always real — no stub)

Realtime uses the anon key. It requires no additional paid service. It is the primary in-browser notification channel throughout M1–M6 and beyond.

```ts
// /lib/realtime/notifications.ts
import { createAdminClient } from '../supabase/admin'

export interface RealtimeNotification {
  type: 'new_alert' | 'call_completed' | 'call_summary_ready' | 'medication_reminder'
    | 'system_message' | 'service_booking_update' | 'grief_support_assigned'
    | 'family_nudge' | 'celebration_upcoming' | 'volunteer_matched'
  memberId: string
  title: string
  body: string
  severity?: 'info' | 'concern' | 'urgent' | 'emergency'
  callId?: string
  alertId?: string
}

/** Insert a row into realtime_notifications — Supabase Realtime broadcasts it to connected clients. */
export async function pushRealtimeNotification(n: RealtimeNotification): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin.from('realtime_notifications').insert({
    type: n.type, member_id: n.memberId, title: n.title, body: n.body,
    severity: n.severity ?? 'info', call_id: n.callId ?? null, alert_id: n.alertId ?? null,
  })
  // Log but never throw — notification failure must not crash the calling pipeline
  if (error) console.error('[realtime/push] Insert failed:', error)
}
```

---

## SECTION 4 — Database Schema

All SQL lives in `/supabase/migrations/`. Write it completely before running anything in Supabase. The migration file is the source of truth — never modify the database through the UI without also updating the migration file.

### 4.1 — Schema standards

- PKs: `id uuid DEFAULT gen_random_uuid() PRIMARY KEY`
- Timestamps: `created_at timestamptz DEFAULT now() NOT NULL`
- Foreign keys: `ON DELETE CASCADE` (document exceptions with a comment)
- Enums: `CREATE TYPE` before any table using them
- Arrays: `text[]` — never `jsonb` arrays
- Structured data: `jsonb` — never `json`
- Phone numbers: `text`
- Enum values: `lowercase_with_underscores`
- RLS: `ALTER TABLE x ENABLE ROW LEVEL SECURITY` in the same file that creates the table

### 4.2 — Core enums

```sql
CREATE TYPE plan_tier          AS ENUM ('basics', 'connect', 'complete', 'premier');
CREATE TYPE member_status      AS ENUM ('active', 'inactive', 'paused');
CREATE TYPE user_role          AS ENUM ('family', 'navigator', 'admin');
CREATE TYPE call_status        AS ENUM ('scheduled', 'in_progress', 'completed', 'missed', 'failed');
CREATE TYPE call_type          AS ENUM ('check_in', 'concierge', 'navigator');
CREATE TYPE alert_type         AS ENUM ('missed_call', 'mood_drop', 'medication_miss', 'wellness_drift', 'fall', 'crisis', 'emergency');
CREATE TYPE alert_severity     AS ENUM ('informational', 'concern', 'urgent', 'emergency');
CREATE TYPE task_priority      AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE notif_type         AS ENUM ('new_alert', 'call_completed', 'call_summary_ready', 'medication_reminder', 'system_message', 'service_booking_update', 'grief_support_assigned', 'family_nudge', 'celebration_upcoming', 'volunteer_matched');
CREATE TYPE notif_severity     AS ENUM ('info', 'concern', 'urgent', 'emergency');
CREATE TYPE notif_channel      AS ENUM ('realtime', 'sms', 'email');
CREATE TYPE notif_status       AS ENUM ('sent', 'failed', 'stub');
CREATE TYPE check_in_frequency AS ENUM ('daily', 'every_other_day', 'weekly');
```

### 4.3 — Tables (`/supabase/migrations/001_initial_schema.sql`)

```sql
-- Members (seniors on the platform)
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

-- Family members (adults managing a senior's account)
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

-- Check-in calls (every AI call record)
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

-- Alerts
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

-- Care navigators
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

-- Navigator assignments
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

-- Navigator tasks
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

-- Navigator notes
CREATE TABLE navigator_notes (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   timestamptz DEFAULT now() NOT NULL,
  member_id    uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  navigator_id uuid NOT NULL REFERENCES care_navigators(id) ON DELETE CASCADE,
  note         text NOT NULL
);
ALTER TABLE navigator_notes ENABLE ROW LEVEL SECURITY;

-- Subscriptions (populated in M11 — table exists now so no migration needed later)
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

-- Realtime notifications (primary in-browser channel)
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

-- Notification log (audit trail for all outbound notifications)
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

-- Emergency log (immutable record of every crisis event)
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

-- Medication schedules
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

-- Family task board (coordination — Phase 14)
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

-- Family messaging (Phase 14)
CREATE TABLE family_messages (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  member_id  uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  sender_id  uuid NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  body       text NOT NULL
);
ALTER TABLE family_messages ENABLE ROW LEVEL SECURITY;

-- Document vault (Phase 14 — Supabase Storage holds files, this table holds metadata)
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

-- Audit log (written by Edge Functions via service role)
CREATE TABLE audit_log (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at    timestamptz DEFAULT now() NOT NULL,
  user_id       uuid,
  action        text NOT NULL,
  resource_type text NOT NULL,
  resource_id   text
);
-- No RLS on audit_log — written by service role only; never directly queryable by users
```

### 4.4 — Indexes

```sql
CREATE INDEX idx_calls_member_scheduled  ON check_in_calls(member_id, scheduled_at DESC);
CREATE INDEX idx_alerts_member_unacked   ON alerts(member_id, acknowledged) WHERE acknowledged = false;
CREATE INDEX idx_family_auth_id          ON family_members(supabase_auth_id);
CREATE INDEX idx_nav_assignments_nav     ON navigator_assignments(navigator_id);
CREATE INDEX idx_notifs_member_unread    ON realtime_notifications(member_id, read, created_at DESC);
CREATE INDEX idx_tasks_member_incomplete ON family_task_items(member_id, completed) WHERE completed = false;
CREATE INDEX idx_messages_member         ON family_messages(member_id, created_at ASC);
```

### 4.5 — RLS policies

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
CREATE POLICY "family_select_own_tasks" ON family_task_items FOR SELECT
USING (EXISTS (SELECT 1 FROM family_members fm WHERE fm.member_id = family_task_items.member_id AND fm.supabase_auth_id = auth.uid()));

CREATE POLICY "family_insert_own_tasks" ON family_task_items FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM family_members fm WHERE fm.member_id = family_task_items.member_id AND fm.supabase_auth_id = auth.uid()));

CREATE POLICY "family_update_own_tasks" ON family_task_items FOR UPDATE
USING (EXISTS (SELECT 1 FROM family_members fm WHERE fm.member_id = family_task_items.member_id AND fm.supabase_auth_id = auth.uid()));

-- FAMILY_MESSAGES
CREATE POLICY "family_select_own_messages" ON family_messages FOR SELECT
USING (EXISTS (SELECT 1 FROM family_members fm WHERE fm.member_id = family_messages.member_id AND fm.supabase_auth_id = auth.uid()));

CREATE POLICY "family_insert_own_messages" ON family_messages FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM family_members fm WHERE fm.member_id = family_messages.member_id AND fm.supabase_auth_id = auth.uid()));

-- DOCUMENT_VAULT_ITEMS
CREATE POLICY "family_select_own_documents" ON document_vault_items FOR SELECT
USING (EXISTS (SELECT 1 FROM family_members fm WHERE fm.member_id = document_vault_items.member_id AND fm.supabase_auth_id = auth.uid()));

CREATE POLICY "family_insert_own_documents" ON document_vault_items FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM family_members fm WHERE fm.member_id = document_vault_items.member_id AND fm.supabase_auth_id = auth.uid()));

-- NAVIGATOR TABLES
CREATE POLICY "navigator_select_assignments" ON navigator_assignments FOR SELECT
USING (EXISTS (SELECT 1 FROM care_navigators cn WHERE cn.id = navigator_assignments.navigator_id AND cn.supabase_auth_id = auth.uid()));

CREATE POLICY "navigator_select_tasks" ON navigator_tasks FOR SELECT
USING (EXISTS (SELECT 1 FROM care_navigators cn WHERE cn.id = navigator_tasks.navigator_id AND cn.supabase_auth_id = auth.uid()));

CREATE POLICY "navigator_update_tasks" ON navigator_tasks FOR UPDATE
USING (EXISTS (SELECT 1 FROM care_navigators cn WHERE cn.id = navigator_tasks.navigator_id AND cn.supabase_auth_id = auth.uid()));

CREATE POLICY "navigator_select_notes" ON navigator_notes FOR SELECT
USING (EXISTS (SELECT 1 FROM care_navigators cn WHERE cn.id = navigator_notes.navigator_id AND cn.supabase_auth_id = auth.uid()));

CREATE POLICY "navigator_insert_notes" ON navigator_notes FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM care_navigators cn WHERE cn.id = navigator_notes.navigator_id AND cn.supabase_auth_id = auth.uid()));
```

### 4.6 — Audit triggers (`/supabase/migrations/002_audit.sql`)

```sql
CREATE OR REPLACE FUNCTION log_data_access()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO audit_log (user_id, action, resource_type, resource_id)
  VALUES (
    auth.uid(), TG_OP, TG_TABLE_NAME,
    CASE WHEN TG_OP = 'DELETE' THEN OLD.id::text ELSE NEW.id::text END
  );
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

CREATE TRIGGER members_audit
  AFTER INSERT OR UPDATE OR DELETE ON members
  FOR EACH ROW EXECUTE FUNCTION log_data_access();

CREATE TRIGGER calls_audit
  AFTER INSERT OR UPDATE OR DELETE ON check_in_calls
  FOR EACH ROW EXECUTE FUNCTION log_data_access();

CREATE TRIGGER alerts_audit
  AFTER INSERT OR UPDATE OR DELETE ON alerts
  FOR EACH ROW EXECUTE FUNCTION log_data_access();
```

---

## SECTION 5 — Phase-by-Phase Build Instructions

---

## ═══ M1 — FOUNDATION ═══

### PHASE 1 — Project Scaffold

**Prerequisites:** GitHub repo `thrive-at-home` (Private) created. Vercel connected to GitHub. Supabase project created and 3 credentials saved. No other accounts needed yet.

**Step 1 — Create project:**
```bash
npx create-next-app@latest thrive-at-home \
  --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
cd thrive-at-home
node --version
```
If `node --version` returns below v18: stop. Tell user to install Node 18 LTS from nodejs.org. Do not proceed.

**Step 2 — Create `.gitignore` BEFORE anything else:**
Use exact content from Section 2.1. Then verify:
```bash
echo "TEST=secret" > .env.local && git status
```
`.env.local` must appear under "Untracked files" ONLY. If it appears as tracked: stop, show user how to fix `.gitignore`, re-verify before continuing.

**Step 3 — Create `.env.local.example`:**
Exact content from Section 2.2. This file IS committed — it has variable names and comments, never values.

**Step 4 — Create `.env.local`:**
```bash
cp .env.local.example .env.local
```
Fill in only: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL=http://localhost:3000`, `CARE_TEAM_EMAIL`, `CRON_SECRET`. All Add-On variables stay blank.

**Step 5 — Configure Tailwind brand tokens (`tailwind.config.ts`):**
```ts
theme: {
  extend: {
    colors: {
      brand: {
        navy: '#1B3A6B', 'navy-light': '#2A5298',
        teal: '#2A9D8F', 'teal-light': '#3DBFB0', 'warm-white': '#FAFAF8',
      },
    },
    fontSize: { base: ['18px', { lineHeight: '1.6' }] },
    minHeight: { touch: '52px' },
    minWidth:  { touch: '52px' },
  },
}
```

**Step 6 — Create full folder structure:**
```bash
mkdir -p \
  app/api/auth \
  "app/dashboard/family" "app/dashboard/documents" "app/dashboard/life-story" \
  "app/dashboard/grief-support" "app/dashboard/services" "app/dashboard/events" \
  "app/dashboard/groups" "app/dashboard/skill-exchange" "app/dashboard/cultural-circles" \
  "app/dashboard/benefits" "app/dashboard/billing" "app/dashboard/calls" \
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

**Step 7 — Create `/lib/env.ts`:** Exact content from Rule 3.

**Step 8 — Create all 8 service interfaces in `/lib/interfaces/`:** Exact content from Section 3.2.

**Step 9 — Create all 8 stub implementations in `/lib/stubs/`:**
Pattern from Section 3.4. Every stub method logs with `[STUB]` prefix, returns a typed placeholder, never throws.

**Step 10 — Create `/lib/providers.ts`:** Exact content from Section 3.3.

**Step 11 — Create all placeholder pages (Rule 17):**
Every route in Rule 17 gets a minimal shell using the placeholder pattern. No business logic, no database calls.

**Step 12 — Create `/app/page.tsx`:**
Landing page with brand colours, "Thrive@Home" heading, tagline "Peace of mind for families. Independence for seniors.", navigation links to `/login` and `/signup`.

**Step 13 — First commit and Vercel deploy:**
```bash
# Pre-commit security check
git ls-files | grep -E "^\.env"
git diff --cached --name-only | xargs grep -l \
  -E "(sk_live|sk_test|SG\.|AC[a-z0-9]{32}|retell-|sk-ant-)" 2>/dev/null
# Both must produce NO output before committing

git add .
git commit -m "Phase 1: scaffold, interfaces, stubs, providers, placeholder pages"
git push
```
Import repo in Vercel. Deploy with defaults. Update `NEXT_PUBLIC_APP_URL` in `.env.local` and Vercel Environment Variables once the live URL is known.

**Error recovery:**
- `node --version` < 18 → tell user to install Node 18 LTS. Stop until done.
- `.env.local` appears tracked → `.gitignore` broken. Show user the correct `.gitignore`, how to run `git rm --cached .env.local`, and how to re-verify.
- Vercel build fails → read the full Vercel build log. Fix the specific error shown. Push again. Never guess.
- `npx tsc --noEmit` errors → fix all before review. Zero errors is the requirement.
- Placeholder page causes TypeScript error → check that it imports only what it uses; remove any auto-imported unused modules.

---

### PHASE 2 — Supabase Connection

**Prerequisites:** Supabase credentials in `.env.local` and Vercel.

```bash
npm install @supabase/supabase-js @supabase/ssr
```

**Create four Supabase helper files:**

`/lib/supabase/client.ts` — browser client (anon key):
```ts
import { createBrowserClient } from '@supabase/ssr'
import { requireEnv } from '../env'
export function createClient() {
  return createBrowserClient(requireEnv('NEXT_PUBLIC_SUPABASE_URL'), requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'))
}
```

`/lib/supabase/server.ts` — server client (session cookies):
```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { requireEnv } from '../env'
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          try { toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) }
          catch { /* Server Component — cookie setting is a no-op, middleware handles it */ }
        },
      },
    }
  )
}
```

`/lib/supabase/admin.ts` — service role (Edge Functions + server-only routes):
```ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { requireServerEnv } from '../env'
let _adminClient: ReturnType<typeof createSupabaseClient> | null = null
export function createAdminClient() {
  if (!_adminClient) {
    _adminClient = createSupabaseClient(
      requireServerEnv('NEXT_PUBLIC_SUPABASE_URL'),
      requireServerEnv('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
  }
  return _adminClient
}
```

`/lib/supabase/functions.ts` — Edge Function caller:
```ts
import { requireEnv } from '../env'
export async function callEdgeFunction<T = unknown>(
  name: string, body: unknown, userToken?: string
): Promise<T> {
  const baseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
  const anonKey = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  const url = `${baseUrl}/functions/v1/${name}`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': anonKey,
      'Authorization': userToken ? `Bearer ${userToken}` : `Bearer ${anonKey}`,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`[callEdgeFunction/${name}] ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}
```

**`/middleware.ts`** — session refresh on every request:
```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname
  const protected_ = ['/dashboard', '/navigator', '/admin']
  if (protected_.some(p => path.startsWith(p)) && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }
  return response
}
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

**Connection test:** Create `connection_test` table in Supabase, insert one row manually, create `/app/test/page.tsx` that fetches and displays it, confirm it renders. Then delete the test page and table. Run `npx tsc --noEmit`.

**Error recovery:**
- "Invalid URL" → `NEXT_PUBLIC_SUPABASE_URL` wrong. Copy fresh from Supabase → Settings → API.
- 401 from Supabase → anon key wrong. Copy fresh from Supabase → Settings → API.
- Test page displays nothing → verify the row was inserted manually in Table Editor. Check RLS is NOT yet enabled on the test table (this is just a connection test — RLS comes in Phase 3).
- `createAdminClient` called from a Client Component → move to Server Component, API route, or Edge Function immediately.
- Middleware causes infinite redirect → add `console.log('[middleware]', path, !!user)` to debug. The matcher pattern must not match static assets.

---

### PHASE 3 — Database Schema

Write complete SQL files first. Run in Supabase SQL Editor. Verify in Table Editor.

**Step 1** — Write `/supabase/migrations/001_initial_schema.sql` using Section 4.2, 4.3, 4.4, 4.5 exactly.
**Step 2** — Write `/supabase/migrations/002_audit.sql` using Section 4.6 exactly.
**Step 3** — Run `001_initial_schema.sql` in Supabase SQL Editor. Check for errors.
**Step 4** — Run `002_audit.sql` in Supabase SQL Editor. Check for errors.
**Step 5** — Enable Realtime for `realtime_notifications`: Supabase → Database → Replication → Tables → enable INSERT for `realtime_notifications`.

**Error recovery:**
- `type "xyz" does not exist` → enum not created before table using it. Move all `CREATE TYPE` statements to top of file.
- `relation "xyz" already exists` → previous partial run. Add `DROP TABLE IF EXISTS xyz CASCADE;` at top, or use `CREATE TABLE IF NOT EXISTS`. Clean up before re-running.
- `relation "xyz" does not exist` in FK → referenced table created after the referencing table. Reorder tables so referenced tables appear first.
- RLS blocks all access after enabling → correct — policies in Section 4.5 must be run next. Check every policy was created by querying `pg_policies`.
- Realtime not broadcasting → open Supabase → Database → Replication. Confirm `realtime_notifications` appears in the tables list with INSERT checked. If not, toggle it on.

---

### PHASE 4 — Row Level Security Verification

RLS was enabled and policies were created in Phase 3. This phase verifies they work before building any UI.

Create `/scripts/test-rls.ts`. It must:
1. Use `createAdminClient()` to create two Supabase Auth users: `user-a@test.com` and `user-b@test.com`
2. Create two `family_members` rows and two `members` rows — User A linked to Member A, User B to Member B
3. Sign in as User A with the browser client (`createClient()`)
4. Query `members` for Member B's ID — assert result is empty array or null (not a row)
5. Query `members` for Member A's ID — assert result is one row
6. Query `realtime_notifications` for Member B's ID — assert empty
7. Sign in as User B, repeat the cross-isolation test in reverse
8. Use `createAdminClient()` (service role) to read all members — assert it returns both rows
9. Delete all test rows at the end

Run: `npx tsx scripts/test-rls.ts`

Expected output: `✅ Cross-user isolation: PASSED`, `✅ Own data access: PASSED`, `✅ Service role reads all: PASSED`

**Error recovery:**
- User A can see Member B → policy USING clause is wrong. The `auth.uid()` comparison must be exact. Log `auth.uid()` inside the policy using `RAISE LOG` to trace.
- User A's own data is blocked → `supabase_auth_id` not being set on `family_members` row. Check the test script is correctly linking the auth user ID to the `family_members` row.
- Service role can't read all → admin client is being created with the anon key somehow. `requireServerEnv('SUPABASE_SERVICE_ROLE_KEY')` must be used.

---

## ═══ M2 — MEMBER DATA ═══

### PHASE 5 — Authentication

`/lib/auth.ts`:
```ts
import { createClient } from './supabase/server'
import { redirect } from 'next/navigation'

export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getUserRole(): Promise<'family' | 'navigator' | 'admin' | null> {
  const user = await getCurrentUser()
  if (!user) return null
  const supabase = await createClient()
  const { data } = await supabase
    .from('family_members').select('role').eq('supabase_auth_id', user.id).maybeSingle()
  return (data?.role as 'family' | 'navigator' | 'admin') ?? null
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
}
```

**`/app/signup/page.tsx`** — collects: full name, email, password, relationship to senior. On submit:
1. Call `supabase.auth.signUp({ email, password })`
2. On success, insert a `family_members` row with `supabase_auth_id = user.id`, `role = 'family'`
3. If the `family_members` insert fails: call `supabase.auth.admin.deleteUser(user.id)` to rollback. Show clear error. Never leave an orphaned auth user.
4. On complete success: redirect to `/onboarding`

**`/app/login/page.tsx`** — email + password + "Remember me" checkbox. On success: redirect based on role. `family` → `/dashboard`. `navigator` → `/navigator`. `admin` → `/admin`.

**`/app/api/auth/callback/route.ts`** — standard Supabase Auth callback handler. Required for email confirmation flows.

Update **`/middleware.ts`** to add role-based routing on top of authentication:
- Authenticated `family` user hitting `/navigator` or `/admin` → redirect to `/dashboard`
- Authenticated `navigator` user hitting `/admin` → redirect to `/navigator`
- Authenticated user hitting `/login` or `/signup` → redirect to role's home page

**Error recovery:**
- Orphaned auth user after failed insert → the `deleteUser` call must use the admin client with service role. Test this path by temporarily breaking the insert.
- Role-based redirect loop → add logging to middleware. Confirm `getUserRole()` is called correctly and returns a valid role.
- Email confirmation redirect fails → `/app/api/auth/callback/route.ts` must handle the `code` query param using `supabase.auth.exchangeCodeForSession(code)`.

---

### PHASE 6 — Member Onboarding Form (3 Steps — No Plan Selection)

`/app/onboarding/page.tsx` — client component. `plan_tier` defaults to `'basics'` on the server — never ask for payment in v1.

**Step 1 — About the senior:**
Full legal name, preferred name, date of birth (validate: in the past, person ≥ 60 years old — show clear error if fails), phone number (US or E.164 format), preferred language (dropdown: 13 options), home address

**Step 2 — Daily check-in preferences:**
Preferred call time (5 options: Morning 8–10am through Evening 4–6pm), timezone (US timezones), check-in frequency (Daily/Every other day/Weekly), topics they enjoy (multi-select: 12 options), topics to avoid (free text)

**Step 3 — Safety & emergency contacts:**
Emergency contact 1: name, relationship, phone (required). Emergency contact 2: name, relationship, phone (optional). Primary care doctor: name and phone (optional). Current medications (text area). Known health conditions (text area). Lives alone (yes/no radio). Mobility devices (checkboxes: cane, walker, wheelchair, none).

**State management:** Single state object saved to `localStorage` on every field change. Cleared on successful submission. Survives page refresh.

**Submission** (Step 3 "Submit" button): Supabase RPC (or sequential inserts in a transaction-like pattern) that:
1. Inserts into `members` with `plan_tier: 'basics'`, `status: 'active'`
2. Updates `family_members.member_id` to link the logged-in user to the new member
3. If either fails: show clear error, do NOT redirect

On success: redirect to `/onboarding/confirmation` — displays "Welcome to the Thrive@Home family, [preferred name]!"

**Error recovery:**
- Form advances with empty required fields → client-side validation must run on "Next" click. Block advancement. Show error message below each failing field.
- DOB validation wrong → use `differenceInYears(new Date(), dateOfBirth) >= 60` from `date-fns`. Install `date-fns` if not present.
- `localStorage` data lost on refresh → confirm `useEffect` writes to localStorage on every state change, and reads from localStorage on component mount.
- RPC/insert fails silently → check the exact Supabase error response in the Network tab. Common cause: RLS blocking the insert. The family member must be authenticated and their `member_id` must match.

---

### PHASE 7 — App Data Layer & Seed Data

**Every data function contract:**
```ts
// Returns { data, error } — never throws
export async function getMember(id: string): Promise<{ data: Member | null; error: string | null }> {
  if (!id) return { data: null, error: 'ID is required' }
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('members').select('*').eq('id', id).maybeSingle()
    if (error) { console.error('[getMember]', error); return { data: null, error: error.message } }
    if (!data) return { data: null, error: 'Member not found' }
    return { data: data as Member, error: null }
  } catch (e) {
    console.error('[getMember] Unexpected:', e)
    return { data: null, error: e instanceof Error ? e.message : 'Unexpected error' }
  }
}
```

**Files in `/lib/data/`:**
- `members.ts`: `getMember`, `getMemberByFamilyUser`, `createMember`, `updateMember`
- `calls.ts`: `getRecentCalls(memberId, limit, offset?)`, `getCallById`, `createCall`, `updateCall`
- `alerts.ts`: `getActiveAlerts`, `getAllAlerts`, `createAlert`, `acknowledgeAlert`
- `family.ts`: `getFamilyMembers`, `getFamilyMemberByUserId`, `updateFamilyMember`
- `navigator.ts`: `getNavigatorMembers`, `getNavigatorTasks`, `createTask`, `completeTask`, `saveNote`, `getNotes`
- `notifications.ts`: `getUnreadNotifications`, `markNotificationRead`, `markAllRead`
- `tasks.ts`: `getFamilyTasks`, `createFamilyTask`, `completeFamilyTask`
- `messages.ts`: `getFamilyMessages`, `sendFamilyMessage`
- `documents.ts`: `getDocuments`, `createDocumentRecord`

**TypeScript types in `/types/`:** `member.ts`, `call.ts`, `alert.ts`, `notification.ts`

**Seed script** (`/scripts/seed-test-data.ts`) — see Rule 16 for full spec. Must be idempotent. Prints login credentials. Creates Margaret Chen with 14 calls and realistic data.

**Clear script** (`/scripts/clear-test-data.ts`) — removes all seeded rows without error if some don't exist.

**Error recovery:**
- `.single()` throwing on empty result → replace with `.maybeSingle()` throughout. Scan all data files.
- Supabase return type mismatch → cast with `data as Member` after confirming `data !== null`. Never use `any`.
- Seed creates duplicates on second run → check by email at the very top of every insert block before inserting.

---

## ═══ M3 — UI SYSTEM ═══

### PHASE 8 — Primitive UI Components

Build every component before building any page. Pages depend on these.

**Accessibility on every component:**
- Minimum font: `text-lg` (18px) everywhere — inspect every text element
- Minimum touch target: `min-h-[52px] min-w-[52px]` on all interactive elements
- Contrast: ≥ 4.5:1 for all text — check with browser DevTools → Accessibility
- Focus ring: every focusable element shows a visible outline on keyboard focus — never suppress `outline: none` without a replacement
- ARIA labels: every interactive element without visible text needs `aria-label`
- Form labels: visible `<label>` element above every input — never placeholder-only
- Images: `alt` text always — never empty alt on a meaningful image

**Components to build in `/components/ui/`:**

`Button.tsx` — `variant: 'primary' | 'secondary' | 'danger' | 'ghost'`. `loading?: boolean` (spinner + disabled). `disabled?: boolean`. Always `min-h-[52px] text-lg rounded-xl px-6`. Default type `'button'` to prevent accidental form submission.

`Card.tsx` — `variant: 'default' | 'highlight' | 'warning' | 'danger'`. Accepts `className` and `children`.

`Badge.tsx` — small pill. Named variants for every alert severity, plan tier, call status, and booking status.

`Input.tsx` — always a visible `<label>` above the field. Error text below field in red when `error` prop set. Props: `label: string`, `error?: string`, `required?: boolean`, plus all standard input props.

`Select.tsx` — same pattern as Input. `options: { value: string; label: string }[]`.

`Textarea.tsx` — same pattern as Input for multi-line text.

`Skeleton.tsx` — animated grey pulse. Accepts `className` for sizing (e.g. `<Skeleton className="h-8 w-48" />`).

`StatusDot.tsx` — coloured dot. `status: 'no_alerts' | 'informational' | 'concern' | 'urgent' | 'emergency'`. Green for no_alerts, amber for informational/concern, red for urgent/emergency.

`MoodEmoji.tsx` — `score: number | null`. ≥8 → 😊 green, ≥6 → 🙂 green, ≥4 → 😐 amber, ≥2 → 😔 red, <2 → 😞 red, null → — grey. Renders emoji + coloured background pill.

`NotificationBell.tsx` — bell icon with unread count badge. Uses `useNotifications(memberId)` hook. Dropdown shows last 5 notifications each with "Mark read". "Mark all read" at bottom. Bell count updates live via Realtime.

`Toast.tsx` — auto-dismiss in 5 seconds. Severity-coloured. Stacks multiple. `useToast()` hook for programmatic use.

`Modal.tsx` — `role="dialog"` `aria-modal="true"` `aria-labelledby`. Focus-trapped while open. Escape closes. Focus returns to trigger on close. Backdrop click closes. Use `focus-trap-react` (install if needed) — do not build focus trap from scratch.

`Tabs.tsx` — `role="tablist"` `role="tab"` `role="tabpanel"`. Arrow keys switch tabs.

`ProgressBar.tsx` — percentage bar. 0–33% red, 34–66% amber, 67–100% green.

**All components:**
- Named export AND default export
- `className` prop for Tailwind overrides
- Only `brand.*` colour tokens — never hardcoded hex
- JSDoc comment on the component

**Test page:** Create `/app/test-ui/page.tsx` rendering all variants of all 13 components. Delete after APPROVED.

**Error recovery:**
- Focus trap not working → install `focus-trap-react`, use `<FocusTrap>` wrapper — custom focus trap implementations have many edge cases
- NotificationBell count stale after mark-read → update local state immediately (optimistic), then confirm with DB. Never wait for a round-trip before updating the UI count.
- Skeleton causes layout shift → match Skeleton dimensions to final content dimensions exactly. Use the same `className` as the content it replaces.
- `'use client'` directive missing → any component using `useState`, `useEffect`, or browser APIs needs `'use client'` at the top of the file.

---

## ═══ M4 — REALTIME NOTIFICATIONS ═══

### PHASE 9 — Supabase Realtime Notification System

Supabase Realtime requires only Supabase. No additional paid service. It is the sole in-browser notification channel throughout M1–M6.

**Edge Function `push-notification`** (`/supabase/functions/push-notification/index.ts`):
Use exact boilerplate from Rule 14. Accepts: `{ member_id, type, title, body, severity?, call_id?, alert_id? }`. Validates required fields. Inserts into `realtime_notifications` using service role. Returns `{ success: true }` or `{ error: string }` with 500.

**Deploy:** `supabase functions deploy push-notification --project-ref <your-ref>`

**Client hook `useNotifications`** (`/lib/realtime/useNotifications.ts`):
Subscribes to `postgres_changes` INSERT on `realtime_notifications` filtered by `member_id`. Loads existing unread on mount. Returns `{ notifications, unreadCount, markRead, markAllRead }`. Cleanup: `supabase.removeChannel(channel)` in `useEffect` return. Optimistic updates on markRead — update state before DB call. Duplicate prevention: track seen IDs in a `Set`.

**Wire to alert creation:** Every `createAlert` call in `/lib/alerts/` must call `pushRealtimeNotification()` immediately after the alert row is saved.

**Error recovery:**
- Notifications not appearing → (1) check Supabase → Database → Replication → `realtime_notifications` INSERT enabled; (2) check RLS — user must have SELECT on their own rows; (3) check the channel filter `member_id=eq.${memberId}` — the memberId must be correct.
- Duplicate notifications on reconnect → the `Set` of seen IDs prevents rendering duplicates. Confirm it's initialised with IDs from the initial load.
- Channel not cleaned up → `return () => { supabase.removeChannel(channel) }` must be the return value of the `useEffect`, not a nested function.
- Edge Function 404 → function name in deploy command must match the folder name exactly and the function name in `callEdgeFunction(name, ...)`.

---

## ═══ M5 — ALERT ENGINE ═══

### PHASE 10 — Alert Logic & Detection

**Edge Function `create-alert`** (`/supabase/functions/create-alert/index.ts`):
- Input: `{ member_id, alert_type, severity, message }`
- Deduplication with `.maybeSingle()`: if an unacknowledged alert of the same `alert_type` for the same `member_id` exists within last 24 hours, return the existing alert without creating a duplicate
- Emergency write order: write to `emergency_log` BEFORE inserting to `alerts`. If `emergency_log` write fails, log the error but still attempt the alert insert — never block an alert on an audit failure.
- After insertion: call `push-notification` Edge Function with alert details
- Provider calls (SMS, email) via stubs — they log the intended action

**Alert rules:**

| Condition | alert_type | severity |
|-----------|-----------|---------|
| `'crisis'` in alert_flags | crisis | emergency |
| `'fall'` in alert_flags | fall | urgent |
| `'no_eating'` in alert_flags | wellness_drift | urgent |
| `'confusion'` in alert_flags | wellness_drift | concern |
| `pain_score > 7` | wellness_drift | concern |
| `'isolation'` in alert_flags | wellness_drift | informational |
| `medication_taken === false` (single miss) | medication_miss | informational |
| `mood_score <= 3` | mood_drop | concern |

**Wellness drift** (`/lib/alerts/wellnessDrift.ts`): minimum 4 calls in last 7 days. 14-call rolling average. Drop ≥ 2 points → concern. Drop ≥ 3 → urgent. 5 consecutive calls `mood_score <= 4` → urgent. 7-day deduplication.

**Edge Function `check-missed-calls`**: runs hourly via cron. Queries `check_in_calls` where `status = 'scheduled'` and `scheduled_at < now() - interval '90 minutes'`. Updates to `'missed'`. Counts consecutive misses per member. Escalation: 1 → informational; 2 → concern + navigator task; 3 → urgent + stub SMS.

**Error recovery:**
- Duplicate alerts despite deduplication → add `UNIQUE(member_id, alert_type)` partial index `WHERE acknowledged = false` for database-level deduplication as a backstop
- Emergency log fails → wrap emergency_log insert in its own try/catch. Log the failure. Never let emergency_log failure block the alert itself.

---

### PHASE 11 — Crisis Detection

Crisis detection runs FIRST in every call processing pipeline — patient safety requirement.

**`/lib/alerts/crisisDetection.ts`:**
```ts
const CRISIS_PHRASES = [
  "don't want to be here", "want to die", "end it all",
  "hurt myself", "harm myself", "no reason to live",
  "better off without me", "thinking about suicide",
  "thinking about ending", "not worth living",
  "want to end my life", "wish i was dead",
  "wish i weren't here", "can't go on", "don't want to live",
]
```

Detection steps (inside call webhook Edge Function, M8):
1. Extract senior speech turns only (filter out Aria's lines)
2. Scan for CRISIS_PHRASES using case-insensitive substring match
3. If match found: call `aiProvider.disambiguateCrisisContext(phrase, surroundingContext)` — stub returns `false` in v1 (safe for development, no real calls are made)
4. If disambiguation returns `true` OR the API call throws: treat as crisis. Execute all 5 steps:
   - Write to `emergency_log` with triggered phrase + 50-word surrounding context
   - Call `create-alert` Edge Function: `alert_type: 'crisis'`, `severity: 'emergency'`
   - Create `critical` priority `navigator_tasks` row: "⚠️ CRISIS LANGUAGE DETECTED — immediate human follow-up required"
   - Push Realtime notification with `severity: 'emergency'`
   - Call `smsProvider.sendUrgent()` — stub logs intended message in v1
5. Continue processing call normally — never discard transcript data

**Wrap entire crisis detection in its own try/catch.** If crisis detection itself fails: log the error AND create a navigator task to review the transcript manually. Never let crisis detection failure silently pass.

**Error recovery:**
- False positive on "fell asleep watching TV" → "fell asleep" is not in CRISIS_PHRASES list. The list uses exact substrings. Test against all seed transcripts before review.
- Crisis detection crashes pipeline → the wrapping try/catch catches this. The error is logged and a manual review task is created. The call continues processing.

---

## ═══ M6 — FAMILY DASHBOARD ═══

### PHASE 12 — Family Dashboard Shell & Health Timeline

`/app/dashboard/page.tsx` — the most important page.

**Data fetching — parallel, never sequential:**
```ts
const [memberR, callsR, alertsR, notifsR, tasksR] = await Promise.all([
  getMemberByFamilyUser(userId),
  getRecentCalls(memberId, 7),
  getActiveAlerts(memberId),
  getUnreadNotifications(memberId),
  getFamilyTasks(memberId),
])
```
Every section has a `<Skeleton>` loading state. Every section has a per-section error indicator — never a full-page crash.

**Sections:**
1. **Header**: "Good morning, [family first name]. Checking in on [senior preferred name]." + last check-in time or next scheduled + `StatusDot` + `NotificationBell`
2. **Today's Wellness Card**: `MoodEmoji` + score, ⚡ energy + score, 💚 comfort (always "comfort" — never "pain"), medication ✓ green / ✗ amber (single miss = amber, not red), AI summary paragraph. If no call today: "Aria will check in with [preferred name] at [scheduled time]."
3. **Health Timeline**: `<Tabs>` with 7-day / 30-day / 60-day / 90-day views. Each view: Recharts `LineChart` (green dots for 7–10, amber for 4–6, red for 1–3; Y-axis labelled "Great" at top and "Tough day" at bottom — no raw numbers; no gridlines). Below the chart: AI-generated trend summary (stub returns placeholder text in v1).
4. **Alerts Panel**: `<Card variant="danger">` for emergency, `<Card variant="warning">` for urgent/concern, softer card for informational. "No concerns this week 🌟" in a green box as empty state.
5. **Quick Actions**: 4 `<Button variant="secondary">` — "Talk to our navigator" → `/navigator`, "Request a volunteer visit" → `/volunteer`, "View call history" → `/dashboard/calls`, "Update preferences" → `/dashboard/family`.
6. **Family Tasks Preview**: 3 most urgent incomplete tasks, link to full task board.

**Realtime:** `useNotifications(memberId)` active. New alert → alert card + StatusDot update within 2 seconds, no reload.

**Mobile:** all text ≥ 18px, all buttons ≥ 52px, no horizontal scroll at 375px, no colour-only meaning.

**Error recovery:**
- "undefined" in header → `getMemberByFamilyUser()` returned null. Confirm `family_members.member_id` is set and the user is authenticated with the correct session. Add fallback: if null, show "Complete your setup" CTA.
- Loading spinner never resolves → add 8-second timeout per section. After timeout, show per-section error message. Use `Promise.race([fetch, timeout])` pattern.
- Recharts chart blank → confirm data is in `{ x: value, y: value }` format. Log the data array before passing to Recharts. Check that `date-fns` or similar is used for date formatting on X-axis.
- StatusDot doesn't update → confirm the Realtime subscription channel filter is `member_id=eq.${memberId}` with the correct memberId. Check RLS allows the user to SELECT new rows from `realtime_notifications`.

---

### PHASE 13 — Call History Page

`/app/dashboard/calls/page.tsx` — update the "View call history" quick action link to point here. Update the placeholder to this real page.

All completed calls, newest first. Load-more: 20 per page, button appends without reload using `offset`.

**Collapsed row:** date, time, `MoodEmoji` + score, medication ✓/✗, alert badge icons.
**Expanded row (click to expand):** full `ai_summary`, all scores with labels, flags in plain English:
```ts
const FLAG_LABELS: Record<string, string> = {
  fall:      "Aria noted a mention of a fall",
  crisis:    "Aria flagged a concerning statement — escalated to care team",
  no_eating: "Aria noted reduced appetite",
  confusion: "Aria noted some confusion during the call",
  pain_high: "Aria noted significant discomfort",
  isolation: "Aria noted limited social contact",
}
// Fallback: FLAG_LABELS[flag] ?? flag
```

**Empty state:** "No check-in calls on record yet. Aria will call [preferred name] for the first time at [time]."

**Error recovery:**
- Load more appends wrong page → confirm `offset` increments by 20 on each click and uses `.range(offset, offset + 19)` in the Supabase query.
- Flags showing raw values → add the fallback `?? flag` to the `FLAG_LABELS` lookup.

---

### PHASE 14 — Family Coordination Tools

Three pages under `/app/dashboard/family/`:

**Family Task Board** (`/app/dashboard/family/tasks/page.tsx`):
- Shared list for ALL family members linked to this senior
- Create task: title (required), type (appointment/transport/call/errand/medical/other), assign to (dropdown of linked family members by name), due date (optional)
- Sort: incomplete first by due date, then completed
- Mark complete: optimistic update (update state immediately) + DB write
- Realtime: subscribe to `postgres_changes` INSERT on `family_task_items` filtered by `member_id`. New task from any family member appears instantly.
- Must also enable Realtime for `family_task_items` in Supabase → Database → Replication.

**Family Messaging** (`/app/dashboard/family/messages/page.tsx`):
- All messages for this senior's family group, oldest-to-newest (chat style), newest at bottom
- Input + send button at bottom
- Realtime: subscribe to INSERT on `family_messages` filtered by `member_id`
- Must enable Realtime for `family_messages`.
- Navigator sees these messages in their console (M7)

**Document Vault** (`/app/dashboard/documents/page.tsx`):
- Create Supabase Storage bucket `member-documents` (private)
- Storage policy: authenticated user can upload to and download from `[member_id]/` prefix matching their linked member's ID
- Upload: PDF, JPG, PNG, max 10MB. Shows error for unsupported types or oversized files.
- Each document: file name, type, description, upload date, "Download" button (generates 1-hour signed URL at click time — not at page load)
- Advance directive reminder: if `is_advance_directive = true` and `last_reviewed_at` is null or > 3 years ago, show a gentle amber badge "Due for review"

**Family Nudge Edge Function** (`/supabase/functions/family-nudge-check/index.ts`):
- Runs daily (register cron in `vercel.json` or Supabase scheduled functions)
- Queries `family_members.last_login_at` — if > 7 days AND member has unacknowledged concern+ alert
- Calls `aiProvider.generateFamilyNudgeTopic()` — stub returns placeholder in v1
- Pushes `family_nudge` Realtime notification: "It's been a while — [Senior] might love to hear from you. Starter: [topic]"
- Maximum one nudge per family member per 7-day period (check `notification_log`)

**Error recovery:**
- Family task not appearing for other family members → Realtime not enabled for `family_task_items`. Add it in Supabase → Database → Replication.
- Family messages not updating live → same — add `family_messages` to Replication.
- Document upload fails → (1) check bucket name is exactly `member-documents`; (2) check storage policy allows the user's `member_id` prefix; (3) check file size < 10MB. Log the exact Supabase Storage error.
- Signed URL expired → generate the signed URL on click, not on page load. Use `supabase.storage.from('member-documents').createSignedUrl(path, 3600)` inside the click handler.
- Nudge fires more than once per week → check `notification_log` before inserting. If a `family_nudge` row exists for this `family_member_id` within the last 7 days, skip.

---

## SECTION 6 — Accessibility Standards (Every Phase)

These are build requirements, not a review checklist. Apply continuously.

- Body text: `text-lg` (18px) minimum everywhere — no exceptions
- Buttons and touch targets: `min-h-[52px]` minimum — no exceptions
- Colour contrast: ≥ 4.5:1 for all text against its background
- Form labels: visible `<label>` element above every input — never placeholder-only
- Focus ring: every keyboard-focusable element shows a visible ring — never `outline: none` without a replacement
- Error messages: visible, specific, below the failing field — never an alert dialog
- Every page: `export const metadata: Metadata = { title: '[Page Name] | Thrive@Home' }`
- Every `<Image>`: descriptive `alt` text — never empty alt on a meaningful image
- Colour never the sole conveyor of meaning — always accompany colour with a label or icon
- Mobile at 375px: no horizontal scroll on any page

Run `npx axe-cli [URL] --tags wcag2aa` before any milestone gate. Zero violations.

---

## SECTION 7 — What Comes After V1

When all 14 phases (M1–M6) are complete and the final phase is APPROVED, the build continues by appending separate prompt documents.

**Add-On Milestones** (append as `prompt-addons.md`):
- M7 — Navigator Console (Phases 15–16)
- M8 — AI Calls: Retell AI + Anthropic (Phases 17–19)
- M9 — Concierge Line (Phase 20)
- M10 — SMS + Email Notifications (Phases 21–23)
- M11 — Stripe Billing (Phases 24–26)
- M12 — HIPAA + Accessibility Compliance (Phases 27–28)

**Advanced Feature Milestones** (append as `prompt-advanced.md`):
- M13–M18 — Volunteers, Community, Celebrations, Grief, Services Marketplace, Enterprise

**How to add an Add-On:**
1. Start a new session
2. The agent reads `progress.md`, `checklist.md`, and this file
3. Append the new milestone instructions and the agent begins from there
4. All interfaces and stubs from Phase 1 are already in place — adding a real service only requires: (a) the new service implementation in `/lib/services/`, (b) update `providers.ts`. Zero other changes.
