# Thrive@Home — AI Agent Build Prompt

> **Read this entire file before writing a single line of code in every session.**
> This file defines how you must behave, how you must write code, and the exact build instructions for every phase.
> If any instruction here conflicts with something you think is faster or easier, follow this file.

---

## SECTION 1 — Core Rules (Non-Negotiable)

These rules apply to every phase, every file, every line of code. They are not guidelines. Violating any of them is a build error that must be fixed before proceeding.

---

### Rule 1 — Human approval is required before every phase transition

This is the most important rule in the file. It has no exceptions.

When you believe a phase is complete:

1. Stop writing code immediately
2. Run every test for that phase defined in `tests.md`
3. Present your results in this exact format — do not deviate from the format:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ PHASE [N] — [PHASE NAME] — COMPLETE, AWAITING YOUR APPROVAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

What was built:
• [every file created, with its full path]
• [every file modified, with what changed]
• [every database table or column created or altered]
• [every external service configured]

Tests run:
• [test ID from tests.md]: PASSED — [one sentence describing what was verified]
• [test ID]: PASSED — [description]

What to check right now:
• [specific URL, Supabase table, or terminal output to look at]
• [another specific thing — be precise, not vague]

Please verify the items above, then reply:
  APPROVED — I will immediately begin Phase [N+1]
  ISSUE: [describe exactly what you see] — I will investigate and fix before asking again
```

4. Wait. Do not begin Phase N+1. Do not write "preparatory" code. Do not start "just getting a head start." Do not ask if you should proceed. Wait for the user's message.

5. If the user replies with APPROVED, update `checklist.md` to mark Phase N as `[x]`, append a session entry to `progress.md`, then begin Phase N+1.

6. If the user replies with ISSUE, fix the problem, re-run the affected tests, and present the same review format again. Do not move to N+1 until the user replies APPROVED.

7. If the user replies with anything else that is not clearly APPROVED or ISSUE, ask: "Should I proceed to Phase [N+1], or is there something to fix first?" Do not assume.

**No exceptions.** Not for "simple" phases. Not when you are confident. Not when phases are closely related. Not when the next phase is "just one small thing." Every phase. Every time.

---

### Rule 2 — Never claim success without proof

A phase that compiles is not complete. A function that exists is not correct. Code that looks right has not been tested.

The test defined in `tests.md` for the phase is the only acceptable proof of completion. If a test cannot run because a service is not configured, stop and tell the user exactly which environment variable is missing and where to find the value. Do not skip the test. Do not work around it.

---

### Rule 3 — Never assume environment variables are set

Before writing any code that calls an external service, check that the required environment variable exists. Use `/lib/env.ts` (created in Phase 1):

```ts
export function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value || value.trim() === '') {
    throw new Error(
      `\n\n❌ Missing required environment variable: ${name}\n` +
      `   Add it to your .env.local file.\n` +
      `   See .env.local.example for where to find this value.\n`
    )
  }
  return value
}

export function requireServerEnv(name: string): string {
  if (typeof window !== 'undefined') {
    throw new Error(
      `[Security] "${name}" is a server-only variable but was accessed in the browser. ` +
      `Move this call to a Server Component, API Route, or Server Action.`
    )
  }
  return requireEnv(name)
}
```

Never use `!` non-null assertions on `process.env` values. Never use fallback values like `?? 'placeholder'` or `?? ''`. If the variable is absent, throw immediately with a message that tells the user exactly what to do.

---

### Rule 4 — Never swallow errors

Every `try/catch` must log the full error object (not just `e.message`). Every external API response must have its status checked before using the body. Every Supabase result must be checked for both `null` and `error` before use.

```ts
// WRONG — silent failure, impossible to debug
try {
  return await doSomething()
} catch {
  return null
}

// RIGHT — loud, traceable, tells you exactly where it broke
try {
  return await doSomething()
} catch (e) {
  console.error('[moduleName/functionName] Failed:', e)
  throw new Error(`[moduleName/functionName] Failed: ${e instanceof Error ? e.message : String(e)}`)
}
```

Never return empty data and let the app silently appear to work. Surface every failure loudly in the server logs and return a typed error object to the caller.

---

### Rule 5 — Never hardcode secrets

No API key, auth token, webhook secret, connection string, phone number, or email address belongs in source code as a string literal.

Specific prohibitions — none of these may appear as string literals in any `.ts` or `.tsx` file:
- Supabase project URL or any Supabase key
- Any Stripe key (`sk_`, `pk_`, `whsec_`)
- Any Twilio credential (`AC`, auth token)
- Any Retell AI key
- Any Anthropic key (`sk-ant-`)
- Any SendGrid key (`SG.`)
- Phone numbers (even test phone numbers)
- Email addresses that belong in configuration

If you find yourself typing a string that looks like it grants access to something, stop. Put it in `.env.local`.

---

### Rule 6 — Never let secrets reach GitHub

`.gitignore` must exclude all `.env*` files before the very first `git push`. After creating `.gitignore`, run this to verify it works:

```bash
echo "TEST=secret" > .env.local && git status
```

`.env.local` must appear under "Untracked files" — NOT under "Changes to be committed". If it appears under staged changes, the `.gitignore` is broken. Stop everything and fix it before any further commits.

Before every commit, run both checks:

```bash
# Check 1 — no .env files are tracked
git ls-files | grep -E "^\.env"
# Expected output: nothing

# Check 2 — no secrets in staged diff
git diff --cached --name-only | xargs grep -l -E "(sk_live|sk_test|pk_live|pk_test|SG\.|AC[a-z0-9]{32}|whsec_|retell-|sk-ant-)" 2>/dev/null
# Expected output: nothing
```

If either check produces output, do not commit. Investigate and fix first.

If a secret is accidentally committed: revoke it at the service dashboard immediately, then contact GitHub to purge the history.

---

### Rule 7 — One phase at a time

Read the current phase section in full. Build exactly what it describes — nothing more. Run its tests. Wait for APPROVED. Then and only then start the next phase.

Do not build features "for later." Do not refactor previous phases unless the current phase explicitly requires it. Do not add "nice to have" error handling for edge cases that only arise in a later phase. Scope creep is the primary way this build will fail.

---

### Rule 8 — Write for a non-technical founder

Every file must have a one-line comment at the top explaining its purpose in plain English. Every function must have a JSDoc comment. User-facing error messages must be readable sentences that a non-developer can understand and act on.

Wrong error: `Error: PGRST116 — JSON object requested, multiple (or no) rows returned`
Right error: `We couldn't find your account. Please try signing in again.`

Comments explain the *why*, not the *what*. If what the code does is already obvious from the code, the comment adds nothing.

---

### Rule 9 — TypeScript strict mode, always

`tsconfig.json` must have `"strict": true`. No `any` types — use `unknown` and narrow with type guards. All function parameters explicitly typed. All function return types explicitly typed on any function called from more than one place.

Run `npx tsc --noEmit` before every phase review. Zero TypeScript errors is the requirement. One error means the phase is not ready for review.

---

### Rule 10 — No test data in production code paths

Test scripts and seed scripts live in `/scripts/` only. They must never be imported by any file in `/app/`, `/lib/`, or `/components/`. All test rows inserted into Supabase during a test script must be deleted at the end of that script. Never leave test members, test calls, or test alerts in the database after a test run.

---

### Rule 11 — Security checks on every API route

Every route that reads or modifies sensitive data must perform these checks in this exact order, before any database access:

1. Verify authentication — return `401` if no valid session
2. Verify authorisation — return `403` if the authenticated user does not have permission for this specific resource
3. Validate all inputs — return `400` if any required field is missing or malformed
4. Return the minimum data the caller needs — never more than necessary

---

### Rule 12 — Build modular, service-agnostic architecture from day one

**This is the most important architectural rule.**

Every feature that depends on an external paid service (Retell AI, Twilio, SendGrid, Anthropic, Stripe) must be built behind a TypeScript interface. The core product is built and works with stub implementations. Real services are plugged in as separate phases.

**What this means in practice:**
- The dashboard works and shows real data before the AI call system is connected
- Alerts are created, stored, and displayed before SMS is connected
- Families are notified via Supabase Realtime before SMS or email is connected
- Member enrollment works before billing exists
- The product is fully usable end-to-end before any external paid service beyond Supabase is activated

**The stub/interface/real pattern:**

```ts
// 1. Interface — defines the contract. Created in Phase 1. Never changes.
// /lib/interfaces/SmsProvider.ts
export interface SmsProvider {
  send(to: string, body: string): Promise<void>
  sendUrgent(to: string, body: string): Promise<void>
}

// 2. Stub — default. Logs what would happen. Never throws. No side effects.
// /lib/stubs/StubSmsProvider.ts
export class StubSmsProvider implements SmsProvider {
  async send(to: string, body: string) {
    console.log(`[StubSMS] Would send to ${to.substring(0, 6)}...: "${body.substring(0, 80)}..."`)
  }
  async sendUrgent(to: string, body: string) {
    console.log(`[StubSMS] URGENT — Would send to ${to.substring(0, 6)}...: "${body.substring(0, 80)}..."`)
  }
}

// 3. Real implementation — built in its service phase.
// /lib/services/TwilioSmsProvider.ts
export class TwilioSmsProvider implements SmsProvider {
  async send(to: string, body: string) { /* real Twilio call */ }
  async sendUrgent(to: string, body: string) { /* real Twilio call */ }
}

// 4. The providers file — THE ONLY PLACE that selects stub vs real.
// /lib/providers.ts
export const smsProvider: SmsProvider = process.env.TWILIO_ACCOUNT_SID
  ? new TwilioSmsProvider()
  : new StubSmsProvider()
```

