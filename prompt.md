# Thrive@Home — AI Agent Build Prompt (v1.0)

> **Read this entire file at the start of every session before writing a single line of code.**
> This is Version 1 of the build prompt. It covers M1–M6: Foundation through the Family Dashboard.
> M7–M12 (Add-Ons) and M13–M18 (Advanced Features) are separate documents appended later.
> If any instruction here conflicts with something you think is faster or easier, follow this file.

---

## SCOPE OF THIS DOCUMENT

This prompt builds **Phases 1–14** across **Milestones M1–M6**:

| Milestone | Phases | What Gets Built |
|-----------|--------|----------------|
| M1 — Foundation | 1–4 | Next.js scaffold, Vercel deploy, Supabase connection, full DB schema, RLS |
| M2 — Member Data | 5–7 | Auth, 3-step onboarding, typed data layer, seed data |
| M3 — UI System | 8 | Complete reusable component library |
| M4 — Realtime | 9 | Supabase Realtime — primary notification channel |
| M5 — Alert Engine | 10–11 | All alert logic, crisis detection |
| M6 — Family Dashboard | 12–14 | Dashboard, health timeline, family coordination tools |

**What is deliberately excluded from this document:**
- M7 Navigator Console (Add-On — appended later)
- M8 AI Calls — Retell AI, Anthropic (Add-On — appended later)
- M9 Concierge Line (Add-On — appended later)
- M10 SMS/Email Notifications — Twilio, SendGrid (Add-On — appended later)
- M11 Billing — Stripe (Add-On — appended later)
- M12 Compliance — HIPAA, SOC 2 (Add-On — appended later)
- M13–M18 Advanced Features — Volunteers, Community, Celebrations, Grief, Services, Enterprise

**Placeholder navigation is required for all excluded sections** — pages exist with "Coming soon" content so the app feels complete and navigation never 404s. No implementation logic is built for Add-On or Advanced features in this document.

---

## SECTION 1 — Core Rules (Non-Negotiable)

These rules apply to every phase, every file, every line of code. They are not guidelines. Violating any of them is a build error that must be fixed before proceeding.

---

### Rule 1 — Human approval is required before every phase transition

This is the most important rule. No exceptions, ever.

When you believe a phase is complete:

1. Stop writing code immediately
2. Run every test for that phase defined in `tests.md`
3. Present results in this **exact** format — do not deviate from the structure:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ PHASE [N] — [PHASE NAME] — COMPLETE, AWAITING YOUR APPROVAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

What was built:
• [every file created, with full path]
• [every file modified, with what changed]
• [every Supabase table, column, Edge Function, or policy created or altered]
• [every npm package installed]

Tests run:
• [Test ID from tests.md]: PASSED — [one sentence: what was verified]
• [Test ID]: FAILED — [exact failure: what was observed vs what was expected]

What to check right now:
• [specific URL or Supabase dashboard location to verify — be precise]
• [another specific item]

Please verify the items above, then reply:
  APPROVED — I will immediately begin Phase [N+1]
  ISSUE: [describe exactly what you see] — I will fix before asking again
```

4. **Wait.** Do not begin Phase N+1. Do not write preparatory code. Do not ask if you should proceed. Do not say "while we wait, let me get started on…". Wait for the user's explicit reply.

5. If **APPROVED**: update `checklist.md` to mark Phase N as `[x]`, append an entry to `progress.md`, then begin Phase N+1.

6. If **ISSUE**: fix the problem, re-run affected tests, present the same review format again. Do not advance until APPROVED.

7. If the reply is **ambiguous**: ask exactly: "Should I proceed to Phase [N+1], or is there something to fix first?" Do not assume approval.

**No exceptions.** Not for "simple" phases. Not when you are confident. Not for closely related phases. Every phase. Every time.

---

### Rule 2 — Never claim success without proof

A phase that compiles is not complete. A function that exists is not correct. Code that looks right is not tested. The test in `tests.md` is the only acceptable proof of completion.

If a test cannot run because an environment variable is missing, stop and tell the user:
- Which variable is missing
- Where to find its value (exact dashboard location)
- What to do with it (add to `.env.local` and Vercel)

Do not skip tests. Do not say "this should work." Do not work around a missing credential.

---

### Rule 3 — Never assume environment variables are set

Every file that uses an environment variable must validate it at the call site using `/lib/env.ts`:

```ts
// /lib/env.ts
/** Validates that a required environment variable exists. Throws immediately with a clear message if not. */
export function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value || value.trim() === '') {
    throw new Error(
      `\n\n❌ Missing environment variable: ${name}\n` +
      `   Add it to your .env.local file.\n` +
      `   See .env.local.example for where to find this value.\n`
    )
  }
  return value
}

/** Like requireEnv but also guards against browser access. Call this from server-only code. */
export function requireServerEnv(name: string): string {
  if (typeof window !== 'undefined') {
    throw new Error(
      `[Security] "${name}" is server-only but was accessed in the browser. ` +
      `Move this call to a Server Component, API Route, or Server Action.`
    )
  }
  return requireEnv(name)
}
```

**Never:**
- Use `process.env.X!` (non-null assertion)
- Use `process.env.X ?? ''` or `process.env.X ?? 'placeholder'`
- Access any server credential in a Client Component or client-side hook

---

### Rule 4 — Never swallow errors

Every `try/catch` must log the full error object. Every Supabase call must check both `data` and `error`. Every fetch response must check `response.ok` before using the body.

```ts
// WRONG — silent failure, impossible to debug
try { return await doSomething() } catch { return null }

// RIGHT — loud, traceable, tells you exactly where it broke
try {
  const result = await doSomething()
  return result
} catch (e) {
  console.error('[module/function] Failed:', e)
  throw new Error(
    `[module/function] Failed: ${e instanceof Error ? e.message : String(e)}`
  )
}
```

**Supabase pattern — always:**
```ts
const { data, error } = await supabase.from('members').select('*').eq('id', id).maybeSingle()
if (error) {
  console.error('[getMember] Supabase error:', error)
  return { data: null, error: error.message }
}
if (!data) return { data: null, error: 'Not found' }
return { data, error: null }
```

Use `.maybeSingle()` for queries that may return zero rows — never `.single()` (it throws on zero rows, which is a valid state in deduplication and existence checks).

---

### Rule 5 — Never hardcode secrets or configuration

No API key, auth token, webhook secret, phone number, email address, or URL that belongs to a specific environment as a string literal in any `.ts` or `.tsx` file.

Specifically prohibited as string literals:
- Any Supabase key or URL
- Any value that begins with `eyJ`, `sk_`, `pk_`, `SG.`, `AC`, `retell-`, `sk-ant-`
- Any phone number
- Any email address used for routing or configuration
- The app's own production URL (use `requireEnv('NEXT_PUBLIC_APP_URL')`)

If you find yourself typing a string that grants access to something or configures behaviour for a specific environment — stop. Put it in `.env.local`.

---

### Rule 6 — Never let secrets reach GitHub

`.gitignore` must be created before any other file, before the first commit. After creating it, verify:

```bash
echo "TEST=secret" > .env.local && git status
```

`.env.local` **must** appear under "Untracked files" only. If it appears under "Changes to be committed", the `.gitignore` is broken. Fix it before any commit — not after.

Run both checks before every commit:

```bash
# No .env files tracked
git ls-files | grep -E "^\.env"

# No secrets in staged changes
git diff --cached --name-only | xargs grep -l -E \
  "(sk_live|sk_test|pk_live|pk_test|SG\.|AC[a-z0-9]{32}|whsec_|retell-|sk-ant-)" 2>/dev/null
```

Both commands must produce **no output**. If either produces output, stop and fix before committing.

If a secret is accidentally committed: revoke it at the service immediately, then contact GitHub support to purge the history.

---

### Rule 7 — One phase at a time

Read the current phase section in full before writing any code. Build exactly what it describes — nothing more, nothing less. Do not add features "for later." Do not refactor previous phases unless the current phase explicitly requires it. Do not start the next phase until you have APPROVED.

Scope creep is the primary failure mode. The phase boundary is a hard line, not a suggestion.

---

### Rule 8 — When a session ends mid-phase

If a conversation ends before a phase is complete:
1. Append a `STATUS: IN_PROGRESS` entry to `progress.md` listing every file touched and test run
2. In `NEXT SESSION MUST`, describe exactly where to resume — specific file name, specific function, specific line or step
3. Update `checklist.md` to mark the phase as `[~]` (in progress)

At the start of the next session:
1. Read `progress.md` completely
2. Find the `[~]` phase in `checklist.md`
3. Resume from the exact point described in `NEXT SESSION MUST`

**Never** re-do completed steps. **Never** skip to the next phase. Resume exactly.

---

### Rule 9 — Write for a non-technical founder

Every file: one-line comment at the top explaining its purpose in plain English.
Every exported function: a JSDoc comment explaining what it does.
User-facing error messages: readable sentences, never error codes or stack traces.

```ts
// WRONG — developer-facing, useless to a founder
throw new Error('PGRST116: multiple rows returned')

// RIGHT — human-readable, actionable
return { error: "We couldn't find your account. Please try signing in again." }
```

Comments explain the **why** — not the what. If what the code does is obvious from reading it, the comment adds nothing.

---

### Rule 10 — TypeScript strict mode, always

`tsconfig.json` must have `"strict": true` from Phase 1. No `any` types — use `unknown` and narrow with type guards. All exported function parameters and return types must be explicitly typed. Run `npx tsc --noEmit` before every phase review. Zero TypeScript errors is the requirement — not "acceptable" errors.

---

### Rule 11 — No test or seed data in production code paths

Test scripts and seed scripts live in `/scripts/` only. They are never imported by `/app/`, `/lib/`, or `/components/`. All rows inserted by a test script must be deleted at the end of that script. Never leave test data in the database after a test run completes.

---

### Rule 12 — Security on every API route and Edge Function

Every route or Edge Function that reads or modifies data must, in this exact order:
1. Verify authentication — return `401` if no valid session
2. Verify authorisation — return `403` if the authenticated user does not have permission for this specific resource (not just any resource of this type)
3. Validate all inputs — return `400` with a specific message if required fields are missing or malformed
4. Return only the minimum data the caller needs — never more

This order is mandatory. Never skip step 2 because step 1 passed.

---

### Rule 13 — Modular service architecture from Phase 1

Every feature that depends on an external paid service (AI, SMS, email, billing, calls, transport, meals, physical goods) must be built behind a TypeScript interface with a stub implementation. The product is built and fully testable using stubs. Real services are plugged in as Add-On milestones.

**The pattern:**
```ts
// 1. Interface — the contract. Created in Phase 1. Never modified.
// /lib/interfaces/SmsProvider.ts
export interface SmsProvider {
  send(to: string, body: string): Promise<void>
  sendUrgent(to: string, body: string): Promise<void>
}

// 2. Stub — default. Logs what it would do. Never throws. No side effects.
// /lib/stubs/StubSmsProvider.ts
export class StubSmsProvider implements SmsProvider {
  async send(to: string, body: string) {
    console.log(`[StubSMS] Would send to ${to.substring(0, 6)}xxx: "${body.substring(0, 80)}..."`)
  }
  async sendUrgent(to: string, body: string) {
    console.log(`[StubSMS] URGENT — Would send to ${to.substring(0, 6)}xxx: "${body.substring(0, 80)}..."`)
  }
}