All application code imports from `/lib/providers.ts` only. No application code imports from `/lib/stubs/` or `/lib/services/` directly. When a real service is added, only two files change: the new service implementation file, and `providers.ts`.

---

### Rule 13 — Supabase is the primary notification channel

Supabase Realtime and database inserts are the first notification mechanism. They are built in Layer 1 before any external SMS or email service. This means families can see updates in the dashboard, navigators see new alerts, and the system is fully observable before Twilio or SendGrid are ever connected.

The `notification_log` table, `alerts` table, and dashboard polling are the foundation. SMS and email (Layers 3 and 4) are layered on top of this foundation — they are enhancements, not prerequisites.

---

### Rule 14 — When a session ends mid-phase

If a conversation ends before a phase is complete:

1. Before closing, append a session entry to `progress.md` with `STATUS: IN_PROGRESS`
2. List every file created or modified so far in this session
3. List every test run and its result
4. The `NEXT SESSION MUST` field must describe exactly where to resume — which file, which function, which specific step remains
5. Update `checklist.md` to mark the phase as `[~]`

At the start of the next session:
1. Read `progress.md` fully from top to bottom
2. Find the `[~]` phase in `checklist.md`
3. Read the last session's `NEXT SESSION MUST` list
4. Resume from that exact point — do not redo completed steps, do not skip ahead

**Never** start a new session by "starting fresh" on a phase that was already in progress. Always resume exactly where the last entry in `progress.md` says to resume.

---

### Rule 15 — Seed data must be built before the dashboard phases

Phase 11 (Family Dashboard) and Phase 12 (Navigator Console) require realistic-looking data in the database. Without it, the dashboard is empty and impossible to review meaningfully.

**Create `/scripts/seed-test-data.ts` in Phase 7** (alongside the data layer), containing:

1. A test Supabase Auth user with email `test-family@thriveathome.dev` and password `TestPassword123!`
2. A test `family_members` row linked to the auth user, with `role = 'family'`
3. A test `members` row: full name "Margaret Chen", preferred name "Margaret", DOB 1945-06-15, phone +15550001234, language English, plan_tier basics, status active, topics_enjoy ["Gardening", "Books", "Family stories"]
4. A `navigator_assignments` row linking Margaret to a test navigator
5. Exactly 14 `check_in_calls` rows spanning the last 14 days with:
   - Alternating mood scores that trend slightly downward (8,8,7,8,7,6,7,6,5,6,5,5,4,5) to make the chart look real
   - `ai_summary` with a realistic stub sentence per call
   - `status = 'completed'`, `medication_taken` alternating true/false/true
6. Two `alerts` rows: one `informational` (acknowledged), one `concern` (unacknowledged)
7. Two `realtime_notifications` rows: one `read = true`, one `read = false`
8. Two `navigator_tasks` rows: one completed, one pending

The script prints login credentials at the end:
```
Seed complete.
Login: test-family@thriveathome.dev / TestPassword123!
Member: Margaret Chen (ID: [uuid])
```

**The script must be idempotent** — check for `test-family@thriveathome.dev` before inserting. If it already exists, skip silently (do not duplicate).

Create a companion `/scripts/clear-test-data.ts` that deletes all rows created by the seed script. Both scripts are run manually from the terminal — never imported by the application.

---

## SECTION 2 — Secrets Management

---

### 2.1 — The `.gitignore` file (create in Phase 1, before any other file or commit)

```gitignore
# Environment variables — NEVER commit these
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

# OS and IDE
.DS_Store
Thumbs.db
.vscode/settings.json
.idea/

# Logs
*.log
npm-debug.log*
coverage/
.nyc_output/

# Supabase local dev (contains credentials)
supabase/.temp/
supabase/config.toml

# Vercel
.vercel/
```

---

### 2.2 — The `.env.local.example` file (committed to GitHub — values always empty)

```bash
# ============================================================
# THRIVE@HOME — Environment Variables
# Copy this file to .env.local and fill in real values.
# .env.local is gitignored and will NEVER be committed.
# ============================================================

# --- CORE (Required from Phase 1) ---
NEXT_PUBLIC_APP_URL=
CARE_TEAM_EMAIL=
CRON_SECRET=

# --- SUPABASE (Required from Phase 2) ---
# supabase.com → your project → Settings → API
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
# WARNING: Bypasses all Row Level Security. Server-side only. Never expose to browser.
SUPABASE_SERVICE_ROLE_KEY=

# ============================================================
# EXTERNAL SERVICES — add credentials as you reach each layer
# ============================================================

# --- ANTHROPIC (Layer 2, Phase 13 — AI call summaries) ---
ANTHROPIC_API_KEY=

# --- RETELL AI (Layer 2, Phase 14 — Voice agent) ---
RETELL_API_KEY=
RETELL_AGENT_ID=
RETELL_WEBHOOK_SECRET=

# --- TWILIO (Layer 2/3, Phase 15/19 — Outbound calls and SMS) ---
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
ONCALL_NAVIGATOR_PHONE=

# --- SENDGRID (Layer 3, Phase 20 — Email notifications) ---
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=

# --- STRIPE (Layer 4, Phase 25 — Subscriptions and billing) ---
# Use sk_test_/pk_test_ throughout development. Only switch to live keys after Layer 4 gate.
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID_BASICS=
STRIPE_PRICE_ID_CONNECT=
STRIPE_PRICE_ID_COMPLETE=
STRIPE_PRICE_ID_PREMIER=
```

---

### 2.3 — Server-only vs browser-safe variables

`NEXT_PUBLIC_` variables are bundled into every browser JavaScript file sent to users. Never prefix any credential with `NEXT_PUBLIC_`.

The only three `NEXT_PUBLIC_` variables in this project:
- `NEXT_PUBLIC_SUPABASE_URL` — not a secret; RLS is the security layer
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public by design in Supabase's security model
- `NEXT_PUBLIC_APP_URL` — not a secret

Everything else uses `requireServerEnv()`.

---

### 2.4 — Vercel environment variables

In Vercel: Project → Settings → Environment Variables. Never add any credential with `NEXT_PUBLIC_` prefix. Always redeploy after adding or changing variables.

---

## SECTION 3 — Project Architecture

---

### 3.1 — Folder structure

```
/app
  /api
    /cron              Scheduled job endpoints (protected by CRON_SECRET)
    /webhooks          Incoming webhooks (Retell, Stripe)
    /billing           Stripe checkout API routes
    /calls             Call scheduling API routes
  /dashboard           Family member pages
  /navigator           Care navigator pages
  /admin               Admin-only pages
  /onboarding          Member enrollment flow
  /login
  /signup
  /pricing             Plan selection (static in Layers 1–3, functional in Layer 4)
  /privacy

/components
  /ui                  Primitive components: Button, Card, Badge, Input, Select,
                       Skeleton, StatusDot, MoodEmoji, NotificationBell
  /dashboard           Dashboard-specific components
  /onboarding          Onboarding form step components
  /navigator           Navigator console components
  /shared              Components reused across multiple sections

/lib
  /supabase            client.ts (browser), server.ts (server), admin.ts (service role)
  /interfaces          TypeScript interfaces for every external service
  /stubs               Stub implementations — active by default, log what they would do
  /services            Real service implementations — activated by environment variables
  /providers.ts        THE ONE FILE that selects stub vs real for each service
  /data                All Supabase query functions
  /alerts              Alert detection, creation, deduplication, and escalation logic
  /realtime            Supabase Realtime subscription helpers
  /ai                  Prompt generation and transcript processing
  /env.ts              Environment variable validator (requireEnv, requireServerEnv)
  /auth.ts             Auth helpers
  /benefits            Benefits finder static data
  /volunteers          Volunteer matching scoring logic
  /celebrations        Birthday engine

/types                 TypeScript type definitions — never contains implementation code
/scripts               Test and seed scripts — never imported by the app
/supabase
  /migrations          SQL files — the single source of truth for schema
```

---

### 3.2 — Service interfaces (defined in Phase 1, never modified after)

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
  sendUrgent(to: string, body: string): Promise<void>  // Ignores notification preferences
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
  sendGriefSupportNotification(careTeamEmail: string, memberName: string, details: string): Promise<void>
}

// /lib/interfaces/AiProvider.ts
export interface CallScores {
  mood_score: number | null
  energy_score: number | null
  pain_score: number | null
  medication_taken: boolean | null
  alert_flags: string[]
}
export interface AiProvider {
  generateCallSummary(transcript: string): Promise<string | null>
  extractCallScores(seniorSpeechOnly: string): Promise<CallScores>
  generateNavigatorBrief(memberId: string, recentSummaries: string[]): Promise<string>
  generateCarePlan(member: Member, calls: CheckInCall[]): Promise<CarePlan>
  disambiguateCrisisContext(phrase: string, context: string): Promise<boolean>
}

// /lib/interfaces/BillingProvider.ts
export interface BillingProvider {
  createCheckoutSession(planTier: PlanTier, memberId: string, familyMemberId: string): Promise<string>
  getCustomerPortalUrl(stripeCustomerId: string): Promise<string>
  handleWebhookEvent(rawBody: string, signature: string): Promise<void>
}

// /lib/interfaces/RealtimeProvider.ts
// Supabase Realtime — the primary notification channel. Always real, no stub needed.
export interface RealtimeNotification {
  type: 'new_alert' | 'call_completed' | 'call_summary_ready' | 'medication_reminder' | 'system_message'
  memberId: string
  title: string
  body: string
  severity?: 'info' | 'concern' | 'urgent' | 'emergency'
  callId?: string
  alertId?: string
  createdAt: string
}
```

---

### 3.3 — The providers file (created in Phase 1 with all stubs, updated each service phase)

```ts
// /lib/providers.ts
// Controls which implementation is active for each external service.
// Stubs are always the default. Real services activate when their env var is present.
// APPLICATION CODE IMPORTS FROM HERE ONLY — never from /lib/stubs/ or /lib/services/ directly.

import { StubCallProvider }    from './stubs/StubCallProvider'
import { StubSmsProvider }     from './stubs/StubSmsProvider'
import { StubEmailProvider }   from './stubs/StubEmailProvider'
import { StubAiProvider }      from './stubs/StubAiProvider'
import { StubBillingProvider } from './stubs/StubBillingProvider'

import type { CallProvider }    from './interfaces/CallProvider'
import type { SmsProvider }     from './interfaces/SmsProvider'
import type { EmailProvider }   from './interfaces/EmailProvider'
import type { AiProvider }      from './interfaces/AiProvider'
import type { BillingProvider } from './interfaces/BillingProvider'

// NOTE: Supabase Realtime has no stub/real split — it is always real.
// It is imported directly from /lib/realtime/ wherever needed.

function resolveAiProvider(): AiProvider {
  if (process.env.ANTHROPIC_API_KEY) {
    const { AnthropicAiProvider } = require('./services/AnthropicAiProvider')
    return new AnthropicAiProvider()
  }
  return new StubAiProvider()
}

function resolveCallProvider(): CallProvider {
  if (process.env.RETELL_API_KEY && process.env.TWILIO_ACCOUNT_SID) {
    const { RetellCallProvider } = require('./services/RetellCallProvider')
    return new RetellCallProvider()
  }
  return new StubCallProvider()
}

function resolveSmsProvider(): SmsProvider {
  if (process.env.TWILIO_ACCOUNT_SID) {
    const { TwilioSmsProvider } = require('./services/TwilioSmsProvider')
    return new TwilioSmsProvider()
  }
  return new StubSmsProvider()
}

function resolveEmailProvider(): EmailProvider {
  if (process.env.SENDGRID_API_KEY) {
    const { SendGridEmailProvider } = require('./services/SendGridEmailProvider')
    return new SendGridEmailProvider()
  }
  return new StubEmailProvider()
}

function resolveBillingProvider(): BillingProvider {
  if (process.env.STRIPE_SECRET_KEY) {
    const { StripeBillingProvider } = require('./services/StripeBillingProvider')
    return new StripeBillingProvider()
  }
  return new StubBillingProvider()
}

export const aiProvider      = resolveAiProvider()
export const callProvider    = resolveCallProvider()
export const smsProvider     = resolveSmsProvider()
export const emailProvider   = resolveEmailProvider()
export const billingProvider = resolveBillingProvider()
```

---

### 3.4 — Stub behaviour standard

Every stub must: log exactly what it would have done. Never throw. Never cause side effects. Include `[STUB]` in log output so it is immediately visible that a stub is active.

```ts
// Example — StubAiProvider
export class StubAiProvider implements AiProvider {

  async generateCallSummary(transcript: string): Promise<string | null> {
    console.log('[StubAI] generateCallSummary — returning placeholder. Set ANTHROPIC_API_KEY for real summaries.')
    return 'Margaret had a good morning. She mentioned enjoying her coffee and is looking forward to her granddaughter\'s visit this weekend. Her knee is feeling better today. [STUB SUMMARY — real AI summary activates once ANTHROPIC_API_KEY is set]'
  }

  async extractCallScores(_transcript: string): Promise<CallScores> {
    console.log('[StubAI] extractCallScores — returning placeholder scores.')
    return { mood_score: 7, energy_score: 6, pain_score: null, medication_taken: true, alert_flags: [] }
  }

  async disambiguateCrisisContext(_phrase: string, _context: string): Promise<boolean> {
    // Stub defaults to NON-crisis — safe for development where no real calls are made
    console.log('[StubAI] disambiguateCrisisContext — returning false (stub mode, no real calls in Layer 1)')
    return false
  }

  async generateNavigatorBrief(_memberId: string, summaries: string[]): Promise<string> {
    console.log('[StubAI] generateNavigatorBrief — returning placeholder brief.')
    return `[STUB BRIEF] Before calling this member: review their last ${summaries.length} call summaries. Real AI brief activates once ANTHROPIC_API_KEY is set.`
  }

  async generateCarePlan(_member: Member, calls: CheckInCall[]): Promise<CarePlan> {
    console.log('[StubAI] generateCarePlan — returning placeholder plan.')
    return { wellnessSummary: '[STUB] Real care plan generates from Anthropic API.', topStrengths: [], areasForAttention: [], recommendedActions: [], communityOpportunities: [], familyTalkingPoints: [], nextReviewDate: null }
  }
}
```

---

### 3.5 — Supabase Realtime: the primary notification channel

Before Twilio SMS and SendGrid email are connected (Layers 3 and 4), families and navigators are notified via Supabase Realtime — live database subscription that pushes updates to open browser tabs instantly.

**How it works:**

```ts
// /lib/realtime/notifications.ts
// Inserts a row into the realtime_notifications table.
// Supabase Realtime broadcasts this insert to all subscribed clients.
// The client (dashboard or navigator console) shows a toast or bell update.

export async function pushRealtimeNotification(
  notification: RealtimeNotification
): Promise<void> {
  const adminSupabase = createAdminClient()
  const { error } = await adminSupabase
    .from('realtime_notifications')
    .insert({
      type: notification.type,
      member_id: notification.memberId,
      title: notification.title,
      body: notification.body,
      severity: notification.severity ?? 'info',
      call_id: notification.callId ?? null,
      alert_id: notification.alertId ?? null,
    })

  if (error) {
    console.error('[realtime/pushNotification] Insert failed:', error)
    // Log but do not throw — a failed notification should not crash the pipeline
  }
}
```

**Client subscription** (in dashboard and navigator console):

```ts
// Subscribe to realtime notifications for this member
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
      const notification = payload.new as RealtimeNotification
      showToast(notification)         // toast in corner of screen
      updateNotificationBell()        // increment bell counter
      refreshDashboardSection(notification.type)  // refresh relevant section
    }
  )
  .subscribe()
```

**This is always real** — no stub needed. It requires only Supabase (already set up from Phase 2) and works in every layer from Phase 9 onward.

---

## SECTION 4 — Build Order

The build is divided into four layers. Each layer produces a shippable, testable product. No layer starts until the previous one is fully approved.

```
LAYER 1 — CORE PRODUCT  (Phases 1–12)
  ─────────────────────────────────────────────────────────────
  Everything works. No paid external services needed.
  ● Member enrollment (3-step form, no plan selection yet)
  ● Family dashboard (populated with seed data)
  ● Supabase Realtime notifications (alerts + call updates in browser)
  ● Alert engine (all detection logic, alerts visible in dashboard)
  ● Navigator console (caseload, alert queue, member detail panel)
  ● Call history page
  All external services (calls, SMS, email, billing) run as stubs.
  Stubs log what they would do — the full data flow is observable.

LAYER 2 — AI & CALLS  (Phases 13–17)
  ─────────────────────────────────────────────────────────────
  Real AI check-in calls replace stub calls.
  ● Anthropic: real transcripts → real summaries → real scores
  ● Retell AI + Twilio: real outbound calls to real phones
  ● Outbound call scheduler (Vercel Cron)
  ● Call webhook: transcript → scores → summary → alerts
  Crisis detection goes live (but escalation SMS is still stub-logged)

LAYER 3 — OUTBOUND NOTIFICATIONS  (Phases 18–23)
  ─────────────────────────────────────────────────────────────
  Real SMS and email replace stub notifications.
  ● Twilio SMS: post-call updates to family
  ● SendGrid email: post-call summaries to family
  ● Medication reminders (SMS)
  ● Crisis escalation SMS goes fully live
  ● Call history page
  The product is fully functional before billing exists.

LAYER 4 — BILLING  (Phases 24–29)
  ─────────────────────────────────────────────────────────────
  Stripe billing added as a feature on top of a working product.
  ● Stripe products created
  ● Plan selection added to onboarding (Step 4)
  ● Checkout flow
  ● Stripe webhook handler
  ● Billing management page
  ● Members enrolled in Layers 1–3 prompted to select a plan
  The product already works without billing. Billing is not a foundation.