// 3. Real implementation — built in the Add-On milestone, not here.
// /lib/services/TwilioSmsProvider.ts (created later — not in v1 scope)
```

`/lib/providers.ts` is the **only** file that selects stub vs real. Application code imports from `providers.ts` only. When a real service is added in an Add-On milestone, only two files change: the new service implementation and `providers.ts`. Nothing else changes.

---

### Rule 14 — Supabase Edge Functions for all server-side logic

All server-side business logic that would go in a Next.js API route must instead be implemented as a **Supabase Edge Function**. This keeps the architecture clean, reduces cold-start latency, and positions the app for future scalability independently of Vercel.

**What goes in Edge Functions:**
- Alert creation and detection logic
- Realtime notification pushes
- Call scheduling triggers
- Webhook handlers (Retell, Stripe, Checkr)
- Cron-triggered jobs
- Any operation requiring the service role key

**What stays in Next.js API routes:**
- Stripe checkout redirect (requires server-side session + redirect)
- Auth callback handlers (Supabase Auth requires these in the Next.js app)
- Any route that needs Next.js-specific middleware

**Edge Function pattern:**
```ts
// supabase/functions/create-alert/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // 1. Auth check
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response('Unauthorized', { status: 401 })

  // 2. Create Supabase client with user's JWT (respects RLS)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )

  // 3. Parse and validate input
  const body = await req.json().catch(() => null)
  if (!body?.member_id || !body?.alert_type) {
    return new Response(JSON.stringify({ error: 'member_id and alert_type are required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    })
  }

  // 4. Business logic
  const { data, error } = await supabase.from('alerts').insert({ ... }).select().single()
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })

  return new Response(JSON.stringify({ data }), {
    status: 200, headers: { 'Content-Type': 'application/json' }
  })
})
```

**Calling an Edge Function from Next.js:**
```ts
// /lib/supabase/functions.ts
export async function callEdgeFunction<T>(
  functionName: string,
  payload: Record<string, unknown>,
  authToken?: string
): Promise<{ data: T | null; error: string | null }> {
  const url = `${requireEnv('NEXT_PUBLIC_SUPABASE_URL')}/functions/v1/${functionName}`
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken ?? requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')}`,
        'apikey': requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
      },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (!res.ok) return { data: null, error: json.error ?? `Function error ${res.status}` }
    return { data: json.data as T, error: null }
  } catch (e) {
    console.error(`[callEdgeFunction/${functionName}] Failed:`, e)
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}
```

**Deploying Edge Functions:**
```bash
supabase functions deploy <function-name> --project-ref <your-project-ref>
```

Local development with Edge Functions:
```bash
supabase start        # starts local Supabase
supabase functions serve   # serves Edge Functions locally at http://localhost:54321/functions/v1/
```

---

### Rule 15 — Row Level Security on every table, always

RLS must be enabled on every table **before any data is inserted**. A table with RLS enabled but no policies denies all access to all users — this is the safe default. Policies are additive. Never disable RLS on a table to "fix" a data access problem — instead, write the correct policy.

**The four RLS personas for Thrive@Home:**

| Persona | Who | Auth mechanism |
|---------|-----|----------------|
| `family` | Adult children / family members | Supabase Auth JWT, role = 'family' |
| `navigator` | Care coordinators | Supabase Auth JWT, role = 'navigator' |
| `admin` | Platform staff | Supabase Auth JWT, role = 'admin' |
| `service_role` | Edge Functions, cron jobs, webhooks | `SUPABASE_SERVICE_ROLE_KEY` — bypasses RLS |

**RLS policy pattern:**
```sql
-- Family members can only read their own senior's data
CREATE POLICY "family_select_own_member"
ON members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.member_id = members.id
      AND fm.supabase_auth_id = auth.uid()
  )
);

-- Navigators can only read members assigned to them
CREATE POLICY "navigator_select_assigned_members"
ON members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM navigator_assignments na
    JOIN care_navigators cn ON cn.id = na.navigator_id
    WHERE na.member_id = members.id
      AND cn.supabase_auth_id = auth.uid()
  )
);
```

**Mandatory cross-account test after every RLS change:** Create two test users, two members, confirm User A cannot read Member B's data (returns empty array, not an error or a row).

**RLS on Edge Functions:** Edge Functions that use `SUPABASE_SERVICE_ROLE_KEY` bypass RLS entirely — they must enforce their own access control via the auth header and explicit permission checks. Never use the service role key in a client-callable Edge Function without first verifying the caller's identity and permission.

---

### Rule 16 — Seed data before every dashboard phase

`/scripts/seed-test-data.ts` must be created in Phase 7 and run before Phase 12 (Family Dashboard). It must be **idempotent** — running it twice must not create duplicate rows. It creates realistic data that makes every dashboard section look populated:

- Test family member (email: `test-family@thriveathome.dev`, password: `TestPassword123!`)
- Test senior: "Margaret Chen", preferred name "Margaret", DOB 1945-06-15, topics_enjoy: ["Gardening", "Books", "Family stories"]
- 14 `check_in_calls` with mood arc 8,8,7,8,7,6,7,6,5,6,5,5,4,5 across last 14 days
- 2 `alerts`: one `informational` (acknowledged), one `concern` (unacknowledged)
- 2 `realtime_notifications`: one read, one unread
- Navigator assignment and 3 navigator tasks

Prints login credentials at the end. Companion `/scripts/clear-test-data.ts` removes all seeded rows.

---

### Rule 17 — Placeholder pages for all Add-On and Advanced features

Every page that will be built in M7–M18 must have a placeholder route created in Phase 1. This prevents 404 errors when navigating from the dashboard and makes the app feel complete from day one.

**Placeholder page pattern:**
```tsx
// /app/navigator/page.tsx (placeholder for M7)
export default function NavigatorPage() {
  return (
    <div className="min-h-screen bg-brand-warm-white flex items-center justify-center">
      <div className="text-center p-8">
        <h1 className="text-2xl font-semibold text-brand-navy mb-2">Navigator Console</h1>
        <p className="text-gray-500">Coming soon — this feature is being built.</p>
      </div>
    </div>
  )
}
```

**Required placeholders (create all in Phase 1):**
- `/app/navigator/page.tsx` — M7
- `/app/admin/page.tsx` — M7
- `/app/dashboard/calls/page.tsx` — M8 (AI Check-In Calls history)
- `/app/dashboard/concierge/page.tsx` — M9
- `/app/dashboard/billing/page.tsx` — M11
- `/app/privacy/page.tsx` — M12
- `/app/volunteer/page.tsx` — M13
- `/app/dashboard/events/page.tsx` — M14
- `/app/dashboard/groups/page.tsx` — M14
- `/app/dashboard/skill-exchange/page.tsx` — M14
- `/app/dashboard/cultural-circles/page.tsx` — M14
- `/app/dashboard/benefits/page.tsx` — M14
- `/app/employers/page.tsx` — M14
- `/app/dashboard/celebrations/page.tsx` — M15
- `/app/dashboard/life-story/page.tsx` — M15
- `/app/dashboard/grief-support/page.tsx` — M16
- `/app/dashboard/services/page.tsx` — M17
- `/app/outcomes/page.tsx` — M18

Do not add any business logic, database calls, or imports to placeholders. Just the page shell. They exist only so the app navigates cleanly.

---

### Rule 18 — Edge cases the agent must handle proactively

These are the most common failure modes. Check for each one before presenting any phase review:

**Supabase:**
- `.single()` used where `.maybeSingle()` is correct — replace all deduplication queries
- RLS policy written but RLS not enabled on the table — always enable first
- Service role key used in a client-callable path — never, use anon key + user JWT
- Supabase Auth user created but `family_members` insert failed — orphaned auth user, must rollback
- Realtime not enabled for `realtime_notifications` table — check Supabase → Database → Replication

**TypeScript:**
- `any` type used anywhere — use `unknown` with a type guard
- Non-null assertion `!` on env var — use `requireEnv()` instead
- Missing return type on exported function — add explicit return type
- `npx tsc --noEmit` has errors — zero errors before any phase review

**Next.js / Vercel:**
- `NEXT_PUBLIC_` prefix on a secret credential — remove the prefix, use server-only access
- Client Component importing a server-only file — move to a Server Component
- Missing `'use client'` directive on a component using hooks — add it
- Vercel deploy fails because env var not set in Vercel dashboard — add it there
- Missing `metadata` export on a page — every page needs a title

**Environment:**
- `.env.local` tracked by git — `.gitignore` broken, fix immediately
- Empty string in env var (`VAR=`) treated as set — `requireEnv` catches this with the `trim()` check
- Credentials pasted into source code instead of `.env.local` — immediately revoke and regenerate

**Edge Functions:**
- Missing `Authorization` header check — every Edge Function must check this first
- CORS not configured — Edge Functions need CORS headers for browser fetch calls
- Edge Function not deployed after changes — always run `supabase functions deploy`
- Local Edge Function port different from production — local is `54321`, prod is in Supabase URL

**Forms:**
- Form advances with empty required fields — validation must block advancement
- DOB accepts future dates — must validate person is ≥ 60 years old
- Phone accepts non-numeric input — validate E.164 or US format
- `localStorage` not cleared after successful form submission — clear it on success

**Mobile:**
- Text smaller than 18px — check every element
- Button height less than 52px — check every interactive element
- Horizontal scroll at 375px — check every page on real device or browser dev tools
- Tap target too small — minimum 52×52px for all interactive elements

---

## SECTION 2 — Secrets Management

### 2.1 — `.gitignore` (first file created, before any commit)

```gitignore
# Environment — NEVER commit
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.env.production
.env*.local

# Dependencies and build
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
# THRIVE@HOME — Environment Variables (v1.0 — M1–M6)
# Copy this file to .env.local and fill in real values.
# .env.local is gitignored and will NEVER be committed to GitHub.

# ── CORE ──────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=
CARE_TEAM_EMAIL=
CRON_SECRET=

# ── SUPABASE (required from Phase 2) ──────────────────────
# supabase.com → your project → Settings → API
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
# ⚠️ Server-only. Bypasses ALL Row Level Security. Never use in client code.
SUPABASE_SERVICE_ROLE_KEY=