```

---

## SECTION 5 — Phase-by-Phase Build Instructions

---

## ═══════════════ LAYER 1 — CORE PRODUCT ═══════════════

*Goal: A complete, working product with Supabase Realtime notifications, using stubs for all paid external services.*

---

### PHASE 1 — Project Scaffold

**Required before starting:** GitHub repo `thrive-at-home` exists. Vercel account connected to GitHub. Supabase project created and credentials collected. No other accounts needed yet.

**Steps — execute in this order:**

**1. Create the project:**
```bash
npx create-next-app@latest thrive-at-home --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
cd thrive-at-home
node --version  # Must be 18+. If lower, stop and tell the user.
```

**2. Create `.gitignore` BEFORE anything else:**
Use the exact content from Section 2.1. Then verify:
```bash
echo "TEST=secret" > .env.local && git status
```
`.env.local` must appear under "Untracked files". If it does not, the `.gitignore` is broken. Fix before continuing — do not proceed past this point with a broken `.gitignore`.

**3. Create `.env.local.example`:**
Use the exact content from Section 2.2. Commit this file. This file IS committed to GitHub — it has no values, only variable names.

**4. Create `.env.local`:**
```bash
cp .env.local.example .env.local
```
Fill in only: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL=http://localhost:3000`, `CARE_TEAM_EMAIL`, `CRON_SECRET`. All service variables stay blank.

**5. Configure Tailwind brand tokens in `tailwind.config.ts`:**
```ts
theme: {
  extend: {
    colors: {
      brand: {
        navy: '#1B3A6B', teal: '#2A9D8F',
        'navy-light': '#2A5298', 'teal-light': '#3DBFB0',
        'warm-white': '#FAFAF8',
      },
    },
    fontSize: { base: ['18px', '1.6'] },  // Senior-readable base size
  },
}
```

**6. Create all folders:**
```bash
mkdir -p app/api/{cron,webhooks,billing,calls} \
  app/{dashboard,navigator,admin,onboarding,login,signup,pricing,privacy} \
  components/{ui,dashboard,onboarding,navigator,shared} \
  lib/{supabase,interfaces,stubs,services,realtime,data,alerts,ai,benefits,volunteers,celebrations} \
  types scripts supabase/migrations
find lib types scripts -type d -exec touch {}/.gitkeep \;
```

**7. Create `/lib/env.ts`:**
Exact content from Section 1, Rule 3.

**8. Create all five service interfaces in `/lib/interfaces/`:**
Exact content from Section 3.2. These are TypeScript interface definitions only — no implementation. They define the contract that stubs and real implementations must both satisfy.

**9. Create all five stub implementations in `/lib/stubs/`:**
Using the pattern from Section 3.4. `StubCallProvider`, `StubSmsProvider`, `StubEmailProvider`, `StubAiProvider`, `StubBillingProvider`. Each method logs what it would have done and returns a sensible placeholder.

**10. Create `/lib/providers.ts`:**
Exact content from Section 3.3. With no env vars set, all five exports are stub instances.

**11. Create the landing page at `/app/page.tsx`:**
Plain page with "Thrive@Home" heading and tagline in brand colours. Minimum viable — just enough to confirm the app runs.

**12. Commit and push to GitHub:**
```bash
git add .
git status  # CONFIRM: .env.local does NOT appear in this list
git commit -m "Phase 1: Scaffold, interfaces, stubs, provider pattern"
git push
```
Import the repo in Vercel. Deploy with defaults. Once the Vercel URL is known, update `NEXT_PUBLIC_APP_URL` in `.env.local` and in Vercel environment variables.

**Phase review:** Run `npx tsc --noEmit` (zero errors required). Show the user the live Vercel URL and the folder structure.

---

### PHASE 2 — Supabase Connection

Ask the user for their Supabase credentials. Add to `.env.local` before writing any code.

Install: `npm install @supabase/supabase-js @supabase/ssr`

**Create three Supabase client files:**

`/lib/supabase/client.ts` — browser client using the anon key. Uses `requireEnv()`.

`/lib/supabase/server.ts` — server client using session cookies. Uses `requireEnv()`. Handles cookie read-only errors in Server Components silently (the middleware handles session refresh).

`/lib/supabase/admin.ts` — admin client using the service role key. Uses `requireServerEnv()`. Explicitly labelled: bypasses all RLS policies. Singleton pattern — only one instance created. Never imported in a Client Component.

**Test:** Create a temporary `connection_test` table in Supabase, insert a row manually, create `/app/test/page.tsx` that fetches it. After the test passes, delete the test page and table. Run `npx tsc --noEmit` to confirm clean imports.

---

### PHASE 3 — Database Schema

Write all SQL in `/supabase/migrations/001_initial_schema.sql` before running anything. This file is the single source of truth for the database schema. Never modify the database without updating this file first.

**Schema standards:**
- All PKs: `id uuid DEFAULT gen_random_uuid() PRIMARY KEY`
- All timestamps: `created_at timestamptz DEFAULT now() NOT NULL`
- All FKs: `ON DELETE CASCADE` (document exceptions with a comment)
- All enums: PostgreSQL `TYPE` created before any table that uses them
- All arrays: `text[]` — never JSON arrays
- All JSON: `jsonb` — never `json`
- All phone numbers: `text`
- All enum values: `lowercase_with_underscores`

**Tables to create:**

`members`: id, created_at, full_name, preferred_name, date_of_birth (date), phone_number, preferred_language DEFAULT 'english', preferred_call_time, timezone, check_in_frequency, topics_enjoy text[], topics_avoid text, lives_alone boolean, mobility_devices text[], health_conditions text, medications text, plan_tier (enum: basics/connect/complete/premier), status (enum: active/inactive/paused), address text

`family_members`: id, created_at, member_id FK→members, supabase_auth_id uuid, full_name, email, phone, relationship, notification_prefs jsonb DEFAULT '{"sms":true,"email":true,"realtime":true}', alert_level (enum: all/urgent_only/weekly_digest), role (enum: family/navigator/admin)

`check_in_calls`: id, created_at, member_id FK→members, scheduled_at timestamptz, started_at timestamptz (nullable), ended_at timestamptz (nullable), duration_seconds int (nullable), status (enum: scheduled/in_progress/completed/missed/failed), mood_score int (nullable), energy_score int (nullable), pain_score int (nullable), medication_taken boolean (nullable), transcript text (nullable), ai_summary text (nullable), alert_flags jsonb DEFAULT '[]', recording_url text (nullable), retell_call_id text (nullable — null when stub)

`alerts`: id, created_at, member_id FK→members, alert_type (enum: missed_call/mood_drop/medication_miss/wellness_drift/fall/crisis/emergency), severity (enum: informational/concern/urgent/emergency), message text, acknowledged boolean DEFAULT false, acknowledged_by FK→family_members (nullable), acknowledged_at timestamptz (nullable)

`care_navigators`: id, created_at, full_name, email, phone, certifications text[], caseload_limit int DEFAULT 150, is_active boolean DEFAULT true

`navigator_assignments`: id, created_at, member_id FK→members, navigator_id FK→care_navigators, assigned_at timestamptz DEFAULT now(), is_primary boolean DEFAULT true

`navigator_tasks`: id, created_at, member_id FK→members, navigator_id FK→care_navigators (nullable), task_type text, description text, priority (enum: low/medium/high/critical), due_by timestamptz (nullable), completed boolean DEFAULT false, completed_at timestamptz (nullable)

`navigator_notes`: id, created_at, member_id FK→members, navigator_id FK→care_navigators, note text

`subscriptions`: id, created_at, member_id FK→members, stripe_customer_id text (nullable), stripe_subscription_id text (nullable), plan_tier (enum), status (enum: active/past_due/cancelled/trialing), current_period_start timestamptz (nullable), current_period_end timestamptz (nullable), monthly_amount_cents int (nullable)

`realtime_notifications`: id, created_at, member_id FK→members, type (enum: new_alert/call_completed/call_summary_ready/medication_reminder/system_message), title text, body text, severity (enum: info/concern/urgent/emergency) DEFAULT 'info', call_id FK→check_in_calls (nullable), alert_id FK→alerts (nullable), read boolean DEFAULT false, read_at timestamptz (nullable)

`notification_log`: id, created_at, member_id FK→members, family_member_id FK→family_members (nullable), channel (enum: realtime/sms/email), status (enum: sent/failed/stub), message_preview text (first 200 chars), error_message text (nullable)

`emergency_log`: id, created_at, member_id FK→members, call_id FK→check_in_calls (nullable), alert_type text, triggered_phrase text, timestamp timestamptz DEFAULT now()

`medication_schedules`: id, created_at, member_id FK→members, reminder_time time, days_of_week text[], label text DEFAULT 'Medications', is_active boolean DEFAULT true

**Indexes:**
```sql
CREATE INDEX idx_calls_member_scheduled   ON check_in_calls(member_id, scheduled_at DESC);
CREATE INDEX idx_alerts_member_unacked    ON alerts(member_id, acknowledged) WHERE acknowledged = false;
CREATE INDEX idx_family_auth_id           ON family_members(supabase_auth_id);
CREATE INDEX idx_nav_assignments_nav      ON navigator_assignments(navigator_id);
CREATE INDEX idx_realtime_notifs_member   ON realtime_notifications(member_id, read, created_at DESC);
```

**Also create the audit triggers** (add to a separate migration file `/supabase/migrations/002_audit.sql`):
```sql
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  timestamp timestamptz DEFAULT now() NOT NULL
);

CREATE OR REPLACE FUNCTION log_data_access() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (user_id, action, resource_type, resource_id)
  VALUES (
    auth.uid(), TG_OP, TG_TABLE_NAME,
    CASE WHEN TG_OP = 'DELETE' THEN OLD.id::text ELSE NEW.id::text END
  );
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER members_audit     AFTER INSERT OR UPDATE OR DELETE ON members          FOR EACH ROW EXECUTE FUNCTION log_data_access();
CREATE TRIGGER calls_audit       AFTER INSERT OR UPDATE OR DELETE ON check_in_calls   FOR EACH ROW EXECUTE FUNCTION log_data_access();
CREATE TRIGGER alerts_audit      AFTER INSERT OR UPDATE OR DELETE ON alerts           FOR EACH ROW EXECUTE FUNCTION log_data_access();
```

**Enable Supabase Realtime** for the `realtime_notifications` table:
- Go to Supabase Dashboard → Database → Replication → Tables
- Enable `realtime_notifications` for INSERT events

**Verify:** All tables visible in Table Editor. FK relationships visible in schema visualiser. Test insert/delete pair. Realtime enabled for `realtime_notifications`.

---

### PHASE 4 — Row Level Security

Enable RLS on ALL tables before writing any policies. A table with RLS enabled but no policies denies all access — confirm your policies are correct before marking complete.

**Policy pattern:**
```sql
-- Family members read their own senior's data
CREATE POLICY "family_read_own_member" ON members FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.member_id = members.id
    AND fm.supabase_auth_id = auth.uid()
  )
);

-- Realtime notifications: members see their own
CREATE POLICY "family_read_own_notifications" ON realtime_notifications FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.member_id = realtime_notifications.member_id
    AND fm.supabase_auth_id = auth.uid()
  )
);

-- Mark notifications as read (UPDATE)
CREATE POLICY "family_mark_own_notifications_read" ON realtime_notifications FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.member_id = realtime_notifications.member_id
    AND fm.supabase_auth_id = auth.uid()
  )
);
```

Apply similar policies for: `check_in_calls`, `alerts`, `subscriptions` (family reads own), `care_navigators` and `navigator_assignments` (navigator reads own), `navigator_tasks` and `navigator_notes` (navigator reads assigned).

**Mandatory cross-user test:**
1. Create two Supabase Auth test users
2. Create two members, link each user via `family_members`
3. Confirm user A cannot read member B's data (empty array returned, not an error)
4. Confirm admin service-role key reads both
5. Delete all test data

---

### PHASE 5 — Authentication

**Middleware routing table** (`/middleware.ts`):

| Condition | Action |
|-----------|--------|
| Unauthenticated → `/dashboard/*`, `/navigator/*`, `/admin/*` | Redirect `/login` |
| `family` role → `/navigator/*` or `/admin/*` | Redirect `/dashboard` |
| `navigator` role → `/admin/*` | Redirect `/navigator` |
| Authenticated → `/login` or `/signup` | Redirect to role's home |
| Any user → `/`, `/pricing`, `/privacy`, `/employers`, `/api/*` | Pass through |

Middleware must refresh the Supabase session on every request using the SSR helper pattern.

**Signup atomicity:** Creating the `family_members` row and the Supabase Auth user must succeed together. If the `family_members` insert fails, call `supabase.auth.admin.deleteUser(userId)` to roll back the auth user, then show the user a clear error message. Never leave an orphaned auth user with no corresponding `family_members` row.

**Auth helpers in `/lib/auth.ts`:** `getCurrentUser()`, `getUserRole()`, `requireAuth()`.

**Test:** Every routing rule in the table above must be verified with real browser navigation before approval.

---

### PHASE 6 — Member Onboarding Form

**Plan selection is NOT in this form.** It is added in Layer 4. All members default to `plan_tier = 'basics'` on the backend until billing is connected.

**Three steps:**
1. About the senior (full name, preferred name, DOB, phone, preferred language, address)
2. Call preferences (call time, timezone, frequency, topics to enjoy, topics to avoid)
3. Safety & emergency contacts (two contacts, doctor, medications, conditions, mobility, lives alone)

Form state: single object, persisted to `localStorage` on every change, cleared on successful submit.

Validation: client-side on step advance, server-side on final submit. Server returns `{ valid: false; errors: Record<string, string> }` for any failure.

**Validation rules:**
- Phone: E.164 pattern `/^\+?[1-9]\d{1,14}$/` or US format `/^\(?[0-9]{3}\)?[-. ]?[0-9]{3}[-. ]?[0-9]{4}$/`
- DOB: in the past, person at least 60 years old
- Language: must be one of the 13 supported languages
- Emergency contact 1: required

Submission: Supabase RPC that atomically creates the `members` row AND links to the logged-in `family_members` row. If either insert fails, neither is saved.

Confirmation page: "Welcome to the Thrive@Home family, [preferred name]!"

---

### PHASE 7 — App Data Layer

**Every function signature:**
```ts
export async function getMember(id: string): Promise<{ data: Member | null; error: string | null }>
```

Never throws. Always returns `{ data, error }`. Callers check `error` before using `data`.

**Functions to create:**

`/lib/data/members.ts`: `getMember`, `getMembersByFamily`, `createMember`, `updateMember`

`/lib/data/calls.ts`: `getRecentCalls(memberId, limit, offset?)`, `getCallById`, `createCall`, `updateCall`

`/lib/data/alerts.ts`: `getActiveAlerts`, `getAllAlerts`, `createAlert`, `acknowledgeAlert`

`/lib/data/family.ts`: `getFamilyMembers`, `getFamilyMemberByUserId`

`/lib/data/navigator.ts`: `getNavigatorMembers`, `getNavigatorTasks`, `createTask`, `completeTask`, `saveNavigatorNote`, `getNavigatorNotes`

`/lib/data/notifications.ts`: `getUnreadNotifications`, `markNotificationRead`, `markAllRead`

**TypeScript types in `/types/`:** `member.ts`, `call.ts`, `alert.ts`, `notification.ts`

**Test:** Script in `/scripts/test-data-layer.ts` testing every function with valid and invalid inputs. Run `npx tsc --noEmit`. All assertions must pass.

---

### PHASE 8 — Primitive UI Components

Build these before any page — all pages depend on them.

`/components/ui/Button.tsx`: variants: primary (navy fill), secondary (teal outline), danger (red), ghost. All: `min-h-[52px] text-lg px-6 rounded-xl`. `loading?: boolean` shows a spinner and disables click.

`/components/ui/Card.tsx`: `p-6 rounded-xl shadow-sm`. Variants: default, highlight (teal border), warning (amber border), danger (red border).

`/components/ui/Badge.tsx`: small pill. Variants matching alert severities and plan tiers.

`/components/ui/Input.tsx`: visible label above field (never placeholder-only). Error state shows message below field in red.

`/components/ui/Select.tsx`: same styling as Input.

`/components/ui/Skeleton.tsx`: animated grey pulse. Accepts `className` for sizing.

`/components/ui/StatusDot.tsx`: coloured circle. `no_alerts` → green, `concern/informational` → amber, `urgent/emergency` → red.

`/components/ui/MoodEmoji.tsx`: score ≥ 8 → 😊, ≥ 6 → 🙂, ≥ 4 → 😐, ≥ 2 → 😔, < 2 → 😞, null → —. Score 7–10 → green-700/green-50, 4–6 → amber-700/amber-50, 1–3 → red-700/red-50, null → gray-400.

`/components/ui/NotificationBell.tsx`: bell icon with a count badge. Shows unread count from `realtime_notifications`. Clicking opens a dropdown showing last 5 notifications. Each notification has a "Mark read" button. Connected to the Supabase Realtime subscription from Section 3.5.

All components: accept `className` prop. Fully accessible: ARIA labels, keyboard navigation, 4.5:1 minimum contrast. Use `brand.*` colour tokens — never hardcoded hex values.

**Test:** Render all components in a temporary `/app/test-ui/page.tsx`. Confirm every variant. Delete the page after approval.

---

### PHASE 9 — Supabase Realtime Notification System

This phase builds the primary notification infrastructure. It is built before the AI call system, before SMS, and before email — because it is the simplest reliable notification channel and is the foundation everything else builds on.

**Database setup (already done in Phase 3):** `realtime_notifications` table exists with Realtime enabled for INSERT events.

**`/lib/realtime/notifications.ts`:** `pushRealtimeNotification(notification: RealtimeNotification)` — uses admin client to insert into `realtime_notifications`. Logs on failure but never throws (notification failure must not crash the calling pipeline).

**`/lib/realtime/useNotifications.ts`:** A React hook that subscribes a client to their notifications channel and returns `{ notifications, unreadCount, markRead, markAllRead }`.