# ── ADD-ON SERVICES (M7–M12 — leave blank until those milestones) ──
# Anthropic (M8 — AI calls)
ANTHROPIC_API_KEY=
# Retell AI (M8 — voice agent)
RETELL_API_KEY=
RETELL_AGENT_ID=
RETELL_WEBHOOK_SECRET=
RETELL_CONCIERGE_AGENT_ID=
# Twilio (M8/M10 — calls and SMS)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
TWILIO_CONCIERGE_NUMBER=
ONCALL_NAVIGATOR_PHONE=
# SendGrid (M10 — email)
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=
# Stripe (M11 — billing)
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID_BASICS=
STRIPE_PRICE_ID_CONNECT=
STRIPE_PRICE_ID_COMPLETE=
STRIPE_PRICE_ID_PREMIER=
# Checkr (M13 — volunteer background checks)
CHECKR_API_KEY=
CHECKR_WEBHOOK_SECRET=
# Language Line (M9 — concierge multilingual)
LANGUAGE_LINE_ACCOUNT_NUMBER=
LANGUAGE_LINE_SIP_ENDPOINT=
# Services Marketplace (M17 — add when reaching those phases)
LYFT_HEALTHCARE_API_KEY=
INSTACART_API_KEY=
TELADOC_API_KEY=
ARTIFACT_UPRISING_API_KEY=
ONE800FLOWERS_API_KEY=
```

### 2.3 — Server-only vs browser-safe variables

**Only these three** variables are safe to prefix with `NEXT_PUBLIC_`:
- `NEXT_PUBLIC_SUPABASE_URL` — not a secret, RLS is the security layer
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public by design in Supabase's model
- `NEXT_PUBLIC_APP_URL` — the app's own URL, not a secret

Everything else uses `requireServerEnv()`. Never prefix any credential with `NEXT_PUBLIC_`.

---

## SECTION 3 — Project Architecture

### 3.1 — Folder structure (created in Phase 1, never reorganised)

```
/app
  /api
    /auth              Auth callback handlers (Next.js only — Supabase Auth requires this)
  /dashboard           Family member pages (built in M6)
    /family            Family coordination tools
    /documents         Document vault (placeholder in v1)
    /life-story        Life story (placeholder in v1)
    /grief-support     Grief support (placeholder in v1)
    /services          Services marketplace (placeholder in v1)
    /events            Events (placeholder in v1)
    /groups            Interest groups (placeholder in v1)
    /skill-exchange    Skill exchange (placeholder in v1)
    /cultural-circles  Cultural circles (placeholder in v1)
    /benefits          Benefits finder (placeholder in v1)
    /billing           Billing (placeholder in v1)
    /calls             AI calls history (placeholder in v1)
    /concierge         Concierge (placeholder in v1)
    /celebrations      Celebrations (placeholder in v1)
  /navigator           Navigator console (placeholder in v1)
  /admin               Admin (placeholder in v1)
  /volunteer           Volunteer portal (placeholder in v1)
  /onboarding          3-step member enrollment
  /login
  /signup
  /pricing             Placeholder in v1
  /privacy             Placeholder in v1
  /outcomes            Placeholder in v1
  /employers           Placeholder in v1

/components
  /ui                  All primitive components (Phase 8)
  /dashboard           Dashboard-specific components (Phase 12)
  /onboarding          Onboarding form step components (Phase 6)
  /shared              Shared across sections

/lib
  /supabase
    client.ts          Browser Supabase client
    server.ts          Server Supabase client (SSR)
    admin.ts           Service role client (Edge Functions only)
    functions.ts       callEdgeFunction() helper
  /interfaces          Service interfaces — all 8, defined in Phase 1, never changed
  /stubs               Stub implementations — all 8, defined in Phase 1
  /providers.ts        THE ONE FILE selecting stub vs real
  /data                Typed Supabase query functions (Phase 7)
  /alerts              Alert logic (Phase 10)
  /realtime            Realtime push and subscription helpers (Phase 9)
  /env.ts              requireEnv, requireServerEnv
  /auth.ts             Auth helpers

/supabase
  /functions           Edge Functions (one folder per function)
    /push-notification index.ts
    /create-alert      index.ts
    /check-missed-calls index.ts
  /migrations
    001_initial_schema.sql
    002_audit.sql

/types                 TypeScript types — no implementation code
/scripts               Seed and test scripts — never imported by app
```

### 3.2 — Service interfaces (all 8 defined in Phase 1, never modified after)

```ts
// /lib/interfaces/CallProvider.ts
export interface CallContext {
  preferredName: string
  interests: string[]
  priorCallSummaries: string[]
  preferredLanguage: string
}
export interface CallProvider {
  scheduleCall(memberId: string, phone: string, context: CallContext): Promise<string>
}

// /lib/interfaces/SmsProvider.ts
export interface SmsProvider {
  send(to: string, body: string): Promise<void>
  sendUrgent(to: string, body: string): Promise<void>
}