```ts
export function useNotifications(memberId: string) {
  const supabase = createClient()
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([])

  useEffect(() => {
    // Load existing unread notifications on mount
    getUnreadNotifications(memberId).then(({ data }) => {
      if (data) setNotifications(data)
    })

    // Subscribe to new inserts
    const channel = supabase
      .channel(`notifications:${memberId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'realtime_notifications', filter: `member_id=eq.${memberId}` },
        (payload) => {
          const newNotif = payload.new as RealtimeNotification
          setNotifications(prev => [newNotif, ...prev])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [memberId])

  return { notifications, unreadCount: notifications.filter(n => !n.read).length }
}
```

**Wire into the alert pipeline:** When `createAlert()` creates a new alert, immediately call `pushRealtimeNotification()` with the alert details. This means the family sees the alert in their dashboard without refreshing — even before SMS or email are connected.

**Wire into the call pipeline:** When a `check_in_calls` row is updated to `completed`, push a `call_completed` notification. When `ai_summary` is populated, push a `call_summary_ready` notification.

**Test:** Open the dashboard in one browser tab. In another, insert a row into `alerts` for that member. Confirm a notification toast appears in the dashboard tab within 2 seconds without refreshing.

---

### PHASE 10 — Alert Logic

All alert detection and creation — no external services required.

**`/lib/alerts/createCallAlerts.ts`:**

| Condition | Alert type | Severity |
|-----------|-----------|---------|
| `crisis` in `alert_flags` | crisis | emergency |
| `fall` in `alert_flags` | fall | urgent |
| `no_eating` in `alert_flags` | wellness_drift | urgent |
| `confusion` in `alert_flags` | wellness_drift | concern |
| `pain_score > 7` | wellness_drift | concern |
| `isolation` in `alert_flags` | wellness_drift | informational |
| `medication_taken === false` (single miss) | medication_miss | informational |
| `mood_score <= 3` | mood_drop | concern |

Deduplication: use `.maybeSingle()` (not `.single()`). No duplicate unacknowledged alert of same type for same member within 24 hours.

Emergency events: write to `emergency_log` BEFORE creating the alert in `alerts`.

After creating the alert: always call `pushRealtimeNotification()` with alert details (Phase 9). In Layers 1 and 2, SMS and email are stubs — the Realtime notification is the real notification.

**`/lib/alerts/wellnessDrift.ts`:** Rolling 14-call average. Minimum 4 calls in last 7 days required. 7-day deduplication window.

**`/lib/alerts/crisisDetection.ts`:** Must run FIRST before any other processing. Scans senior speech only. On detection:
1. Write to `emergency_log`
2. Create `emergency` severity alert
3. Create `critical` navigator task
4. Push `emergency` severity Realtime notification (visible immediately in dashboard)
5. Call `smsProvider.sendUrgent()` — stub in Layers 1 and 2, real in Layer 3
6. Call `emailProvider.sendAlert()` — stub in Layers 1 and 2, real in Layer 3

In stub mode, steps 5 and 6 log what they would send. Steps 1–4 are always real.

**`/lib/alerts/missedCallDetection.ts`:** Runs as a cron. Stale `scheduled` calls → `missed`. Consecutive miss escalation. Calls providers via stubs.

---

### PHASE 11 — Family Dashboard

Seed data: create `/scripts/seed-test-data.ts` — populates realistic call records, alerts, and a member profile so the dashboard looks like a real product during development.

**Fetch data in parallel:**
```ts
const [memberResult, callsResult, alertsResult, notifResult] = await Promise.all([
  getMember(memberId),
  getRecentCalls(memberId, 7),
  getActiveAlerts(memberId),
  getUnreadNotifications(memberId),
])
```

**Loading state:** Skeleton placeholders for every data section — never a blank white page while loading.

**Error state:** Human-readable message — never raw error codes or stack traces.

**Sections:**
- Header: "Good morning, [family name]. Checking in on [senior preferred name]." + `StatusDot` + last check-in time
- Today's Wellness Card: `MoodEmoji`, ⚡ energy, 💚 comfort (never "pain"), medication ✓ green / ✗ amber (single miss = amber not red), AI summary paragraph
- 7-Day Mood Trend: Recharts `LineChart`, Y-axis labelled "Great" at top / "Tough day" at bottom, colour-coded dots
- Alerts Panel: severity-coloured `Card` for each alert, "No concerns this week 🌟" empty state
- Quick Actions: four `Button` components
- `NotificationBell` in the header with live unread count (Phase 9)

Mobile test: all content visible at 375px width with no horizontal scroll. All buttons minimum 52px height. All text minimum 18px.

---

### PHASE 12 — Navigator Console

Protected: `navigator` and `admin` roles only.

**Caseload table:**
- Sorted: emergency → urgent → concern → informational → no alerts, then oldest check-in first
- Real-time name search (filter without page reload)
- Each row: name, plan tier `Badge`, last check-in date + `MoodEmoji`, `StatusDot`, next scheduled call

**Alert queue** (above table, only when unacknowledged urgent/emergency alerts exist):
- Card per alert: member name, plain-English description, timestamp, "Acknowledge" button
- Acknowledging: marks in DB, records navigator user ID and timestamp, removes card immediately (no reload)

**Today's task list:**
- Tasks from `navigator_tasks` for this navigator, `completed = false`
- `Badge` per priority, member name, description, "Mark complete" button

**Member detail panel** (slides in from right on row click):
- Preferred name, age, plan tier
- AI pre-call brief: calls `aiProvider.generateNavigatorBrief()` — returns stub text in Layer 1
- Last 5 call summaries (expandable)
- Active alerts
- Family contacts
- Navigator notes: save to `navigator_notes`. Save states: idle / saving (spinner) / saved ✓ (2 seconds) / error
- Panel closes on Escape key and outside click
- Focus returns to the triggering row when closed (accessibility requirement)

**`NotificationBell`** in the navigator console header, scoped to their assigned members.

---

### LAYER 1 GATE

Present this exact message and wait for APPROVED:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ LAYER 1 COMPLETE — CORE PRODUCT READY FOR YOUR REVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

What works right now with no paid external services:
• A family member can sign up, enrol a senior (3 steps), and
  see a fully working dashboard
• Supabase Realtime notifications: new alerts appear instantly
  in the browser without refreshing
• Alert engine: all detection logic runs. Alerts are created,
  stored, colour-coded by severity, and visible in the dashboard
• Navigator console: caseload sorted by urgency, alerts
  acknowledgeable, member detail panel with notes
• All paid external services (AI, calls, SMS, email, billing)
  are running as stubs — logged to console

Supabase Realtime is fully live. Everything else is stubbed.

What Layer 2 adds: real AI check-in calls.
Required credentials: ANTHROPIC_API_KEY, RETELL_API_KEY,
RETELL_AGENT_ID, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN,
TWILIO_PHONE_NUMBER.

Reply APPROVED to begin Layer 2, or ISSUE: [description] to fix anything first.
```

---

## ═══════════════ LAYER 2 — AI & CALLS ═══════════════

*Goal: Real AI check-in calls replace stub calls. Transcripts → scores → summaries → alerts. All in real time.*

---

### PHASE 13 — Anthropic AI Provider

Confirm `ANTHROPIC_API_KEY` is in `.env.local` before writing any code.

Install: `npm install @anthropic-ai/sdk`

Create `/lib/services/AnthropicAiProvider.ts` implementing `AiProvider`.

**`generateCallSummary(transcript)` — system prompt:**
```
You write warm, plain-English summaries of daily check-in calls for adult children
who care about their aging parent.
Rules:
- Never use clinical language
- Never use these words: patient, vitals, symptoms, assessment, diagnosis
- Never include numerical scores or ratings
- Sound like a caring friend giving a brief update
- 3–5 sentences maximum
- Focus on mood, what was discussed, and anything they're looking forward to
```

**`extractCallScores(seniorSpeechOnly)` — false positive prevention:**
- Return `null` for any score where the topic was not discussed — never `0`
- Log every extracted score with the phrase that triggered it
- False positives to prevent: "fell asleep" → no fall flag, "pain is 3/10" → no `pain_high` flag (threshold > 7), "I don't want to be here at this party" → context disambiguation before crisis flag

**`disambiguateCrisisContext(phrase, context)` — fail-safe default:**
```ts
try {
  const answer = /* Claude API call: YES or NO */
  return answer === 'YES'
} catch (err) {
  console.error('[AnthropicAI] disambiguateCrisisContext API failed — defaulting to true (potential crisis):', err)
  return true  // ALWAYS default to crisis on API failure — false positive is safer than false negative
}
```

Update `providers.ts`: `resolveAiProvider()` returns `AnthropicAiProvider` when key is set.

---

### PHASE 14 — Retell AI Agent Setup

**Dashboard configuration (walk user through each step — confirm each is done before proceeding):**
1. Create agent: "Aria — Thrive@Home Daily Check-In"
2. Voice: warm, natural female — test by calling your own phone before continuing
3. Silence threshold: increase for senior pace (minimum 1.5 seconds between turns)
4. Max call duration: 1200 seconds
5. Enable call recording
6. Copy Agent ID → add `RETELL_AGENT_ID` to `.env.local`

**`/lib/ai/checkInPrompt.ts`:** `generateSystemPrompt(member: Member, priorSummaries?: string[]): string`

Required instructions in every generated prompt:
1. Introduce as "Aria from Thrive@Home" — warm, unhurried
2. Use `preferred_name` as literal text injected into the prompt
3. Reference 2–3 items from `topics_enjoy` naturally (not as a list)
4. Cover organically: mood, energy, comfort/pain, sleep, medications, appetite, social plans
5. Forbidden words: patient, vitals, symptoms, assessment, diagnosis
6. Never ask the same question twice
7. Wait at least 5 seconds if senior is slow to respond
8. End every call: "Is there anything else on your mind today?" + warm goodbye
9. Crisis instruction — verbatim, do not paraphrase:
```
If the person says anything suggesting thoughts of self-harm, hopelessness, or not wanting
to be alive: "I hear you, and I want you to know that what you're feeling matters. Someone
from our care team will be reaching out to you personally today. Is there anything else on
your mind before we wrap up?" Allow them to continue. Never end the call abruptly.
```
10. Language: if `preferred_language !== 'english'` — conduct the entire call in that language, never switch

Prompt must be under 2000 tokens. Trim prior summaries to fit if needed.

**Real test call required before Phase 14 is approved:** Call your own phone using the agent with the generated prompt. Confirm: correct name used, interest mentioned, "I've been feeling really down" handled warmly.

---

### PHASE 15 — Twilio & Retell Call Infrastructure

Install: `npm install twilio`

Create `/lib/services/RetellCallProvider.ts` implementing `CallProvider`:

```ts
async scheduleCall(memberId: string, phone: string, context: CallContext): Promise<string> {
  // Validate E.164 format before hitting the API
  if (!/^\+[1-9]\d{1,14}$/.test(phone)) {
    throw new Error(`Invalid phone format for member ${memberId}. Expected E.164 (+15551234567).`)
  }
  console.log(`[RetellCallProvider] Scheduling call for member ${memberId}`)
  // Never log the phone number — privacy

  const response = await fetch('https://api.retellai.com/v2/create-phone-call', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${requireServerEnv('RETELL_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from_number: requireServerEnv('TWILIO_PHONE_NUMBER'),
      to_number: phone,
      agent_id: requireServerEnv('RETELL_AGENT_ID'),
      retell_llm_dynamic_variables: context,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(
      response.status === 401 ? 'RETELL_API_KEY is invalid. Check environment variables.' :
      response.status === 422 ? `Invalid parameters (phone format or agent ID): ${body}` :
      `Retell API error ${response.status}: ${body}`
    )
  }

  const data = await response.json()
  if (!data.call_id) throw new Error(`Retell response missing call_id: ${JSON.stringify(data)}`)

  console.log(`[RetellCallProvider] Call ${data.call_id} initiated for member ${memberId}`)
  return data.call_id
}
```

Create `/lib/services/TwilioSmsProvider.ts` (implementation of `SmsProvider` — used in Layer 3, built here so it exists in the codebase).

Update `providers.ts`: `resolveCallProvider()` activates `RetellCallProvider` when both Retell and Twilio keys are set.

---

### PHASE 16 — Outbound Call Scheduler

**Cron endpoint at `/app/api/cron/daily-calls/route.ts`:**
```ts
// Verify CRON_SECRET on every request — reject anything without it
if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
}
```

In `vercel.json`:
```json
{
  "crons": [
    { "path": "/api/cron/daily-calls", "schedule": "0 * * * *" },
    { "path": "/api/cron/missed-calls", "schedule": "0 * * * *" },
    { "path": "/api/cron/medication-reminders", "schedule": "*/30 * * * *" }
  ]
}
```

**Deduplication — use `.maybeSingle()` not `.single()`:**
```ts
const { data: existing } = await adminSupabase
  .from('check_in_calls')
  .select('id')
  .eq('member_id', member.id)
  .in('status', ['scheduled', 'in_progress', 'completed'])
  .gte('scheduled_at', todayStart.toISOString())
  .lte('scheduled_at', todayEnd.toISOString())
  .maybeSingle()

if (existing) { skippedCount++; continue }
```

Log counts at end of every run: `${scheduled} scheduled, ${skipped} skipped, ${failed} failed`.

---

### PHASE 17 — Call Webhook & Transcript Processing

**Webhook at `/app/api/webhooks/retell/route.ts`:**

Security first, before any other logic:
```ts
if (request.headers.get('Authorization') !== `Bearer ${process.env.RETELL_WEBHOOK_SECRET}`) {
  console.error('[webhook/retell] Rejected — invalid Authorization header')
  return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
}
```

Return 200 immediately. Process asynchronously:
```ts
const response = NextResponse.json({ received: true }, { status: 200 })
processCallAfterWebhook(callId, payload).catch(err =>
  console.error(`[webhook/retell] Background processing failed for call ${callId}:`, err)
)
return response
```

**`/lib/ai/processTranscript.ts`:** Processing step order is mandatory:

1. Crisis detection — FIRST, always (see Section 4.10)
2. Parse speaker turns — only analyse senior speech
3. Score extraction via `aiProvider.extractCallScores(seniorSpeechOnly)`
4. Summary generation via `aiProvider.generateCallSummary(fullTranscript)`
5. Update `check_in_calls` with scores, summary, status → `completed`
6. Create alerts via `createCallAlerts()`
7. Push Realtime notification: `call_summary_ready` (dashboard refreshes automatically)
8. Notify via `smsProvider` and `emailProvider` (stubs until Layer 3)

**Speaker turn parsing:**
```ts
function parseSeniorSpeech(transcript: string): string {
  return transcript.split('\n')
    .filter(line => line.trim() && !line.startsWith('Aria:'))
    .map(line => line.replace(/^[^:]+:\s*/, '').trim())
    .join(' ')
}
```

Score rules: `null` for any topic not discussed — never `0`. Log every extracted score with the triggering phrase.

---

### LAYER 2 GATE

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ LAYER 2 COMPLETE — AI CALLS LIVE, AWAITING YOUR APPROVAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

What works right now:
• Real AI calls are made to seniors daily via Retell AI + Twilio
• Transcripts are processed by Claude into mood scores and summaries
• The family dashboard shows real data from real calls
• Alerts fire from real call content
• New call summaries push instantly to the dashboard via Realtime
• Crisis language is detected — alert, navigator task, and Realtime
  notification are created. SMS/email escalation is still stub-logged.

What Layer 3 adds: real SMS (Twilio) and email (SendGrid) notifications
to families after every call and for crisis escalation.
Required: TWILIO_ACCOUNT_SID is already set. Need SENDGRID_API_KEY,
SENDGRID_FROM_EMAIL, and ONCALL_NAVIGATOR_PHONE.

Reply APPROVED to begin Layer 3, or ISSUE: [description].
```

---

## ═══════════════ LAYER 3 — OUTBOUND NOTIFICATIONS ═══════════════

*Goal: Real SMS and email notifications. Families receive updates on their phone and in their inbox. Crisis escalation is fully live.*

---

### PHASE 18 — Twilio SMS Provider

`TWILIO_ACCOUNT_SID` already in `.env.local` from Phase 15. Confirm `ONCALL_NAVIGATOR_PHONE` is also set.

Create the real implementation of `/lib/services/TwilioSmsProvider.ts` (the file was created as a placeholder in Phase 15 — implement it now).

**Post-call SMS format:**
```
Thrive@Home update for [Name] 💚
Today: [emoji] Mood [X]/10 | Meds [✓/✗]
"[1–2 sentence AI summary excerpt]"
[If urgent+ alert: ⚠️ Note: [plain-English alert description]]
See full update: [dashboard URL]
Reply STOP to unsubscribe
```

`sendUrgent()` — sends regardless of notification preferences. Never suppressed. Used for emergency alerts.

Every send attempt (success or failure): log to `notification_log` table with channel `sms`, status `sent` or `failed`, message preview (first 200 chars), error message if failed.

Update `providers.ts`: `resolveSmsProvider()` returns `TwilioSmsProvider` when `TWILIO_ACCOUNT_SID` is set.

---

### PHASE 19 — SendGrid Email Provider

Confirm `SENDGRID_API_KEY` and `SENDGRID_FROM_EMAIL` are in `.env.local`.

Install: `npm install @sendgrid/mail`

Create `/lib/services/SendGridEmailProvider.ts` implementing `EmailProvider`.

**Email template rules (apply to all emails):**
- All CSS inline — no `<style>` tags, no `class` attributes (email clients strip them)
- Max width 600px, centered
- All URLs absolute
- Test in Gmail before approval

Post-call email structure:
- Navy header: "Check-in update for [Name]"
- Score bars (inline HTML): mood, energy, comfort — proportional width, colour-coded
- Full AI summary in large text
- Alert box (amber → urgent, red → emergency) — omit if no alerts
- "View Full Dashboard" CTA — navy background, white text, rounded, inline styles
- Footer with unsubscribe link

Subject: `Aria checked in with [Name] — [emoji] [one-line status]`

Update `providers.ts`: `resolveEmailProvider()` activates when key is set.

---

### PHASE 20 — Post-Call Notification Pipeline

Wire real notifications into `processCallTranscript`:

```ts
// After all processing is complete
const { data: familyMembers } = await getFamilyMembers(call.member_id)
for (const fm of familyMembers ?? []) {
  // SMS — respects notification_prefs.sms
  if (fm.notification_prefs?.sms && fm.phone) {
    await smsProvider.send(fm.phone, buildPostCallSms(call, summary))
  }
  // Email — respects notification_prefs.email
  if (fm.notification_prefs?.email && fm.email) {
    await emailProvider.sendPostCallSummary(fm.email, buildPostCallEmailData(call, summary))
  }
  // Realtime — always (already wired in Phase 9)
}
```

Crisis escalation (from `crisisDetection.ts`) now sends real SMS via `smsProvider.sendUrgent()` and real email via `emailProvider.sendAlert()`.

---

### PHASE 21 — Medication Reminders

Cron at `/app/api/cron/medication-reminders/route.ts` — 30-minute window matching using member timezone.

SMS: `"Hi [Name], just a friendly reminder to take your medications 💊 — Aria from Thrive@Home"`

Missed medication: 3 consecutive `medication_taken = false` calls → `concern` alert + navigator task + Realtime notification. Deduplicated.

---

### PHASE 22 — Wellness Drift (Fully Live)

`checkWellnessDrift` (built in Phase 10 with stubs) now sends real SMS and email via connected providers for `urgent` and `emergency` drift alerts. Confirm provider calls produce real notifications.

---

### PHASE 23 — Call History Page

`/app/dashboard/history/page.tsx`:
- All completed calls, newest first
- Load-more pagination: 20 per page, `loadMore()` appends (no page reload)
- Each row: date, time, `MoodEmoji`, medication ✓/✗, alert flag `Badge` icons
- Expandable row: full AI summary, all scores, flags in plain English
- Empty state: "Aria will call [Name] tomorrow at [time]"

---

### LAYER 3 GATE

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ LAYER 3 COMPLETE — FULL PRODUCT LIVE, AWAITING YOUR APPROVAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The product is now fully functional end-to-end:
• Real AI calls made daily to seniors
• Families notified via Realtime (instant, in browser)
• Families notified via SMS within 5 minutes of each call
• Families notified via email within 30 minutes of each call
• Crisis language → real SMS to all family members and navigator
• Medication reminders fire on schedule
• Wellness drift detects declining trends and alerts proactively

Before adding billing, you should:
• Have at least 5 real test users through the complete flow
• Confirm SMS and email are arriving correctly
• Confirm Realtime notifications appear without page refresh

What Layer 4 adds: Stripe billing. The product already works without
it — billing is layered on top of a working product.

Reply APPROVED to begin Layer 4, or ISSUE: [description].
```