// /lib/interfaces/EmailProvider.ts
export interface PostCallEmailData {
  seniorName: string
  summary: string
  scores: CallScores
  hasAlerts: boolean
  alertMessage?: string
  dashboardUrl: string
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
export interface CallScores {
  mood_score: number | null
  energy_score: number | null
  pain_score: number | null
  medication_taken: boolean | null
  alert_flags: string[]
}
export interface ConciergeTriage {
  intent: 'service_request' | 'companionship_call' | 'emergency' | 'information' | 'care_team_transfer'
  serviceType?: 'transport' | 'meal' | 'companion' | 'tech_help' | 'home_service'
  urgency: 'low' | 'medium' | 'high' | 'emergency'
  summary: string
}
export interface CarePlan {
  wellnessSummary: string
  topStrengths: string[]
  areasForAttention: string[]
  recommendedActions: string[]
  communityOpportunities: string[]
  familyTalkingPoints: string[]
  nextReviewDate: string | null
}
export interface AiProvider {
  generateCallSummary(transcript: string): Promise<string | null>
  extractCallScores(seniorSpeechOnly: string): Promise<CallScores>
  generateNavigatorBrief(memberId: string, recentSummaries: string[]): Promise<string>
  generateCarePlan(member: unknown, calls: unknown[]): Promise<CarePlan>
  disambiguateCrisisContext(phrase: string, context: string): Promise<boolean>
  generateWeeklyDigest(member: unknown, calls: unknown[]): Promise<string>
  generateMonthlySummary(member: unknown, calls: unknown[]): Promise<string>
  generateCelebrationPersonalisation(member: unknown, celebrationType: string): Promise<string>
  generateConciergeTriage(transcript: string): Promise<ConciergeTriage>
  generateFamilyNudgeTopic(member: unknown, recentCalls: unknown[]): Promise<string>
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
  memberId: string
  pickupAddress: string
  destinationAddress: string
  requestedDate: string
  requestedTime: string
  tripType: string
  isRecurring: boolean
}
export interface TransportProvider {
  bookRide(request: TransportBookingRequest): Promise<{ bookingId: string; estimatedArrival?: string }>
  cancelRide(bookingId: string): Promise<void>
  getRideStatus(bookingId: string): Promise<string>
}

// /lib/interfaces/MealProvider.ts
export interface MealOrder {
  memberId: string
  providerName: string
  items: string[]
  deliveryDate: string
  deliveryAddress: string
  dietaryRestrictions: string[]
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

### 3.3 — providers.ts (stub by default — real services added in Add-On milestones)

```ts
// /lib/providers.ts
// The single file that selects stub vs real for every external service.
// APPLICATION CODE IMPORTS FROM HERE ONLY — never from /lib/stubs/ or /lib/services/ directly.
// To add a real service: (1) create the real implementation, (2) update only this file.

import { StubCallProvider }      from './stubs/StubCallProvider'
import { StubSmsProvider }       from './stubs/StubSmsProvider'
import { StubEmailProvider }     from './stubs/StubEmailProvider'
import { StubAiProvider }        from './stubs/StubAiProvider'
import { StubBillingProvider }   from './stubs/StubBillingProvider'
import { StubTransportProvider } from './stubs/StubTransportProvider'
import { StubMealProvider }      from './stubs/StubMealProvider'
import { StubGoodsProvider }     from './stubs/StubGoodsProvider'

import type { CallProvider }      from './interfaces/CallProvider'
import type { SmsProvider }       from './interfaces/SmsProvider'
import type { EmailProvider }     from './interfaces/EmailProvider'
import type { AiProvider }        from './interfaces/AiProvider'
import type { BillingProvider }   from './interfaces/BillingProvider'
import type { TransportProvider } from './interfaces/TransportProvider'
import type { MealProvider }      from './interfaces/MealProvider'
import type { GoodsProvider }     from './interfaces/GoodsProvider'

// All resolve functions return stubs in v1.
// Real implementations are added in Add-On milestones (M7–M12) by updating this file.
function resolveAiProvider(): AiProvider {
  if (process.env.ANTHROPIC_API_KEY) {
    // Real implementation added in M8
    const { AnthropicAiProvider } = require('./services/AnthropicAiProvider')
    return new AnthropicAiProvider()
  }
  return new StubAiProvider()
}
function resolveCallProvider(): CallProvider {
  if (process.env.RETELL_API_KEY && process.env.TWILIO_ACCOUNT_SID) {
    // Real implementation added in M8
    const { RetellCallProvider } = require('./services/RetellCallProvider')
    return new RetellCallProvider()
  }
  return new StubCallProvider()
}
function resolveSmsProvider(): SmsProvider {
  if (process.env.TWILIO_ACCOUNT_SID) {
    // Real implementation added in M10
    const { TwilioSmsProvider } = require('./services/TwilioSmsProvider')
    return new TwilioSmsProvider()
  }
  return new StubSmsProvider()
}
function resolveEmailProvider(): EmailProvider {
  if (process.env.SENDGRID_API_KEY) {
    // Real implementation added in M10
    const { SendGridEmailProvider } = require('./services/SendGridEmailProvider')
    return new SendGridEmailProvider()
  }
  return new StubEmailProvider()
}
function resolveBillingProvider(): BillingProvider {
  if (process.env.STRIPE_SECRET_KEY) {
    // Real implementation added in M11
    const { StripeBillingProvider } = require('./services/StripeBillingProvider')
    return new StripeBillingProvider()
  }
  return new StubBillingProvider()
}
function resolveTransportProvider(): TransportProvider {
  if (process.env.LYFT_HEALTHCARE_API_KEY) {
    // Real implementation added in M17
    const { LyftTransportProvider } = require('./services/LyftTransportProvider')
    return new LyftTransportProvider()
  }
  return new StubTransportProvider()
}
function resolveMealProvider(): MealProvider {
  if (process.env.INSTACART_API_KEY) {
    // Real implementation added in M17
    const { InstacartMealProvider } = require('./services/InstacartMealProvider')
    return new InstacartMealProvider()
  }
  return new StubMealProvider()
}
function resolveGoodsProvider(): GoodsProvider {
  if (process.env.ONE800FLOWERS_API_KEY || process.env.ARTIFACT_UPRISING_API_KEY) {
    // Real implementation added in M16
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

### 3.4 — Stub behaviour standard

Every stub method must: log exactly what it would have done (include `[STUB]` in log output), return a sensible typed placeholder, never throw, never cause side effects. The log format must make it immediately obvious that a stub is running.

```ts
// Example: /lib/stubs/StubSmsProvider.ts
import type { SmsProvider } from '../interfaces/SmsProvider'

/** Stub SMS provider — logs what would be sent. Active by default until Twilio is configured (M10). */
export class StubSmsProvider implements SmsProvider {
  async send(to: string, body: string): Promise<void> {
    console.log(`[STUB][SMS] Would send to ${to.substring(0, 6)}xxx: "${body.substring(0, 100)}..."`)
  }
  async sendUrgent(to: string, body: string): Promise<void> {
    console.log(`[STUB][SMS][URGENT] Would send to ${to.substring(0, 6)}xxx: "${body.substring(0, 100)}..."`)
  }
}
```

### 3.5 — Supabase Realtime (always real — no stub needed)

Supabase Realtime works from Phase 9 onward using the anon key. It requires no additional paid service. It is the primary notification channel for all of M1–M6 and stays the primary in-browser channel throughout the entire build.

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

/** Push a notification to a member's connected dashboard clients via Supabase Realtime. */
export async function pushRealtimeNotification(
  notification: RealtimeNotification
): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin.from('realtime_notifications').insert({
    type:      notification.type,
    member_id: notification.memberId,
    title:     notification.title,
    body:      notification.body,
    severity:  notification.severity ?? 'info',
    call_id:   notification.callId  ?? null,
    alert_id:  notification.alertId ?? null,
  })
  if (error) {
    // Log but do not throw — a failed notification must not crash the calling pipeline
    console.error('[realtime/pushNotification] Insert failed:', error)
  }
}
```

---

## SECTION 4 — Database Schema

All SQL lives in `/supabase/migrations/`. Write the full SQL file before running anything in Supabase. Run it in the Supabase SQL Editor. The migration file is the single source of truth — never modify the database through the UI without also updating the migration file.

### 4.1 — Schema standards

- All PKs: `id uuid DEFAULT gen_random_uuid() PRIMARY KEY`
- All timestamps: `created_at timestamptz DEFAULT now() NOT NULL`
- All foreign keys: `ON DELETE CASCADE` unless a comment explains why not
- All PostgreSQL enums: created as `TYPE` before any table that uses them
- Arrays: `text[]` — never `jsonb` arrays
- Structured data: `jsonb` — never `json`
- Phone numbers: `text` — never a numeric type
- Enum values: `lowercase_with_underscores`
- RLS: enabled on every table in the same migration that creates it

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

### 4.3 — Core tables (M1–M6)

```sql
-- Members (seniors on the platform)
CREATE TABLE members (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at            timestamptz DEFAULT now() NOT NULL,
  full_name             text NOT NULL,
  preferred_name        text NOT NULL,
  date_of_birth         date NOT NULL,
  phone_number          text NOT NULL,
  preferred_language    text NOT NULL DEFAULT 'english',
  preferred_call_time   text,
  timezone              text NOT NULL DEFAULT 'America/New_York',
  check_in_frequency    check_in_frequency NOT NULL DEFAULT 'daily',
  topics_enjoy          text[] DEFAULT '{}',
  topics_avoid          text,
  lives_alone           boolean,
  mobility_devices      text[] DEFAULT '{}',
  health_conditions     text,
  medications           text,
  plan_tier             plan_tier NOT NULL DEFAULT 'basics',
  status                member_status NOT NULL DEFAULT 'active',
  address               text,
  emergency_contact_1_name  text,
  emergency_contact_1_phone text,
  emergency_contact_1_rel   text,
  emergency_contact_2_name  text,
  emergency_contact_2_phone text,
  emergency_contact_2_rel   text,
  doctor_name           text,
  doctor_phone          text
);
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Family members (adults who manage a senior's account)
CREATE TABLE family_members (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        timestamptz DEFAULT now() NOT NULL,
  member_id         uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  supabase_auth_id  uuid NOT NULL UNIQUE,
  full_name         text NOT NULL,
  email             text NOT NULL,
  phone             text,
  relationship      text,
  notification_prefs jsonb NOT NULL DEFAULT '{"sms": true, "email": true, "realtime": true}',
  alert_level       text NOT NULL DEFAULT 'all',
  role              user_role NOT NULL DEFAULT 'family',
  last_login_at     timestamptz
);
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

-- Check-in calls (every AI call, check-in or concierge)
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
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       timestamptz DEFAULT now() NOT NULL,
  member_id        uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  alert_type       alert_type NOT NULL,
  severity         alert_severity NOT NULL,
  message          text NOT NULL,
  acknowledged     boolean NOT NULL DEFAULT false,
  acknowledged_by  uuid REFERENCES family_members(id) ON DELETE SET NULL,
  acknowledged_at  timestamptz
);
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Care navigators
CREATE TABLE care_navigators (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      timestamptz DEFAULT now() NOT NULL,
  supabase_auth_id uuid UNIQUE,
  full_name       text NOT NULL,
  email           text NOT NULL,
  phone           text,
  certifications  text[] DEFAULT '{}',
  caseload_limit  int NOT NULL DEFAULT 150,
  is_active       boolean NOT NULL DEFAULT true
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

-- Subscriptions (populated when billing is added in M11)
CREATE TABLE subscriptions (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at            timestamptz DEFAULT now() NOT NULL,
  member_id             uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  stripe_customer_id    text,
  stripe_subscription_id text,
  plan_tier             plan_tier NOT NULL DEFAULT 'basics',
  status                text NOT NULL DEFAULT 'active',
  current_period_start  timestamptz,
  current_period_end    timestamptz,
  monthly_amount_cents  int
);
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Realtime notifications (primary in-browser notification channel)
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

-- Emergency log (immutable record of every crisis detection event)
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
  days_of_week text[] NOT NULL DEFAULT '{"monday","tuesday","wednesday","thursday","friday","saturday","sunday"}',
  label        text NOT NULL DEFAULT 'Medications',
  is_active    boolean NOT NULL DEFAULT true
);
ALTER TABLE medication_schedules ENABLE ROW LEVEL SECURITY;

-- Family tasks (coordination board — M6)
CREATE TABLE family_task_items (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       timestamptz DEFAULT now() NOT NULL,
  member_id        uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  created_by       uuid NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  assigned_to      uuid REFERENCES family_members(id) ON DELETE SET NULL,
  title            text NOT NULL,
  task_type        text NOT NULL DEFAULT 'other',
  due_date         date,
  completed        boolean NOT NULL DEFAULT false,
  completed_at     timestamptz
);
ALTER TABLE family_task_items ENABLE ROW LEVEL SECURITY;

-- Family messages (secure in-platform messaging — M6)
CREATE TABLE family_messages (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   timestamptz DEFAULT now() NOT NULL,
  member_id    uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  sender_id    uuid NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  body         text NOT NULL
);
ALTER TABLE family_messages ENABLE ROW LEVEL SECURITY;

-- Document vault (M6 foundation — storage in M14)
CREATE TABLE document_vault_items (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      timestamptz DEFAULT now() NOT NULL,
  member_id       uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  uploaded_by     uuid NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  file_name       text NOT NULL,
  file_type       text NOT NULL,
  storage_path    text NOT NULL,
  description     text,
  is_advance_directive boolean NOT NULL DEFAULT false,
  last_reviewed_at     timestamptz
);
ALTER TABLE document_vault_items ENABLE ROW LEVEL SECURITY;

-- Audit log
CREATE TABLE audit_log (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at    timestamptz DEFAULT now() NOT NULL,
  user_id       uuid,
  action        text NOT NULL,
  resource_type text NOT NULL,
  resource_id   text
);
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
```

### 4.4 — Indexes

```sql
CREATE INDEX idx_calls_member_scheduled    ON check_in_calls(member_id, scheduled_at DESC);
CREATE INDEX idx_calls_member_status       ON check_in_calls(member_id, status);
CREATE INDEX idx_alerts_member_unacked     ON alerts(member_id, acknowledged) WHERE acknowledged = false;
CREATE INDEX idx_alerts_member_severity    ON alerts(member_id, severity);
CREATE INDEX idx_family_auth_id            ON family_members(supabase_auth_id);
CREATE INDEX idx_family_member_id          ON family_members(member_id);
CREATE INDEX idx_nav_assignments_nav       ON navigator_assignments(navigator_id);
CREATE INDEX idx_nav_assignments_member    ON navigator_assignments(member_id);
CREATE INDEX idx_tasks_navigator_pending   ON navigator_tasks(navigator_id, completed) WHERE completed = false;
CREATE INDEX idx_realtime_notifs_member    ON realtime_notifications(member_id, read, created_at DESC);
CREATE INDEX idx_notif_log_member          ON notification_log(member_id, created_at DESC);
CREATE INDEX idx_family_tasks_member       ON family_task_items(member_id, completed);
CREATE INDEX idx_family_messages_member    ON family_messages(member_id, created_at DESC);
CREATE INDEX idx_med_schedules_member      ON medication_schedules(member_id) WHERE is_active = true;
```

### 4.5 — RLS policies

```sql
-- ── MEMBERS ──────────────────────────────────────────────────────────
CREATE POLICY "family_select_own_member" ON members FOR SELECT
USING (EXISTS (SELECT 1 FROM family_members fm WHERE fm.member_id = members.id AND fm.supabase_auth_id = auth.uid()));

CREATE POLICY "navigator_select_assigned_members" ON members FOR SELECT
USING (EXISTS (SELECT 1 FROM navigator_assignments na JOIN care_navigators cn ON cn.id = na.navigator_id WHERE na.member_id = members.id AND cn.supabase_auth_id = auth.uid()));

CREATE POLICY "family_update_own_member" ON members FOR UPDATE
USING (EXISTS (SELECT 1 FROM family_members fm WHERE fm.member_id = members.id AND fm.supabase_auth_id = auth.uid()));

-- ── FAMILY_MEMBERS ────────────────────────────────────────────────────
CREATE POLICY "select_own_family_record" ON family_members FOR SELECT
USING (supabase_auth_id = auth.uid());

CREATE POLICY "select_family_for_navigator" ON family_members FOR SELECT
USING (EXISTS (SELECT 1 FROM navigator_assignments na JOIN care_navigators cn ON cn.id = na.navigator_id WHERE na.member_id = family_members.member_id AND cn.supabase_auth_id = auth.uid()));

CREATE POLICY "update_own_family_record" ON family_members FOR UPDATE
USING (supabase_auth_id = auth.uid());

-- ── CHECK_IN_CALLS ────────────────────────────────────────────────────
CREATE POLICY "family_select_own_calls" ON check_in_calls FOR SELECT
USING (EXISTS (SELECT 1 FROM family_members fm WHERE fm.member_id = check_in_calls.member_id AND fm.supabase_auth_id = auth.uid()));

CREATE POLICY "navigator_select_assigned_calls" ON check_in_calls FOR SELECT
USING (EXISTS (SELECT 1 FROM navigator_assignments na JOIN care_navigators cn ON cn.id = na.navigator_id WHERE na.member_id = check_in_calls.member_id AND cn.supabase_auth_id = auth.uid()));

-- ── ALERTS ───────────────────────────────────────────────────────────
CREATE POLICY "family_select_own_alerts" ON alerts FOR SELECT
USING (EXISTS (SELECT 1 FROM family_members fm WHERE fm.member_id = alerts.member_id AND fm.supabase_auth_id = auth.uid()));

CREATE POLICY "family_update_own_alerts" ON alerts FOR UPDATE
USING (EXISTS (SELECT 1 FROM family_members fm WHERE fm.member_id = alerts.member_id AND fm.supabase_auth_id = auth.uid()));

CREATE POLICY "navigator_select_assigned_alerts" ON alerts FOR SELECT
USING (EXISTS (SELECT 1 FROM navigator_assignments na JOIN care_navigators cn ON cn.id = na.navigator_id WHERE na.member_id = alerts.member_id AND cn.supabase_auth_id = auth.uid()));

CREATE POLICY "navigator_update_assigned_alerts" ON alerts FOR UPDATE
USING (EXISTS (SELECT 1 FROM navigator_assignments na JOIN care_navigators cn ON cn.id = na.navigator_id WHERE na.member_id = alerts.member_id AND cn.supabase_auth_id = auth.uid()));

-- ── REALTIME_NOTIFICATIONS ────────────────────────────────────────────
CREATE POLICY "family_select_own_notifications" ON realtime_notifications FOR SELECT
USING (EXISTS (SELECT 1 FROM family_members fm WHERE fm.member_id = realtime_notifications.member_id AND fm.supabase_auth_id = auth.uid()));

CREATE POLICY "family_update_own_notifications" ON realtime_notifications FOR UPDATE
USING (EXISTS (SELECT 1 FROM family_members fm WHERE fm.member_id = realtime_notifications.member_id AND fm.supabase_auth_id = auth.uid()));

-- ── SUBSCRIPTIONS ─────────────────────────────────────────────────────
CREATE POLICY "family_select_own_subscription" ON subscriptions FOR SELECT
USING (EXISTS (SELECT 1 FROM family_members fm WHERE fm.member_id = subscriptions.member_id AND fm.supabase_auth_id = auth.uid()));

-- ── FAMILY_TASK_ITEMS ─────────────────────────────────────────────────
CREATE POLICY "family_select_own_tasks" ON family_task_items FOR SELECT
USING (EXISTS (SELECT 1 FROM family_members fm WHERE fm.member_id = family_task_items.member_id AND fm.supabase_auth_id = auth.uid()));

CREATE POLICY "family_insert_own_tasks" ON family_task_items FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM family_members fm WHERE fm.member_id = family_task_items.member_id AND fm.supabase_auth_id = auth.uid()));

CREATE POLICY "family_update_own_tasks" ON family_task_items FOR UPDATE
USING (EXISTS (SELECT 1 FROM family_members fm WHERE fm.member_id = family_task_items.member_id AND fm.supabase_auth_id = auth.uid()));

-- ── FAMILY_MESSAGES ───────────────────────────────────────────────────
CREATE POLICY "family_select_own_messages" ON family_messages FOR SELECT
USING (EXISTS (SELECT 1 FROM family_members fm WHERE fm.member_id = family_messages.member_id AND fm.supabase_auth_id = auth.uid()));

CREATE POLICY "family_insert_own_messages" ON family_messages FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM family_members fm WHERE fm.member_id = family_messages.member_id AND fm.supabase_auth_id = auth.uid()));

-- ── DOCUMENT_VAULT_ITEMS ──────────────────────────────────────────────
CREATE POLICY "family_select_own_documents" ON document_vault_items FOR SELECT
USING (EXISTS (SELECT 1 FROM family_members fm WHERE fm.member_id = document_vault_items.member_id AND fm.supabase_auth_id = auth.uid()));

CREATE POLICY "family_insert_own_documents" ON document_vault_items FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM family_members fm WHERE fm.member_id = document_vault_items.member_id AND fm.supabase_auth_id = auth.uid()));

-- ── NAVIGATOR-SPECIFIC TABLES ─────────────────────────────────────────
CREATE POLICY "navigator_select_own_assignments" ON navigator_assignments FOR SELECT
USING (EXISTS (SELECT 1 FROM care_navigators cn WHERE cn.id = navigator_assignments.navigator_id AND cn.supabase_auth_id = auth.uid()));

CREATE POLICY "navigator_select_assigned_tasks" ON navigator_tasks FOR SELECT
USING (EXISTS (SELECT 1 FROM care_navigators cn WHERE cn.id = navigator_tasks.navigator_id AND cn.supabase_auth_id = auth.uid()));

CREATE POLICY "navigator_update_assigned_tasks" ON navigator_tasks FOR UPDATE
USING (EXISTS (SELECT 1 FROM care_navigators cn WHERE cn.id = navigator_tasks.navigator_id AND cn.supabase_auth_id = auth.uid()));

CREATE POLICY "navigator_select_own_notes" ON navigator_notes FOR SELECT
USING (EXISTS (SELECT 1 FROM care_navigators cn WHERE cn.id = navigator_notes.navigator_id AND cn.supabase_auth_id = auth.uid()));

CREATE POLICY "navigator_insert_own_notes" ON navigator_notes FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM care_navigators cn WHERE cn.id = navigator_notes.navigator_id AND cn.supabase_auth_id = auth.uid()));

-- ── AUDIT LOG ─────────────────────────────────────────────────────────
-- Audit log is written only by Edge Functions using service role — no user-level policies needed
-- The service role bypasses RLS entirely
```

### 4.6 — Audit triggers

```sql
-- /supabase/migrations/002_audit.sql
CREATE TABLE IF NOT EXISTS audit_log (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at    timestamptz DEFAULT now() NOT NULL,
  user_id       uuid,
  action        text NOT NULL,
  resource_type text NOT NULL,
  resource_id   text
);

CREATE OR REPLACE FUNCTION log_data_access()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO audit_log (user_id, action, resource_type, resource_id)
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
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

**Prerequisites:** GitHub repo `thrive-at-home` (Private) exists. Vercel connected to GitHub. Supabase project created and all 3 credentials saved. No other accounts needed.

**Steps in exact order:**

**Step 1 — Create project:**
```bash
npx create-next-app@latest thrive-at-home \
  --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
cd thrive-at-home
node --version  # STOP if below v18 — tell user to install Node 18 LTS from nodejs.org
```

**Step 2 — Create `.gitignore` BEFORE any other file or commit:**
Use exact content from Section 2.1. Then verify immediately:
```bash
echo "TEST=secret" > .env.local && git status
```
`.env.local` must appear under **"Untracked files"** — never under "Changes to be committed". If it appears as tracked: stop, fix `.gitignore`, re-verify before continuing.

**Step 3 — Create `.env.local.example`:**
Use exact content from Section 2.2. This file IS committed — it has no values, only variable names and comments.

**Step 4 — Create `.env.local`:**
```bash
cp .env.local.example .env.local
```
Fill in only: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL=http://localhost:3000`, `CARE_TEAM_EMAIL`, `CRON_SECRET`. All Add-On service variables stay blank.

**Step 5 — Tailwind brand config:**
```ts
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      brand: {
        navy: '#1B3A6B',
        'navy-light': '#2A5298',
        teal: '#2A9D8F',
        'teal-light': '#3DBFB0',
        'warm-white': '#FAFAF8',
      },
    },
    fontSize: {
      base: ['18px', { lineHeight: '1.6' }],
    },
    minHeight: {
      touch: '52px',
    },
    minWidth: {
      touch: '52px',
    },
  },
}
```

**Step 6 — Create full folder structure:**
```bash
mkdir -p \
  app/api/auth \
  app/dashboard/{family,documents,life-story,grief-support,services,events,groups,skill-exchange,cultural-circles,benefits,billing,calls,concierge,celebrations} \
  app/{navigator,admin,volunteer,onboarding,login,signup,pricing,privacy,outcomes,employers} \
  components/{ui,dashboard,onboarding,shared} \
  lib/{supabase,interfaces,stubs,services,data,alerts,realtime} \
  supabase/{functions,migrations} \
  types scripts

# Prevent empty dirs from being gitignored
find components lib types scripts supabase/functions -type d -exec touch {}/.gitkeep \;
```

**Step 7 — Create `/lib/env.ts`:**
Exact content from Rule 3 in Section 1.

**Step 8 — Create all 8 service interfaces in `/lib/interfaces/`:**
Exact content from Section 3.2. TypeScript interface definitions only — no implementation code.

**Step 9 — Create all 8 stub implementations in `/lib/stubs/`:**
Pattern from Section 3.4. Every stub method logs what it would do and returns a sensible placeholder. Never throws.

**Step 10 — Create `/lib/providers.ts`:**
Exact content from Section 3.3.

**Step 11 — Create all placeholder pages (Rule 17):**
Every route listed in Rule 17 gets a minimal placeholder page. Pattern from Rule 17. No business logic, no database calls, no imports other than the page itself.

**Step 12 — Create `/app/page.tsx` landing page:**
Brand colours only. "Thrive@Home" heading, tagline, navigation links to `/login` and `/signup`. No business logic.

**Step 13 — First commit and Vercel deploy:**
```bash
# Pre-commit check
git ls-files | grep -E "^\.env"                    # must produce no output
git diff --cached --name-only | xargs grep -l -E \
  "(sk_live|sk_test|SG\.|AC[a-z0-9]{32}|retell-|sk-ant-)" 2>/dev/null  # must produce no output

git add .
git commit -m "Phase 1: scaffold, interfaces, stubs, providers, placeholder pages"
git push
```
Import repo in Vercel. Deploy with defaults. Once Vercel URL is known, update `NEXT_PUBLIC_APP_URL` in both `.env.local` and Vercel Environment Variables.

**Error recovery:**
- `node --version` < 18: tell user to install Node 18 LTS from nodejs.org. Stop until resolved.
- `.env.local` appears tracked: `.gitignore` is broken. Show user what the `.gitignore` should look like and how to verify it. Fix before any commit.
- Vercel build fails: read the full Vercel build log, identify the TypeScript or import error, fix it, push again. Do not guess — read the log.
- `npx tsc --noEmit` has errors: fix all errors before the phase review. Zero errors is the requirement.

---

### PHASE 2 — Supabase Connection

**Prerequisites:** Supabase credentials in `.env.local` and Vercel.

Install Supabase client libraries:
```bash
npm install @supabase/supabase-js @supabase/ssr
```

Create three Supabase client files:

**`/lib/supabase/client.ts`** — browser client, anon key only:
```ts
/** Browser-side Supabase client. Safe to use in Client Components. Uses anon key + user JWT. */
import { createBrowserClient } from '@supabase/ssr'
import { requireEnv } from '../env'

export function createClient() {
  return createBrowserClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  )
}
```

**`/lib/supabase/server.ts`** — server client, reads session from cookies:
```ts
/** Server-side Supabase client. Use in Server Components, API Routes, and Server Actions. */
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
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from Server Component — cookie setting is a no-op, handled by middleware
          }
        },
      },
    }
  )
}
```

**`/lib/supabase/admin.ts`** — service role, bypasses RLS, server-only:
```ts
/** Admin Supabase client. Bypasses ALL Row Level Security. NEVER use in client-side code.
 *  Use only in Edge Functions, server-side webhooks, and cron jobs. */
import { createClient } from '@supabase/supabase-js'
import { requireServerEnv } from '../env'

let adminClient: ReturnType<typeof createClient> | null = null

export function createAdminClient() {
  if (!adminClient) {
    adminClient = createClient(
      requireServerEnv('NEXT_PUBLIC_SUPABASE_URL'),
      requireServerEnv('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
  }
  return adminClient
}
```

**`/lib/supabase/functions.ts`** — helper for calling Edge Functions:
Use exact content from Rule 14 in Section 1.

**`/middleware.ts`** — session refresh on every request:
```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  const protectedPaths = ['/dashboard', '/navigator', '/admin']
  const isProtected = protectedPaths.some(p => path.startsWith(p))

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

**Connection test:** Create `connection_test` table in Supabase, insert a row manually, create `/app/test/page.tsx` that fetches and displays it. After test passes: delete the test page and the test table. Run `npx tsc --noEmit`.

**Error recovery:**
- "Invalid URL": `NEXT_PUBLIC_SUPABASE_URL` is wrong — copy fresh from Supabase → Settings → API
- 401 from Supabase: anon key is wrong — copy fresh from Supabase → Settings → API
- Nothing displayed on test page: verify the row was inserted manually in Supabase Table Editor. Check RLS is NOT yet enabled on the test table (it should not be — this is just a connection test).
- `createAdminClient` used in a Client Component: move the call to a Server Component, API route, or Edge Function immediately

---

### PHASE 3 — Database Schema

Write all SQL in the migration files first. Then paste into Supabase SQL Editor. Then verify in the Table Editor.

**Step 1** — Write `/supabase/migrations/001_initial_schema.sql`:
Use exact content from Section 4.2 (enums), Section 4.3 (tables), Section 4.4 (indexes), Section 4.5 (RLS policies).

**Step 2** — Write `/supabase/migrations/002_audit.sql`:
Use exact content from Section 4.6.

**Step 3** — Run in Supabase SQL Editor:
Paste `001_initial_schema.sql` first, run it. Then paste `002_audit.sql`, run it. Check for errors after each.

**Step 4** — Enable Supabase Realtime for `realtime_notifications`:
Supabase Dashboard → Database → Replication → Tables → enable `realtime_notifications` for INSERT events.

**Error recovery:**
- `ERROR: type "xyz_type" does not exist`: the enum is referenced before it's created — reorder SQL so all `CREATE TYPE` statements appear before all `CREATE TABLE` statements
- `ERROR: relation "xyz" does not exist` in an FK: the referenced table is created after the table that references it — reorder tables
- `ERROR: relation "xyz" already exists`: table already created from a previous run — add `DROP TABLE IF EXISTS xyz CASCADE;` at the top of the migration, or use `CREATE TABLE IF NOT EXISTS`
- RLS enabled but data access failing in tests: check that the correct policy was created for the correct operation (SELECT vs INSERT vs UPDATE vs DELETE)
- Realtime not appearing: confirm Supabase → Database → Replication → the table is listed with INSERT checked — not just publication enabled at the project level

---

### PHASE 4 — Row Level Security Verification

RLS was enabled and policies were written in Phase 3. This phase verifies they work correctly before building any UI that depends on them.

**Step 1** — Create two test Supabase Auth users:
In Supabase Dashboard → Authentication → Users → "Invite user" (or use the signup page after Phase 5). Create `user-a@test.com` and `user-b@test.com`. Note both user IDs.

**Step 2** — Create two `family_members` rows and two `members` rows:
Use the admin (service role) client in a test script `/scripts/test-rls.ts`. Link User A to Member A, User B to Member B.

**Step 3** — Test cross-user isolation:
```ts
// Sign in as User A, try to read Member B's data
const { data, error } = await supabase
  .from('members')
  .select('*')
  .eq('id', MEMBER_B_ID)

console.assert(data?.length === 0 || data === null, 'User A should NOT see Member B — got:', data)

// User A reads their own data
const { data: ownData } = await supabase
  .from('members')
  .select('*')
  .eq('id', MEMBER_A_ID)

console.assert(ownData?.length === 1, 'User A SHOULD see their own member — got:', ownData)
```

**Step 4** — Test admin bypass:
```ts
const { data: allData } = await adminSupabase.from('members').select('*')
console.assert(allData && allData.length >= 2, 'Admin should see ALL members — got:', allData?.length)
```

**Step 5** — Test realtime_notifications isolation:
Same pattern — User A should not see User B's notifications.

**Step 6** — Clean up:
Delete all test data. Delete both test auth users.

**Error recovery:**
- User A sees Member B's data: the RLS policy USING clause is wrong — re-check the `family_members` join condition. The most common error is using `member_id` when `supabase_auth_id` should be compared to `auth.uid()`
- User A can't see their own data: `supabase_auth_id` on the `family_members` row doesn't match the auth UID — check that the insert correctly sets this column

---

## ═══ M2 — MEMBER DATA ═══

### PHASE 5 — Authentication

**Signup page** (`/app/signup/page.tsx`):
- Fields: full name, email, password, relationship to senior (dropdown: Spouse, Adult child, Sibling, Parent, Other)
- On submit: call `supabase.auth.signUp({ email, password })`, then insert `family_members` row with the returned `user.id` as `supabase_auth_id`
- **Atomicity:** if the `family_members` insert fails, call `supabase.auth.admin.deleteUser(user.id)` to rollback. Show user a clear error message. Never leave an orphaned Auth user.
- On success: redirect to `/onboarding`

**Login page** (`/app/login/page.tsx`):
- Fields: email, password, remember me checkbox
- On submit: `supabase.auth.signInWithPassword({ email, password })`
- On success: read user's role from `family_members.role`. Redirect: `family` → `/dashboard`, `navigator` → `/navigator`, `admin` → `/admin`
- Error: "Invalid email or password. Please try again." — never expose which field is wrong

**Logout** (`/app/api/auth/signout/route.ts`):
- `await supabase.auth.signOut()`
- Redirect to `/login`

**Auth callback** (`/app/api/auth/callback/route.ts`):
- Handles Supabase Auth OAuth and magic link callbacks
- Exchanges code for session: `supabase.auth.exchangeCodeForSession(code)`
- Redirects to `/dashboard`

**`/lib/auth.ts`** helper functions:
```ts
/** Returns the currently authenticated user, or null if not logged in. */
export async function getCurrentUser() { ... }

/** Returns the role of the current user ('family' | 'navigator' | 'admin'), or null. */
export async function getUserRole(): Promise<'family' | 'navigator' | 'admin' | null> { ... }

/** Redirects to /login if no authenticated user. Call at the top of protected Server Components. */
export async function requireAuth() { ... }
```

**Update middleware** to role-based redirects:
- Unauthenticated user → any `/dashboard/*`, `/navigator/*`, `/admin/*` → redirect `/login`
- `family` role → `/navigator/*` or `/admin/*` → redirect `/dashboard`
- `navigator` role → `/admin/*` → redirect `/navigator`
- Authenticated user → `/login` or `/signup` → redirect to their role's home

**Error recovery:**
- Orphaned Auth user (family_members insert failed): the rollback `deleteUser` call must be awaited and its error also handled — if it fails too, log both errors so the orphan can be found and deleted manually
- Infinite redirect loop: add `console.log('[middleware] path:', path, 'user:', user?.email, 'role:', role)` to trace the loop. Common cause: role not being read correctly from the database
- 401 on auth callback: Supabase PKCE flow requires `code` in query params — confirm the redirect URL in Supabase Auth settings matches the callback route exactly

---

### PHASE 6 — Member Onboarding Form (3 Steps — No Plan Selection)

**`/app/onboarding/page.tsx`** — 3-step form. `plan_tier` defaults to `'basics'` server-side. Plan selection is added in M11 (Billing Add-On).

**State management:** single object stored in `localStorage`, updated on every field change, cleared on successful submission.

**Validation — client-side before advancing, server-side before insert:**
- Step 1: all required fields present; phone matches `/^\+?1?\s*\(?[0-9]{3}\)?[\s.\-]?[0-9]{3}[\s.\-]?[0-9]{4}$/` or E.164; DOB is in the past and person is at minimum 55 years old (platform serves seniors but not exclusively 65+)
- Step 2: at least one call time selected; timezone selected; frequency selected
- Step 3: emergency contact 1 name and phone required; all other fields optional

**Step 1 — About the senior:**
- Full legal name (required)
- Preferred name (required — what they like to be called)
- Date of birth (required — date picker)
- Phone number (required — US or E.164 format)
- Preferred language (dropdown: English, Spanish, Mandarin, Cantonese, Vietnamese, Korean, Tagalog, Hindi, Arabic, Portuguese, Haitian Creole, Russian, Polish, Other)
- Home address: street, city, state, zip (all required)

**Step 2 — Call preferences:**
- Preferred call time (dropdown: Morning 8–10am, Mid-morning 10am–12pm, Afternoon 12–2pm, Late afternoon 2–4pm, Evening 4–6pm)
- Timezone (dropdown: US timezones only — America/New_York, America/Chicago, America/Denver, America/Los_Angeles, America/Phoenix, America/Anchorage, Pacific/Honolulu)
- Check-in frequency (radio: Daily, Every other day, Weekly)
- Topics they enjoy (multi-select checkboxes: Family stories, Current events, Music, Gardening, Cooking, Faith/spirituality, Sports, History, Books, Crafts, Travel memories, Health and wellness)
- Topics to avoid (free text, optional)

**Step 3 — Safety and emergency contacts:**
- Emergency contact 1: name (required), relationship (required), phone (required)
- Emergency contact 2: name, relationship, phone (all optional)
- Primary care doctor: name, phone (both optional)
- Current medications (textarea, optional — plain list)
- Known health conditions (textarea, optional)
- Does the senior live alone? (Yes / No radio)
- Mobility devices (checkboxes: Cane, Walker, Wheelchair, None)

**Submission:**
1. Client-side final validation
2. Call Supabase RPC `onboard_member` that atomically:
   - Inserts `members` row with `plan_tier = 'basics'`
   - Updates the logged-in `family_members.member_id` to link them
3. Clear `localStorage`
4. Redirect to `/onboarding/confirmation`

**Confirmation page** (`/app/onboarding/confirmation/page.tsx`):
- "Welcome to the Thrive@Home family, [preferred name]!"
- A short warm message explaining what happens next (Aria will call tomorrow)
- "Go to your dashboard" button → `/dashboard`

**Error recovery:**
- "undefined" on confirmation page: the RPC returned before the redirect completed — ensure `await` on the RPC call and confirm the preferred name is passed in the redirect state or re-fetched on the confirmation page
- Form data lost on refresh: `localStorage` write is inside a `useEffect` with wrong dependency array — ensure it writes on every field change, not just on mount
- DOB validation passes for wrong ages: re-check the age calculation — use `differenceInYears` from a date utility, not string comparison
- RPC fails halfway: the RPC must use a database transaction — if either insert/update fails, both roll back. Check the RPC definition includes `BEGIN`/`COMMIT` or uses Supabase's `transaction` API.

---

### PHASE 7 — App Data Layer & Seed Data

**Function contract — every function must follow this pattern:**
```ts
export async function getMember(id: string): Promise<{ data: Member | null; error: string | null }> {
  if (!id || !id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    return { data: null, error: 'Invalid member ID format' }
  }
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('members').select('*').eq('id', id).maybeSingle()
    if (error) { console.error('[getMember] Supabase error:', error); return { data: null, error: error.message } }
    if (!data)  return { data: null, error: 'Member not found' }
    return { data: data as Member, error: null }
  } catch (e) {
    console.error('[getMember] Unexpected error:', e)
    return { data: null, error: e instanceof Error ? e.message : 'Unexpected error' }
  }
}
```

**Files to create in `/lib/data/`:**
- `members.ts`: `getMember`, `getMemberByFamilyUser`, `createMember`, `updateMember`
- `calls.ts`: `getRecentCalls(memberId, limit, offset?)`, `getCallById`, `createCall`, `updateCall`
- `alerts.ts`: `getActiveAlerts`, `getAllAlerts`, `createAlert`, `acknowledgeAlert`
- `family.ts`: `getFamilyMembers`, `getFamilyMemberByUserId`, `updateFamilyMember`
- `navigator.ts`: `getNavigatorMembers`, `getNavigatorTasks`, `createTask`, `completeTask`, `saveNote`, `getNotes`
- `notifications.ts`: `getUnreadNotifications`, `markNotificationRead`, `markAllRead`
- `tasks.ts`: `getFamilyTasks`, `createFamilyTask`, `completeFamilyTask`
- `messages.ts`: `getFamilyMessages`, `sendFamilyMessage`
- `documents.ts`: `getDocuments`, `createDocumentRecord`

**TypeScript types in `/types/`:**
`member.ts`, `call.ts`, `alert.ts`, `notification.ts`, `navigator.ts`

**Seed script** (`/scripts/seed-test-data.ts`) — see Rule 16 for full specification. Must be idempotent. Must print login credentials.

**Clear script** (`/scripts/clear-test-data.ts`) — removes all rows created by seed. Must run without errors even if some rows don't exist.

**Error recovery:**
- `.single()` throwing on empty result: replace with `.maybeSingle()` throughout — this is the most common data layer bug
- TypeScript errors on Supabase return types: use explicit casting `data as Member` after checking `data !== null`
- Seed script creates duplicates on second run: check by email BEFORE inserting, not after. The idempotency check must happen at the top of every insert block.

---

## ═══ M3 — UI SYSTEM ═══

### PHASE 8 — Primitive UI Components

Build every component before any page. Every page in M4–M6 depends on these.

**Accessibility requirements applied to every component:**
- Minimum font size: `text-lg` (18px) on all body text — never smaller
- Minimum touch target: `min-h-[52px] min-w-[52px]` on all interactive elements
- Colour contrast: ≥ 4.5:1 for all text against its background
- Visible focus ring: every focusable element must show a visible outline on keyboard focus
- ARIA labels: every interactive element that doesn't have visible text must have `aria-label`
- All form fields: visible label above the field — never use placeholder as the only label
- All images: `alt` text required — never empty alt on a meaningful image

**Components to build in `/components/ui/`:**

`Button.tsx` — variants: `primary` (navy fill, white text), `secondary` (teal outline, teal text), `danger` (red fill, white text), `ghost` (transparent, navy text). Props: `loading?: boolean` (shows spinner, disables click), `disabled?: boolean`, `className?: string`, `type?: 'button' | 'submit' | 'reset'`. Always `min-h-[52px]`, `text-lg`, `rounded-xl`, `px-6`.

`Card.tsx` — variants: `default` (white, subtle shadow), `highlight` (teal left border), `warning` (amber left border), `danger` (red left border). Props: `className?: string`, `children`.

`Badge.tsx` — small pill. Variants for alert severities (`informational`→grey, `concern`→amber, `urgent`→orange, `emergency`→red), plan tiers, member status, booking status.

`Input.tsx` — always has a visible `<label>` element above the field (not as placeholder). Shows error message below field in red when `error` prop is set. Props: `label: string`, `error?: string`, `required?: boolean`, plus all standard input props.

`Select.tsx` — same styling as Input. `label: string`, `error?: string`, `options: { value: string; label: string }[]`.

`Textarea.tsx` — same as Input but for multi-line text.

`Skeleton.tsx` — animated grey pulse for loading states. Accepts `className` for sizing. Example: `<Skeleton className="h-8 w-48" />`.

`StatusDot.tsx` — coloured circle. `status: 'no_alerts' | 'informational' | 'concern' | 'urgent' | 'emergency'`. Green for no_alerts, amber for informational/concern, red for urgent/emergency.

`MoodEmoji.tsx` — `score: number | null`. Returns: ≥8→😊 (green), ≥6→🙂 (green), ≥4→😐 (amber), ≥2→😔 (red), <2→😞 (red), null→— (grey). Displays emoji + coloured background pill.

`NotificationBell.tsx` — bell icon with unread count badge. Connected to `useNotifications(memberId)` hook. Clicking opens a dropdown showing last 5 notifications. Each notification has a "Mark read" button. "Mark all read" button at bottom. Uses Supabase Realtime for live count updates.

`Toast.tsx` — auto-dismiss (5 seconds), severity-coloured (info→blue, concern→amber, urgent→orange, emergency→red). Stacks multiple toasts. `useToast()` hook for programmatic use.

`Modal.tsx` — accessible dialog. `role="dialog"`, `aria-modal="true"`, `aria-labelledby`. Focus-trapped while open. Escape key closes. Focus returns to trigger element on close. Backdrop click closes.

`Tabs.tsx` — accessible tab panel. `role="tablist"`, `role="tab"`, `role="tabpanel"`. Keyboard navigation: arrow keys switch tabs.

`ProgressBar.tsx` — shows percentage complete. Colour changes: 0–33%→red, 34–66%→amber, 67–100%→green.

**All components:**
- Export as named export AND default export
- Accept `className` prop for additional Tailwind overrides
- Use only `brand.*` colour tokens — never hardcoded hex values
- Have a JSDoc comment explaining purpose

**Error recovery:**
- Focus trap in Modal not working: use a focus trap library like `focus-trap-react` rather than building manually — this is notoriously tricky to get right
- NotificationBell showing stale count after marking read: the `useNotifications` hook must update local state immediately on mark-read, not wait for a round-trip
- Skeleton causing layout shift: give Skeleton the same dimensions as the content it replaces

---

## ═══ M4 — REALTIME NOTIFICATIONS ═══

### PHASE 9 — Supabase Realtime Notification System

Supabase Realtime is the primary notification channel for the entire M1–M6 build. It requires only Supabase (already set up). It delivers instant in-browser notifications without any paid external service.

**Edge Function: `push-notification`** (`/supabase/functions/push-notification/index.ts`):
```ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // Use service role to bypass RLS for server-to-client push
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { member_id, type, title, body, severity, call_id, alert_id } = await req.json()

    if (!member_id || !type || !title || !body) {
      return new Response(JSON.stringify({ error: 'member_id, type, title, body required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { error } = await admin.from('realtime_notifications').insert({
      member_id, type, title, body,
      severity: severity ?? 'info',
      call_id:  call_id  ?? null,
      alert_id: alert_id ?? null,
    })

    if (error) throw error

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (e) {
    console.error('[push-notification] Error:', e)
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
```

Deploy: `supabase functions deploy push-notification --project-ref <ref>`

**Client hook: `useNotifications`** (`/lib/realtime/useNotifications.ts`):
```ts
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '../supabase/client'
import { getUnreadNotifications, markNotificationRead, markAllRead } from '../data/notifications'

export function useNotifications(memberId: string | null) {
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([])
  const supabase = createClient()

  useEffect(() => {
    if (!memberId) return

    // Load existing unread on mount
    getUnreadNotifications(memberId).then(({ data }) => {
      if (data) setNotifications(data)
    })

    // Subscribe to new inserts
    const channel = supabase
      .channel(`notifications:${memberId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'realtime_notifications',
          filter: `member_id=eq.${memberId}`,
        },
        (payload) => {
          setNotifications(prev => [payload.new as RealtimeNotification, ...prev])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [memberId])

  const handleMarkRead = useCallback(async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))  // Optimistic update
    await markNotificationRead(id)
  }, [])

  const handleMarkAllRead = useCallback(async () => {
    setNotifications([])  // Optimistic update
    if (memberId) await markAllRead(memberId)
  }, [memberId])

  return {
    notifications,
    unreadCount: notifications.length,
    markRead: handleMarkRead,
    markAllRead: handleMarkAllRead,
  }
}
```

**Wire into alert creation:** Every function in `/lib/alerts/` that creates an alert must call `pushRealtimeNotification()` immediately after the alert is saved.

**Error recovery:**
- Notifications not appearing in browser: check Supabase → Database → Replication → confirm `realtime_notifications` INSERT is enabled. Then check RLS — the user must have SELECT permission on their own rows for Realtime to broadcast to them.
- Duplicate notifications on reconnect: add a `Set` of seen notification IDs in the hook state and skip duplicates
- Channel subscription leaking: confirm the cleanup function `supabase.removeChannel(channel)` is returned from the `useEffect`
- Edge Function returning 404: confirm it was deployed with `supabase functions deploy push-notification` and that the function name matches exactly

---

## ═══ M5 — ALERT ENGINE ═══

### PHASE 10 — Alert Logic & Detection

All alert logic runs as Supabase Edge Functions. No alert business logic in Next.js API routes.

**Edge Function: `create-alert`** (`/supabase/functions/create-alert/index.ts`):
- Auth: accepts service role calls from other Edge Functions, or user JWT for manual navigator acknowledgement
- Input: `{ member_id, alert_type, severity, message }`
- Deduplication: use `.maybeSingle()` — if an unacknowledged alert of the same `alert_type` for the same `member_id` exists within the last 24 hours, skip insertion and return the existing alert
- Emergency: write to `emergency_log` BEFORE inserting the alert row — if the alert insert fails, the emergency log still exists for audit
- After insertion: call the `push-notification` Edge Function with alert details
- All providers (SMS, email) called via stubs — they log the intended action

**Alert rules** (applied by the `create-alert` function):

| Condition | alert_type | severity |
|-----------|-----------|---------|
| `'crisis'` in `alert_flags` | `crisis` | `emergency` |
| `'fall'` in `alert_flags` | `fall` | `urgent` |
| `'no_eating'` in `alert_flags` | `wellness_drift` | `urgent` |
| `'confusion'` in `alert_flags` | `wellness_drift` | `concern` |
| `pain_score > 7` | `wellness_drift` | `concern` |
| `'isolation'` in `alert_flags` | `wellness_drift` | `informational` |
| `medication_taken === false` (single miss) | `medication_miss` | `informational` |
| `mood_score <= 3` | `mood_drop` | `concern` |

**Wellness drift detection** (`/lib/alerts/wellnessDrift.ts` — called from Edge Function context):
- Requires minimum 4 calls in last 7 days before calculating
- 14-call rolling average comparison: last 7 vs prior 7
- Drop of ≥ 2 points → `concern`
- Drop of ≥ 3 points → `urgent`
- 5 consecutive calls with `mood_score <= 4` → `urgent`
- 7-day deduplication on drift alerts

**Missed call detection Edge Function** (`/supabase/functions/check-missed-calls/index.ts`):
- Triggered by cron (Supabase scheduled functions or Vercel Cron calling the Edge Function)
- Queries `check_in_calls` where `status = 'scheduled'` and `scheduled_at < now() - interval '90 minutes'`
- Updates status to `'missed'`
- Counts consecutive misses for each member over last 3 days
- Escalation: 1 miss → `informational`; 2 → `concern` + navigator task; 3 → `urgent` + stub SMS to family

**Error recovery:**
- Duplicate alerts created despite deduplication: `.maybeSingle()` races with concurrent requests — add a `UNIQUE` constraint on `(member_id, alert_type)` WHERE `acknowledged = false` for more reliable deduplication
- Emergency log not written before alert: the write order is enforced by awaiting the `emergency_log` insert before proceeding to the alert insert. If the emergency insert errors, log it but still attempt the alert insert — never block the alert on an audit log failure.

---

### PHASE 11 — Crisis Detection

Crisis detection must run FIRST in every call processing pipeline — before score extraction, before summary generation, before anything else. This is a patient safety requirement.

**Crisis phrases list** (`/lib/alerts/crisisDetection.ts`):
```ts
const CRISIS_PHRASES = [
  "don't want to be here",
  "want to die",
  "end it all",
  "hurt myself",
  "harm myself",
  "no reason to live",
  "better off without me",
  "thinking about suicide",
  "thinking about ending",
  "not worth living",
  "want to end my life",
  "wish i was dead",
  "wish i weren't here",
  "can't go on",
  "don't want to live",
]
```

**Detection pipeline** (inside call webhook Edge Function):
1. Extract only the senior's speech turns from the transcript (filter out Aria's lines)
2. Scan for CRISIS_PHRASES using case-insensitive matching
3. If a phrase is found: call `aiProvider.disambiguateCrisisContext(phrase, surroundingContext)` — this uses the stub in M1–M6 which returns `false` (safe default for development where no real calls are made)
4. **If disambiguation returns `true` or the API call fails**: treat as crisis — execute all 5 escalation steps:
   - Write to `emergency_log` with the triggered phrase and 50-word surrounding context
   - Call `create-alert` Edge Function with `alert_type: 'crisis'`, `severity: 'emergency'`
   - Create `critical` priority `navigator_tasks` row: "⚠️ CRISIS LANGUAGE DETECTED — immediate human follow-up required"
   - Push Realtime notification with `severity: 'emergency'`
   - Call `smsProvider.sendUrgent()` — stub logs the intended message in M1–M6
5. Continue processing the call normally — never discard transcript data due to crisis detection

**Fail-safe rule:** If disambiguation returns `false` but the phrase is on the CRISIS_PHRASES list, the crisis is still treated as genuine if confidence is below a threshold. When in doubt, escalate. A false positive (unnecessary escalation) is always preferable to a false negative.

**Grief crisis extension:** The same crisis detection logic applies to grief support request free-text fields. Scan submitted text before saving.

**Error recovery:**
- Crisis detection crashing the pipeline: wrap the entire crisis detection block in its own `try/catch`. Log the error. If crisis detection itself fails, treat the call as potentially containing a crisis (fail-safe) and create a navigator task to review manually.
- False positive on "I fell asleep watching TV": the phrase list uses exact substring matching — "fell asleep" is not in the list. "I fell yesterday" would not match either. Only exact crisis phrases match.
- "I don't want to be here at the beach" disambiguation: in M1–M6 the stub returns `false` (safe for development). In M8 when Anthropic is connected, the real disambiguation runs and context distinguishes this as non-crisis.

---

## ═══ M6 — FAMILY DASHBOARD ═══

### PHASE 12 — Family Dashboard Shell & Health Timeline

`/app/dashboard/page.tsx` — the most important page in the product.

**Data fetching — parallel, never sequential:**
```ts
const [memberResult, callsResult, alertsResult, notifsResult, tasksResult] = await Promise.all([
  getMemberByFamilyUser(userId),
  getRecentCalls(memberId, 14),
  getActiveAlerts(memberId),
  getUnreadNotifications(memberId),
  getFamilyTasks(memberId),
])
```

**If `memberResult.error`:** show a friendly error card with a "Try again" button. Never show a blank page or raw error.

**Loading state:** every section has a `<Skeleton>` placeholder of the same dimensions as the loaded content. Never show a blank white area while loading.

**Dashboard sections:**

**Header:**
- "Good [morning/afternoon/evening], [family member first name]"
- "Checking in on **[senior preferred name]**"
- Last check-in time: "Last check-in: Today at 9:15am ✓" or "Next check-in: Today at 2:00pm"
- `<StatusDot status={...} />` — driven by highest severity active alert
- `<NotificationBell memberId={memberId} />`

**Today's Wellness Card** (most prominent section):
- `<MoodEmoji score={call.mood_score} />` with score
- ⚡ Energy: score/10 or "—" if not discussed
- 💚 Comfort: score/10 — always labelled "Comfort level" — NEVER "Pain level"
- Medication: large ✓ green / ✗ amber (single miss = amber, not red — red is only for 3+ consecutive misses)
- AI summary paragraph — `call.ai_summary` — in a styled quote block, `text-lg`
- If no call today: "Aria will check in with [Name] at [scheduled time] today 📞"
- If no call scheduled: "No check-in scheduled — contact your care navigator"

**Health Timeline** (tab selector):
- Tabs: "7 Days", "30 Days", "60 Days", "90 Days"
- Each tab: Recharts `LineChart` with coloured dots (green for 7–10, amber for 4–6, red for 1–3), Y-axis labelled "Great" at top / "Tough day" at bottom, no raw numbers on Y-axis, no gridlines
- Below chart: one-paragraph AI trend summary (generated by `aiProvider.generateWeeklyDigest()` — stub returns placeholder text in M1–M6)
- Key stat cards: average mood, medication adherence %, call completion rate

**Alerts Panel:**
- `emergency` severity: red card, bold text, "Contact your care team now" CTA button
- `urgent`: amber card with suggested action
- `concern` / `informational`: soft blue/grey card
- No alerts: light green box "No concerns this week 🌟"
- Acknowledge button on each card → calls `acknowledgeAlert()` → removes card immediately (optimistic update)

**Quick Actions** — 4 large buttons:
- "Talk to our navigator" → `/navigator` (placeholder)
- "Request a volunteer visit" → `/volunteer` (placeholder)
- "View full call history" → `/dashboard/calls` (placeholder)
- "Update preferences" → `/dashboard/family`

**Family Tasks Preview** — 3 most urgent open tasks, link to full task board.

**Realtime integration:**
- `useNotifications(memberId)` hook active on this page
- New alert → alert card appears in Alerts Panel within 2 seconds, StatusDot updates — no page refresh
- New call summary → Wellness Card updates within 30 seconds — no page refresh

**Accessibility:**
- All text ≥ 18px
- All buttons ≥ 52px height
- No horizontal scroll at 375px width
- All sections have headings
- Color alone never conveys meaning — always accompany colour with a label or icon

**Error recovery:**
- "undefined" in header: `getMemberByFamilyUser()` returned null — check that the `family_members` row has `member_id` set and that the user is authenticated with the correct session
- Loading spinner never resolves: one of the parallel fetches is hanging. Add an 8-second timeout after which show partial data with a per-section error indicator
- Chart renders blank: Recharts requires data in `{ x: value, y: value }` format — confirm the transformation from call records to chart data is correct
- StatusDot doesn't update after alert: the Realtime subscription must be re-subscribing after the alert is created — verify the channel filter is correct and RLS allows the user to see the new row

---

### PHASE 13 — Call History Page

`/app/dashboard/history/page.tsx` — available from the dashboard "View full call history" button (which is currently a placeholder — update it to point here).

**Display:**
- All completed calls, newest first
- Load-more pattern: 20 per page, "Load more" button appends without page reload
- Each row (collapsed): date, time of day, `<MoodEmoji>`, medication ✓/✗, alert badge icons
- Each row (expanded on click): full `ai_summary` paragraph, all scores, alert flags in plain English

**Plain English flag mapping:**
```ts
const FLAG_LABELS: Record<string, string> = {
  fall: "Aria noted a mention of a fall",
  crisis: "Aria flagged a concerning statement — escalated to care team",
  no_eating: "Aria noted reduced appetite",
  confusion: "Aria noted some confusion during the call",
  pain_high: "Aria noted significant discomfort",
  isolation: "Aria noted limited social contact",
}
```

**Empty state:** "No check-in calls on record yet. Aria will call [preferred name] for the first time at [scheduled time]."

**Error recovery:**
- Load more button not working: confirm the `offset` parameter increments correctly on each click and that the data function uses `.range(offset, offset + 19)`
- Flags showing raw values: the `FLAG_LABELS` map must have an entry for every possible flag value — add a fallback: `FLAG_LABELS[flag] ?? flag`

---

### PHASE 14 — Family Coordination Tools

Three interconnected tools, all on dedicated pages under `/app/dashboard/family/`.

**Family Task Board** (`/app/dashboard/family/tasks/page.tsx`):
- Shared list for ALL family members linked to this senior
- Create task: title (required), task type (appointment/transport/call/errand/medical/other), assign to a family member (dropdown of linked members), due date (optional)
- Task list sorted: incomplete first (by due date), then completed
- Mark complete: optimistic update + database write
- Realtime: new task created by one family member appears for all others instantly — subscribe to `postgres_changes` INSERT on `family_task_items` filtered by `member_id`

**Family Messaging** (`/app/dashboard/family/messages/page.tsx`):
- Secure in-platform messaging between all linked family members
- Not SMS — stored in `family_messages` table
- Messages displayed newest at bottom (chat style)
- Input field + send button at bottom
- Realtime: new message appears instantly via Supabase Realtime subscription
- Navigator can be looped in (navigator sees messages for assigned members in their console — M7)

**Document Vault** (`/app/dashboard/documents/page.tsx`):
- Upload and retrieve sensitive documents: advance directives, insurance cards, medical records
- Files stored in Supabase Storage bucket `member-documents` (private bucket — access via signed URLs)
- `document_vault_items` table tracks metadata
- Upload: accept PDF, JPG, PNG up to 10MB
- Each document shows: file name, type, description, upload date, "Download" button (generates signed URL)
- Advance directive reminder: if `is_advance_directive = true` and `last_reviewed_at` is null or > 3 years ago, show a gentle reminder badge

**Family Nudge system** (cron-triggered Edge Function `family-nudge-check`):
- Runs daily
- Checks `family_members.last_login_at` — if > 7 days ago AND member has an unacknowledged `concern` or higher alert
- Calls `aiProvider.generateFamilyNudgeTopic(member, recentCalls)` — stub returns a placeholder topic
- Pushes `family_nudge` Realtime notification: "It's been a while — [Senior name] might love to hear from you. Conversation starter: [AI topic]"
- Maximum one nudge per family member per 7-day period

**Document vault storage setup:**
1. Supabase Dashboard → Storage → New bucket: `member-documents`, private
2. Storage policy: authenticated users can upload to `member_id/` prefix matching their linked member
3. Storage policy: authenticated users can download from `member_id/` prefix matching their linked member
4. Signed URLs expire in 1 hour

**Error recovery:**
- Realtime messages not appearing: confirm Supabase Realtime is enabled for `family_messages` INSERT events (add to replication in Supabase Dashboard → Database → Replication)
- Document upload fails: check bucket name matches exactly, check storage policies allow the authenticated user's `member_id` prefix, check file size is under 10MB
- Signed URL expired before download starts: generate the signed URL at the moment of the download click, not when the page loads
- Nudge cron not running: confirm the cron is registered in `vercel.json` with the correct CRON_SECRET, or if using Supabase scheduled functions, confirm the schedule is set

---

## SECTION 6 — What Comes After V1

This document covers Phases 1–14 (M1–M6). When V1 is complete and APPROVED, the following are appended as separate documents:

**Add-On Milestones (append as `prompt-addons.md`):**
- M7 — Navigator Console (Phases 15–16): caseload management, AI briefing, weekly/monthly digests
- M8 — AI Calls (Phases 17–19): Anthropic, Retell AI agent, call scheduler, webhook
- M9 — Concierge Line (Phase 20): 24/7 inbound triage, Language Line
- M10 — Outbound Notifications (Phases 21–23): Twilio SMS, SendGrid email, medication reminders
- M11 — Billing (Phases 24–26): Stripe subscriptions, plan selection, billing management
- M12 — Compliance (Phases 27–28): HIPAA baseline, accessibility audit, SOC 2 pathway

**Advanced Feature Milestones (append as `prompt-advanced.md`):**
- M13–M18 as defined in `ThriveAtHome_Build_Phases.md`

**To add an Add-On milestone when ready:**
1. Append the milestone instructions to the build prompt in a new session
2. The agent reads all existing files (`progress.md`, `checklist.md`, this file, the new content)
3. All interfaces and stubs from Phase 1 are already in place — adding a real service only requires: (a) implementing the real provider class, (b) updating `providers.ts`
4. No existing code changes — the modular architecture ensures this

---

## SECTION 7 — Accessibility Standards (Apply to Every Phase)

These are build requirements enforced at every phase, not a review checklist:

- Body text: `text-lg` (18px) minimum — inspect every element
- Buttons and touch targets: `min-h-[52px]` minimum — never smaller
- Colour contrast: ≥ 4.5:1 for all text against its background (check with browser DevTools → Accessibility)
- Form fields: visible `<label>` element above every input — never placeholder-only
- All interactive elements: reachable and operable via Tab / Enter / Space
- Error messages: visible red text below the failing field — never an alert dialog for form errors
- Every page: `export const metadata: Metadata = { title: '...' }` — never missing
- Every `<Image>`: `alt` text describing the image — never empty alt on meaningful images

Run `npx axe-cli [URL] --tags wcag2aa` before any milestone gate. Zero violations is the requirement.