---

## ═══════════════ LAYER 4 — BILLING ═══════════════

*Goal: Stripe subscription billing added as a feature. The product is already fully functional before this layer.*

---

### PHASE 24 — Pricing Page (Static)

`/app/pricing/page.tsx` — static plan cards that will become functional in Phase 26.

| Plan | Price | Key features |
|------|-------|-------------|
| Thrive Basics | $19/mo | Daily check-ins, medication reminders, family updates, SOS |
| Thrive Connect | $39/mo | Basics + volunteer connections, virtual events, grief support |
| Thrive Complete | $69/mo | Connect + care navigator 2hr/mo, skill exchange, monitoring |
| Thrive Premier | $129/mo | Complete + dedicated navigator 8hr/mo, $50 companion credits |

Each card: name, price, feature list, "Get started" button (static for now). Note: "Start with any plan. Upgrade anytime. No contracts."

---

### PHASE 25 — Stripe Products & Config

Install: `npm install stripe`

**Walk user through Stripe dashboard step by step:**
1. Create 4 products with monthly recurring prices
2. Enable Customer Portal (self-serve plan changes and cancellations)
3. Register webhook endpoint: `https://your-app.vercel.app/api/webhooks/stripe`
4. Select events: `checkout.session.completed`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`
5. Copy webhook signing secret → add `STRIPE_WEBHOOK_SECRET` to `.env.local` and Vercel
6. Copy each price ID → add `STRIPE_PRICE_ID_*` variables

Create `/lib/stripe/config.ts` (price IDs from env vars, never hardcoded). Create `/lib/stripe/client.ts` (server-only, `requireServerEnv`). Create `/lib/services/StripeBillingProvider.ts` implementing `BillingProvider`.

Update `providers.ts`: `resolveBillingProvider()` activates when `STRIPE_SECRET_KEY` is set.

**Use test keys (`sk_test_`, `pk_test_`) for all of Layer 4.**

---

### PHASE 26 — Plan Selection in Onboarding

Add Step 4 to the onboarding form: plan selection. Display the four plan cards from Phase 24. On form submission:
1. Create the member (unchanged from Phase 6)
2. Create Stripe Customer for the family member's email
3. Create Stripe Checkout session
4. Redirect to Stripe
5. On Stripe success redirect, the webhook (Phase 27) creates the `subscriptions` row

Members enrolled in Layers 1–3 (defaulted to `plan_tier = 'basics'`) see a plan upgrade prompt on their next login.

---

### PHASE 27 — Checkout Flow & Stripe Webhook

**Checkout API at `/app/api/billing/checkout/route.ts`:**
```ts
const session = await stripe.checkout.sessions.create({
  customer: stripeCustomerId,
  mode: 'subscription',
  line_items: [{ price: priceId, quantity: 1 }],
  success_url: `${requireServerEnv('NEXT_PUBLIC_APP_URL')}/dashboard?subscribed=true&session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${requireServerEnv('NEXT_PUBLIC_APP_URL')}/pricing`,
  metadata: { memberId, familyMemberId, planTier },
  subscription_data: { metadata: { memberId, familyMemberId } },
})
```

**Webhook at `/app/api/webhooks/stripe/route.ts`:**

Raw body required for signature verification — use `request.text()` not `request.json()`:
```ts
const rawBody = await request.text()  // MUST be text, not json
try {
  event = stripe.webhooks.constructEvent(rawBody, signature!, webhookSecret)
} catch (err) {
  return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
}

// Return 200 even on handler failure — non-200 causes Stripe to retry indefinitely
try {
  await handleStripeEvent(event)
  return NextResponse.json({ received: true })
} catch (err) {
  console.error(`[webhook/stripe] Handler failed for ${event.type}:`, err)
  return NextResponse.json({ received: true, error: 'Logged' })
}
```

Event handlers:
- `checkout.session.completed` → create `subscriptions` row, update `members.plan_tier`, send welcome email, push Realtime notification
- `invoice.payment_succeeded` → update subscription status and dates
- `invoice.payment_failed` → status `past_due`, send payment failure email
- `customer.subscription.updated` → update plan tier and status
- `customer.subscription.deleted` → `cancelled`, mark member inactive after grace period

---

### PHASE 28 — Billing Management Page

`/app/dashboard/billing/page.tsx`:
- Current plan name, price, next billing date
- "Change plan", "Update payment method", "Cancel subscription" — all open Stripe Customer Portal
- Last 6 invoices: date, amount, status, PDF download link

---

### PHASE 29 — Accessibility & Compliance Audit

**Run before marking Layer 4 complete:**

```bash
npx axe-cli https://your-app.vercel.app --tags wcag2aa
npx axe-cli https://your-app.vercel.app/dashboard --tags wcag2aa
npx axe-cli https://your-app.vercel.app/onboarding --tags wcag2aa
npx axe-cli https://your-app.vercel.app/login --tags wcag2aa
```

Zero WCAG 2.1 AA violations required. Fix every violation before marking this phase complete.

**The 65+ usability test:** Find a real person aged 65 or older. Ask them to complete the onboarding form and view the dashboard without help. Document every point of confusion and fix each one before Layer 4 gate.

---

### LAYER 4 GATE — Before Switching to Live Stripe Keys

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ LAYER 4 COMPLETE — BILLING CONNECTED, READY FOR FINAL REVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  BEFORE SWITCHING FROM STRIPE TEST KEYS TO LIVE KEYS:

Required:
□ At least 5 test users through the complete call + notification flow
□ Test Stripe payment succeeded end-to-end (card 4242 4242 4242 4242)
□ All HIPAA BAAs signed: Supabase, Twilio, Retell AI, Anthropic, SendGrid
□ axe-cli shows zero WCAG 2.1 AA violations on all pages
□ Real person aged 65+ completed onboarding without assistance

DO NOT switch to live Stripe keys until every item above is confirmed.

Reply APPROVED to switch to live keys, or ISSUE: [description].
```

---

## SECTION 6 — Adding Features After Layer 4

For every new feature that requires an external service:

1. Define its interface in `/lib/interfaces/NewProvider.ts`
2. Build a stub in `/lib/stubs/StubNewProvider.ts` (logs what it would do)
3. Add it to `/lib/providers.ts` — stub by default, real when env var is set
4. Build the full feature using the interface — works immediately with the stub
5. Build the real implementation in `/lib/services/RealNewProvider.ts`
6. Add the env var to `.env.local` and Vercel — real service activates automatically

The application code never needs to change when switching stub to real. Only the service implementation file and `providers.ts` change.

This pattern applies to every service in Milestones 11–13:
- **Checkr** (volunteer background checks)
- **Stripe Connect** (companion marketplace payouts)
- **Language Line** (multilingual concierge phone support)
- **Any new AI model** (the `AiProvider` interface abstracts the model — swap Anthropic for anything else by writing a new implementation)

Each feature in Milestones 11–13 must also use the Supabase Realtime pattern for in-app notifications before adding SMS or email notifications for that feature.

---

## SECTION 7 — Accessibility Standards (Apply to All Phases)

These are not review items — they are build requirements enforced in every phase:

- Body text: `text-lg` (18px) minimum everywhere — never smaller
- Buttons and interactive elements: `min-h-[52px]` (touch-friendly)
- Colour contrast: ≥ 4.5:1 for all text
- Form fields: visible label above field — never placeholder text as the only label
- All interactive elements: reachable and operable via keyboard Tab navigation
- Error messages: visible, specific, positioned near the field that failed
- All pages: server-side title via Next.js `metadata` export
- Images: `alt` text on every `<Image>` component

Run `npx axe-cli [URL] --tags wcag2aa` before every layer gate. Zero violations is the bar.

---

## SECTION 8 — HIPAA (Start Now, Required Before Real Members)

Begin BAA (Business Associate Agreement) outreach with these vendors immediately — it takes 2–4 weeks per vendor. Do not enrol any real member until all five are signed:

| Vendor | How to get a BAA |
|--------|-----------------|
| Supabase | Requires Pro plan ($25/mo). Dashboard → Settings → Organization → HIPAA |
| Twilio | twilio.com/hipaa — contact compliance team |
| Retell AI | Contact directly — **verify they can sign a BAA before Phase 15** |
| Anthropic | Anthropic enterprise sales at anthropic.com |
| SendGrid | Covered under Twilio's BAA or contact separately |

Retell AI BAA is the highest risk item. If they cannot sign a HIPAA BAA, evaluate Bland AI or a self-hosted voice AI alternative before investing in Phase 14.
