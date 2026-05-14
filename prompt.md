# Thrive@Home — AI Agent Build Prompt (v3.0)

> **Read this entire file at the start of every session before writing a single line of code.**
> This file defines how you must behave, how you must write code, and the exact instructions for every layer and phase.
> If any instruction here conflicts with something you think is faster or easier, follow this file.

---

## SECTION 1 — Core Rules (Non-Negotiable)

These rules apply to every phase, every file, every line of code. They are not guidelines. Violating any of them is a build error that must be fixed before proceeding.

---

### Rule 1 — Human approval is required before every phase transition

This is the most important rule. It has no exceptions.

When you believe a phase is complete:

1. Stop writing code immediately
2. Run every test for that phase defined in `tests.md`
3. Present results in this exact format — do not deviate:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ PHASE [N] — [PHASE NAME] — COMPLETE, AWAITING YOUR APPROVAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

What was built:
• [every file created, with full path]
• [every file modified, with what changed]
• [every database table/column created or altered]
• [every external service configured]
• [every npm package installed]

Tests run:
• [Test ID from tests.md]: PASSED — [one sentence: what was verified]
• [Test ID]: FAILED — [exact failure: observed vs expected]

What to check right now:
• [specific URL, Supabase table, or terminal output — be precise]
• [another specific item]

Please verify the items above, then reply:
  APPROVED — I will immediately begin Phase [N+1]
  ISSUE: [describe exactly what you see] — I will investigate and fix before asking again
```

4. Wait. Do not begin Phase N+1. Do not write "preparatory" code. Do not ask if you should proceed. Wait for the user's explicit reply.

5. If APPROVED: update `checklist.md` to mark Phase N as `[x]`, append a session entry to `progress.md`, begin Phase N+1.

6. If ISSUE: fix the problem, re-run affected tests, present the same review format again. Do not advance until the user replies APPROVED.

7. If the reply is ambiguous: ask "Should I proceed to Phase [N+1], or is there something to fix first?" Do not assume approval.

**No exceptions.** Not for "simple" phases. Not when you are confident. Not when phases are closely related. Every phase. Every time.

---

### Rule 2 — Never claim success without proof

A phase that compiles is not complete. A function that exists is not correct. Code that looks right is not tested. The test in `tests.md` is the only acceptable proof. If a test cannot run because a service is not configured, stop and tell the user exactly which environment variable is missing and where to find it. Do not skip the test. Do not work around it.

---

### Rule 3 — Never assume environment variables are set

Before any code calling an external service, check the variable exists. Use `/lib/env.ts`:

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
      `[Security] "${name}" is server-only but was accessed in the browser. ` +
      `Move this call to a Server Component, API Route, or Server Action.`
    )
  }
  return requireEnv(name)
}
```

Never use `!` non-null assertions on `process.env` values. Never use `?? 'placeholder'` or `?? ''` fallbacks.

---

### Rule 4 — Never swallow errors

Every `try/catch` must log the full error object (not just `e.message`). Every API response status must be checked before using the body. Every Supabase result must be checked for both `null` and `error`.

```ts
// WRONG
try { return await doSomething() } catch { return null }

// RIGHT
try {
  return await doSomething()
} catch (e) {
  console.error('[moduleName/functionName] Failed:', e)
  throw new Error(`[moduleName/functionName] Failed: ${e instanceof Error ? e.message : String(e)}`)
}
```

Never return empty data and let the app silently appear to work.

---

### Rule 5 — Never hardcode secrets

No API key, auth token, webhook secret, connection string, phone number, or email address as a string literal in any `.ts` or `.tsx` file. If it looks like a key, it goes in `.env.local`. Specific prohibitions: no Supabase keys, Stripe keys, Twilio credentials, Retell AI keys, Anthropic keys, SendGrid keys, Checkr keys, Lyft keys, phone numbers, or email addresses as string literals.

---

### Rule 6 — Never let secrets reach GitHub

`.gitignore` must exclude all `.env*` files before the first `git push`. After creating `.gitignore`:

```bash
echo "TEST=secret" > .env.local && git status
```

`.env.local` must appear under "Untracked files" only. If it appears under "Changes to be committed", fix `.gitignore` before any further work.

Before every commit, run:
```bash
# Check 1 — no .env files tracked
git ls-files | grep -E "^\.env"
# Expected: no output

# Check 2 — no secrets in staged diff
git diff --cached --name-only | xargs grep -l -E "(sk_live|sk_test|pk_live|pk_test|SG\.|AC[a-z0-9]{32}|whsec_|retell-|sk-ant-|checkr_)" 2>/dev/null
# Expected: no output
```

If a secret is accidentally committed: revoke it at the service dashboard immediately, then purge git history.

---

### Rule 7 — One phase at a time

Read the current phase section in full. Build exactly what it describes — nothing more. Run its tests. Wait for APPROVED. Then start the next phase. Do not build features "for later." Do not refactor previous phases unless the current phase explicitly requires it.

---

### Rule 8 — When a session ends mid-phase

If a conversation ends before a phase is complete:
1. Append a `STATUS: IN_PROGRESS` entry to `progress.md`
2. List every file created/modified, every test run, every decision made
3. `NEXT SESSION MUST` field describes exactly where to resume — specific file, specific function, specific remaining step
4. Update `checklist.md` to mark phase as `[~]`

At the start of the next session: read `progress.md` fully, find the `[~]` phase, resume from the exact stopping point. Never restart a phase that was already in progress.

---

### Rule 9 — Write for a non-technical founder

Every file: one-line comment at top explaining its purpose in plain English. Every function: JSDoc comment. User-facing error messages: readable sentences, never error codes or stack traces.

Wrong: `Error: PGRST116 — JSON object requested, multiple (or no) rows returned`
Right: `We couldn't find your account. Please try signing in again.`

---

### Rule 10 — TypeScript strict mode, always

`tsconfig.json` must have `"strict": true`. No `any` types — use `unknown` and type guards. All function parameters and return types explicitly typed. Run `npx tsc --noEmit` before every phase review. Zero errors is the requirement.

---

### Rule 11 — No test data in production code paths

Test scripts and seed scripts live in `/scripts/` only. Never imported by `/app/`, `/lib/`, or `/components/`. All test rows inserted during a test script must be deleted at the end. Never leave test data in the database after a test run.

---

### Rule 12 — Security checks on every API route

Every route reading or modifying sensitive data must, in this exact order:
1. Verify authentication → `401` if no valid session
2. Verify authorisation → `403` if user lacks permission for this specific resource
3. Validate all inputs → `400` if required fields are missing or malformed
4. Return only the minimum data the caller needs

---

### Rule 13 — Build modular, service-agnostic architecture from day one

Every feature depending on an external paid service must be built behind a TypeScript interface. The product is built and tested with stub implementations first. Real services are plugged in as separate, later phases.

**The stub/interface/real pattern:**
```ts
// Interface — defines the contract
// /lib/interfaces/SmsProvider.ts
export interface SmsProvider {
  send(to: string, body: string): Promise<void>
  sendUrgent(to: string, body: string): Promise<void>
}

// Stub — logs what it would do, never throws, no side effects
// /lib/stubs/StubSmsProvider.ts
export class StubSmsProvider implements SmsProvider {
  async send(to: string, body: string) {
    console.log(`[StubSMS] Would send to ${to.substring(0,6)}...: "${body.substring(0,80)}..."`)
  }
  async sendUrgent(to: string, body: string) {
    console.log(`[StubSMS] URGENT — Would send to ${to.substring(0,6)}...: "${body.substring(0,80)}..."`)
  }
}

// Real implementation — built in its service phase
// /lib/services/TwilioSmsProvider.ts
export class TwilioSmsProvider implements SmsProvider { /* ... */ }
```

`/lib/providers.ts` is the ONLY file that selects stub vs real. Application code imports from `providers.ts` only — never from `/lib/stubs/` or `/lib/services/` directly.

---

### Rule 14 — Supabase Realtime is the primary notification channel

Supabase Realtime is always built before SMS and email. Families and navigators see updates in the browser instantly from Phase 9 onward. SMS and email are enhancements layered on top in M10. Every new feature in M13–M17 must push a Realtime notification before adding any SMS or email for that feature.

---

### Rule 15 — Seed data is required before dashboard phases

`/scripts/seed-test-data.ts` must be built in Phase 7 and must be idempotent. It creates: test family member, test senior "Margaret Chen", 14 calls with realistic declining mood arc, 2 alerts, 2 notifications, navigator assignments, 3 tasks. Prints login credentials. Companion `/scripts/clear-test-data.ts` removes all seeded rows.

---

### Rule 16 — Services Marketplace uses the same modular pattern

Every service integration in M17 (transport, meals, health, legal, tech) must follow the interface/stub/real pattern. Stubs log what would be dispatched. Real integrations (Lyft Healthcare, Instacart, Teladoc, etc.) activate when their env var is set. The booking flow and UI work completely with stubs — never blocked waiting for a commercial API agreement.

---

### Rule 17 — Grief and crisis features never fail silently

The grief support care team notification (Phase 48) and crisis escalation (Phase 11) are patient-safety-critical. If any notification fails: log the error AND retry once after 30 seconds AND log the retry result. If the retry also fails: create a `critical` priority navigator task so a human investigates. Never silently drop a grief or crisis notification.

---

### Rule 18 — Physical goods and external fulfillment use stub pattern

All physical goods fulfillment (Artifact Uprising, 1-800-Flowers, Moonpig — Phase 47) and all marketplace integrations (Lyft Healthcare, Instacart, Teladoc, etc. — Phases 50–56) use the interface/stub/real pattern. Stubs log what would be ordered or dispatched. The booking flow, UI, and data recording work fully in stub mode.

---

## SECTION 2 — Secrets Management

### 2.1 — `.gitignore` (create in Phase 1, before any other file or commit)

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

### 2.2 — `.env.local.example` (committed to GitHub — values always empty)

```bash
# THRIVE@HOME — Environment Variables
# Copy to .env.local and fill in real values.
# .env.local is gitignored and will NEVER be committed.

# --- CORE ---
NEXT_PUBLIC_APP_URL=
CARE_TEAM_EMAIL=
CRON_SECRET=

# --- SUPABASE (Phase 2) ---
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# --- ANTHROPIC (Phase 17) ---
ANTHROPIC_API_KEY=

# --- RETELL AI (Phase 18) ---
RETELL_API_KEY=
RETELL_AGENT_ID=
RETELL_WEBHOOK_SECRET=
RETELL_CONCIERGE_AGENT_ID=

# --- TWILIO (Phase 19) ---
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
TWILIO_CONCIERGE_NUMBER=
ONCALL_NAVIGATOR_PHONE=

# --- SENDGRID (Phase 22) ---
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=

# --- STRIPE (Phase 24) ---
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID_BASICS=
STRIPE_PRICE_ID_CONNECT=
STRIPE_PRICE_ID_COMPLETE=
STRIPE_PRICE_ID_PREMIER=

# --- CHECKR (Phase 30) ---
CHECKR_API_KEY=
CHECKR_WEBHOOK_SECRET=

# --- LANGUAGE LINE (Phase 20) ---
LANGUAGE_LINE_ACCOUNT_NUMBER=
LANGUAGE_LINE_SIP_ENDPOINT=

# --- SERVICES MARKETPLACE (Phase 50+) ---
LYFT_HEALTHCARE_API_KEY=
INSTACART_API_KEY=
TELADOC_API_KEY=
ARTIFACT_UPRISING_API_KEY=
ONE800FLOWERS_API_KEY=
```

### 2.3 — Server-only vs browser-safe variables

Only three variables should ever be `NEXT_PUBLIC_`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`

All service credentials use `requireServerEnv()`. Never add credentials with `NEXT_PUBLIC_` prefix.

### 2.4 — Pre-commit secret check (run before every commit)

```bash
git ls-files | grep -E "^\.env"
git diff --cached --name-only | xargs grep -l -E "(sk_live|sk_test|pk_live|pk_test|SG\.|AC[a-z0-9]{32}|whsec_|retell-|sk-ant-|checkr_)" 2>/dev/null
```
Both must produce no output. If either does, stop and fix before committing.

---

## SECTION 3 — Project Architecture

### 3.1 — Folder structure

```
/app
  /api
    /cron              Scheduled endpoints (CRON_SECRET required)
    /webhooks          Retell AI, Stripe, Checkr incoming webhooks
    /billing           Stripe checkout routes
    /calls             Call scheduling routes
    /concierge         Concierge line triage routes
    /services          Service booking routes
  /dashboard           Family member pages
    /family            Family coordination tools (tasks, messages, care planning)
    /services          Services marketplace
    /documents         Document vault
    /life-story        Life story archive
    /grief-support     Grief & transitions
    /resources         Tech safety, tutorials
  /navigator           Care navigator pages
  /admin               Admin pages (providers, volunteers, employers, events)
  /volunteer           Volunteer portal (all types)
  /student             Student portal
  /university-admin    University admin portal
  /employer-admin      Employer admin portal
  /onboarding          Member enrollment (4 steps including plan selection in Phase 25)
  /login  /signup  /pricing  /privacy  /outcomes  /employers

/components
  /ui                  Button, Card, Badge, Input, Select, Skeleton, StatusDot,
                       MoodEmoji, NotificationBell, Toast, Modal, Tabs, ProgressBar
  /dashboard           Dashboard-specific components
  /onboarding          Form step components
  /navigator           Navigator console components
  /services            Services marketplace components
  /volunteer           Volunteer portal components
  /shared              Reused across multiple sections

/lib
  /supabase            client.ts, server.ts, admin.ts
  /interfaces          All service interfaces (never changed after Phase 1)
  /stubs               Stub implementations (active by default)
  /services            Real implementations (activated by env vars)
  /providers.ts        THE ONE FILE that selects stub vs real
  /data                All Supabase query functions
  /alerts              Alert detection, creation, deduplication, escalation
  /realtime            Supabase Realtime push and subscription helpers
  /ai                  Prompt generation and transcript processing
  /env.ts              requireEnv, requireServerEnv
  /auth.ts             Auth helpers
  /benefits            Benefits finder static data
  /volunteers          Volunteer matching scoring
  /celebrations        Celebration Calendar Engine
  /grief               Grief monitoring and pathway logic
  /marketplace         Service booking and provider matching logic

/types                 TypeScript types — never contains implementation code
/scripts               Test, seed, clear scripts — never imported by app
/supabase/migrations   SQL files — single source of truth for schema
```

### 3.2 — Service interfaces (defined in Phase 1, never modified after)

```ts
// /lib/interfaces/CallProvider.ts
export interface CallContext {
  preferredName: string; interests: string[]
  priorCallSummaries: string[]; preferredLanguage: string
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
  seniorName: string; summary: string; scores: CallScores
  hasAlerts: boolean; alertMessage?: string; dashboardUrl: string
}
export interface EmailProvider {
  sendPostCallSummary(to: string, data: PostCallEmailData): Promise<void>
  sendAlert(to: string, memberName: string, alertMessage: string): Promise<void>
  sendPaymentFailed(to: string, memberName: string, updateUrl: string): Promise<void>
  sendWelcome(to: string, memberName: string): Promise<void>
  sendGriefSupportNotification(careTeamEmail: string, memberName: string, details: string): Promise<void>
  sendWeeklyDigest(to: string, memberName: string, digestContent: string): Promise<void>
  sendMonthlySummary(to: string, memberName: string, summaryContent: string): Promise<void>
}

// /lib/interfaces/AiProvider.ts
export interface CallScores {
  mood_score: number | null; energy_score: number | null
  pain_score: number | null; medication_taken: boolean | null; alert_flags: string[]
}
export interface AiProvider {
  generateCallSummary(transcript: string): Promise<string | null>
  extractCallScores(seniorSpeechOnly: string): Promise<CallScores>
  generateNavigatorBrief(memberId: string, recentSummaries: string[]): Promise<string>
  generateCarePlan(member: Member, calls: CheckInCall[]): Promise<CarePlan>
  disambiguateCrisisContext(phrase: string, context: string): Promise<boolean>
  generateWeeklyDigest(member: Member, calls: CheckInCall[]): Promise<string>
  generateMonthlySummary(member: Member, calls: CheckInCall[]): Promise<string>
  generateCelebrationPersonalisation(member: Member, celebrationType: string): Promise<string>
  generateConciergeTriage(transcript: string): Promise<ConciergeTriage>
}

// /lib/interfaces/BillingProvider.ts
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

### 3.3 — The providers file

```ts
// /lib/providers.ts
// Selects stub vs real for every external service.
// APPLICATION CODE IMPORTS FROM HERE ONLY.
// When a real service is added: only this file and the new service file change.

import { StubCallProvider }      from './stubs/StubCallProvider'
import { StubSmsProvider }       from './stubs/StubSmsProvider'
import { StubEmailProvider }     from './stubs/StubEmailProvider'
import { StubAiProvider }        from './stubs/StubAiProvider'
import { StubBillingProvider }   from './stubs/StubBillingProvider'
import { StubTransportProvider } from './stubs/StubTransportProvider'
import { StubMealProvider }      from './stubs/StubMealProvider'
import { StubGoodsProvider }     from './stubs/StubGoodsProvider'

function resolveAiProvider() {
  if (process.env.ANTHROPIC_API_KEY) {
    return new (require('./services/AnthropicAiProvider').AnthropicAiProvider)()
  }
  return new StubAiProvider()
}
function resolveCallProvider() {
  if (process.env.RETELL_API_KEY && process.env.TWILIO_ACCOUNT_SID) {
    return new (require('./services/RetellCallProvider').RetellCallProvider)()
  }
  return new StubCallProvider()
}
function resolveSmsProvider() {
  if (process.env.TWILIO_ACCOUNT_SID) {
    return new (require('./services/TwilioSmsProvider').TwilioSmsProvider)()
  }
  return new StubSmsProvider()
}
function resolveEmailProvider() {
  if (process.env.SENDGRID_API_KEY) {
    return new (require('./services/SendGridEmailProvider').SendGridEmailProvider)()
  }
  return new StubEmailProvider()
}
function resolveBillingProvider() {
  if (process.env.STRIPE_SECRET_KEY) {
    return new (require('./services/StripeBillingProvider').StripeBillingProvider)()
  }
  return new StubBillingProvider()
}
function resolveTransportProvider() {
  if (process.env.LYFT_HEALTHCARE_API_KEY) {
    return new (require('./services/LyftTransportProvider').LyftTransportProvider)()
  }
  return new StubTransportProvider()
}
function resolveMealProvider() {
  if (process.env.INSTACART_API_KEY) {
    return new (require('./services/InstacartMealProvider').InstacartMealProvider)()
  }
  return new StubMealProvider()
}
function resolveGoodsProvider() {
  if (process.env.ONE800FLOWERS_API_KEY || process.env.ARTIFACT_UPRISING_API_KEY) {
    return new (require('./services/RealGoodsProvider').RealGoodsProvider)()
  }
  return new StubGoodsProvider()
}

export const aiProvider        = resolveAiProvider()
export const callProvider      = resolveCallProvider()
export const smsProvider       = resolveSmsProvider()
export const emailProvider     = resolveEmailProvider()
export const billingProvider   = resolveBillingProvider()
export const transportProvider = resolveTransportProvider()
export const mealProvider      = resolveMealProvider()
export const goodsProvider     = resolveGoodsProvider()
```

### 3.4 — Stub behaviour standard

Every stub: logs what it would have done, returns a plausible placeholder, never throws, never causes side effects. Include `[STUB]` in all log output.

```ts
// Example stub
export class StubTransportProvider implements TransportProvider {
  async bookRide(request: TransportBookingRequest) {
    console.log(`[StubTransport] Would book ride for member ${request.memberId} on ${request.requestedDate}`)
    return { bookingId: `stub-transport-${Date.now()}`, estimatedArrival: '15 minutes' }
  }
  async cancelRide(bookingId: string) {
    console.log(`[StubTransport] Would cancel ride ${bookingId}`)
  }
  async getRideStatus(bookingId: string) {
    console.log(`[StubTransport] Would get status for ride ${bookingId}`)
    return 'stub_confirmed'
  }
}
```

### 3.5 — Supabase Realtime pattern (always real, no stub needed)

```ts
// /lib/realtime/notifications.ts
export async function pushRealtimeNotification(notification: RealtimeNotification): Promise<void> {
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
    // Log but do not throw — notification failure must not crash the pipeline
    console.error('[realtime/pushNotification] Insert failed:', error)
  }
}
```

Every alert creation calls `pushRealtimeNotification`. Every call completion pushes `call_summary_ready`. Every grief support request pushes a notification to the navigator. Every service booking status change pushes a notification to the member.

---

## SECTION 4 — Build Order Overview

```
M1  Foundation         (Phases 1–4)   — App shell, DB, auth, RLS
M2  Member Data        (Phases 5–7)   — Enrollment, data layer, seed data
M3  UI System          (Phase 8)      — Component library
M4  Realtime           (Phase 9)      — Supabase Realtime notification system
M5  Alert Engine       (Phases 10–11) — All alert detection + crisis escalation
M6  Family Dashboard   (Phases 12–14) — Dashboard, health timeline, family tools
M7  Navigator Console  (Phases 15–16) — Caseload, AI briefing, digests
M8  AI Calls           (Phases 17–19) — Anthropic, Retell AI, call infrastructure
M9  Concierge Line     (Phase 20)     — 24/7 inbound triage + Language Line
M10 Notifications      (Phases 21–23) — SMS, email, medication reminders
M11 Billing            (Phases 24–26) — Stripe subscriptions
M12 Compliance         (Phases 27–28) — HIPAA, accessibility, SOC 2 pathway
M13 Volunteers         (Phases 29–36) — All 8 volunteer types, training, recognition
M14 Community          (Phases 37–44) — Events, interest groups, skills, circles, benefits
M15 Celebrations       (Phases 45–46) — Celebrations engine, life story archive
M16 Grief & Transition (Phases 47–49) — Physical goods, grief pathways, transitions
M17 Services Marketplace (Phases 50–56) — Transport, home, health, legal, meals, tech
M18 Enterprise         (Phases 57–61) — Outcomes, care plans, university, MA API, i18n
```

---

## SECTION 5 — Phase-by-Phase Build Instructions

---

## ═══ M1 — FOUNDATION ═══

### PHASE 1 — Project Scaffold

**Required before starting:** GitHub repo `thrive-at-home` (Private) created. Vercel connected to GitHub. Supabase project created and credentials saved. No other accounts needed yet.

1. Create project:
```bash
npx create-next-app@latest thrive-at-home --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
cd thrive-at-home
node --version  # Must be 18+. Stop and tell user if lower.
```

2. Create `.gitignore` FIRST (Section 2.1). Verify:
```bash
echo "TEST=secret" > .env.local && git status
# .env.local must appear under "Untracked files" ONLY
```

3. Create `.env.local.example` (Section 2.2). This IS committed.

4. Create `.env.local`:
```bash
cp .env.local.example .env.local
```
Fill in: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL=http://localhost:3000`, `CARE_TEAM_EMAIL`, `CRON_SECRET`. All service variables stay blank.

5. Tailwind brand tokens in `tailwind.config.ts`:
```ts
theme: {
  extend: {
    colors: {
      brand: { navy: '#1B3A6B', teal: '#2A9D8F', 'navy-light': '#2A5298', 'teal-light': '#3DBFB0', 'warm-white': '#FAFAF8' }
    },
    fontSize: { base: ['18px', '1.6'] }
  }
}
```

6. Create full folder structure (all paths in Section 3.1):
```bash
mkdir -p app/api/{cron,webhooks,billing,calls,concierge,services} \
  app/{dashboard/family,dashboard/services,dashboard/documents,dashboard/life-story,dashboard/grief-support,dashboard/resources} \
  app/{navigator,admin,volunteer,student,university-admin,employer-admin,onboarding,login,signup,pricing,privacy,outcomes,employers} \
  components/{ui,dashboard,onboarding,navigator,services,volunteer,shared} \
  lib/{supabase,interfaces,stubs,services,data,alerts,realtime,ai,env.ts,auth.ts,benefits,volunteers,celebrations,grief,marketplace} \
  types scripts supabase/migrations
find lib types scripts -type d -exec touch {}/.gitkeep \;
```

7. Create `/lib/env.ts` (exact content in Rule 3).

8. Create all service interfaces in `/lib/interfaces/` (exact content in Section 3.2):
`CallProvider.ts`, `SmsProvider.ts`, `EmailProvider.ts`, `AiProvider.ts`, `BillingProvider.ts`, `TransportProvider.ts`, `MealProvider.ts`, `GoodsProvider.ts`

9. Create all 8 stub implementations in `/lib/stubs/`:
`StubCallProvider.ts`, `StubSmsProvider.ts`, `StubEmailProvider.ts`, `StubAiProvider.ts`, `StubBillingProvider.ts`, `StubTransportProvider.ts`, `StubMealProvider.ts`, `StubGoodsProvider.ts`

Every stub method: log what it would do, return a sensible placeholder, never throw.

10. Create `/lib/providers.ts` (exact content in Section 3.3).

11. Create `/app/page.tsx` landing page with brand colours.

12. Commit and push. Import repo in Vercel. Deploy. Update `NEXT_PUBLIC_APP_URL` in Vercel and `.env.local` once URL is known.

**Error recovery:**
- `node --version` too low: tell user to install Node 18 LTS from nodejs.org
- `.env.local` appears as tracked: `.gitignore` is broken — fix before any commit
- Vercel build fails: read Vercel build log, fix TypeScript errors, push again

---

### PHASE 2 — Supabase Connection

Ask user for Supabase credentials. Add to `.env.local`.

Install: `npm install @supabase/supabase-js @supabase/ssr`

Create `/lib/supabase/client.ts` (browser, anon key, uses `requireEnv()`), `/lib/supabase/server.ts` (server, session cookies, uses `requireEnv()`), `/lib/supabase/admin.ts` (service role, uses `requireServerEnv()`, bypasses RLS, singleton pattern, never in Client Components).

Temporary test: create `connection_test` table in Supabase, insert a row, create `/app/test/page.tsx` that fetches and displays it. After passing: delete test page and table. Run `npx tsc --noEmit`.

**Error recovery:**
- Wrong URL: error says "Invalid URL" — copy fresh from Supabase dashboard
- Wrong anon key: Supabase returns 401 — get fresh copy
- Test page shows nothing: confirm the row was inserted in Supabase dashboard manually

---

### PHASE 3 — Database Schema

Write all SQL in `/supabase/migrations/001_initial_schema.sql` and `/supabase/migrations/002_audit.sql` BEFORE running anything in Supabase.

**Schema standards:** All PKs `uuid DEFAULT gen_random_uuid() PRIMARY KEY`. All timestamps `timestamptz DEFAULT now() NOT NULL`. All FKs `ON DELETE CASCADE`. Enums as PostgreSQL `TYPE` before tables. Arrays as `text[]`. JSON as `jsonb`. Phone numbers as `text`. Enum values `lowercase_with_underscores`.

**All tables** (see `ThriveAtHome_Build_Phases.md` Phase 3 for complete column specifications for all 43 tables).

**Indexes:**
```sql
CREATE INDEX idx_calls_member_scheduled   ON check_in_calls(member_id, scheduled_at DESC);
CREATE INDEX idx_alerts_member_unacked    ON alerts(member_id, acknowledged) WHERE acknowledged = false;
CREATE INDEX idx_family_auth_id           ON family_members(supabase_auth_id);
CREATE INDEX idx_nav_assignments_nav      ON navigator_assignments(navigator_id);
CREATE INDEX idx_realtime_notifs_member   ON realtime_notifications(member_id, read, created_at DESC);
CREATE INDEX idx_service_bookings_member  ON service_bookings(member_id, status);
CREATE INDEX idx_volunteer_matches_member ON volunteer_matches(member_id, status);
```

**Audit triggers** (`002_audit.sql`): on `members`, `check_in_calls`, `alerts`.

**Enable Supabase Realtime** for `realtime_notifications` INSERT events.

**Error recovery:**
- `ERROR: type "xyz" does not exist`: enum created after table that uses it — reorder SQL
- `ERROR: relation already exists`: add `IF NOT EXISTS` or drop first
- FK constraint violation on test insert: insert parent row first

---

### PHASE 4 — Row Level Security

Enable RLS on ALL tables before writing policies. A table with RLS enabled but no policies denies ALL access — confirm policies work before marking complete.

Policy pattern for family access:
```sql
CREATE POLICY "family_read_own_member" ON members FOR SELECT USING (
  EXISTS (SELECT 1 FROM family_members fm WHERE fm.member_id = members.id AND fm.supabase_auth_id = auth.uid())
);
```

Apply equivalent policies to: `check_in_calls`, `alerts`, `subscriptions`, `realtime_notifications` (SELECT + UPDATE for read), `family_task_items`, `family_messages`, `document_vault_items`, `life_story_entries`, `service_bookings` (own member's bookings only), `transport_bookings`.

Navigators: read only assigned members via `navigator_assignments`.
Admins: read all (service role key used in cron/webhook routes).

**Mandatory cross-user test:** Two users, two members, confirm cross-read returns empty array (not an error).

**Error recovery:**
- Own data blocked: `supabase_auth_id` not being set correctly on `family_members` — check signup handler
- Cross-user data visible: policy USING clause incorrect — add logging to trace `auth.uid()` value

---

## ═══ M2 — MEMBER DATA ═══

### PHASE 5 — Authentication

Middleware routing (all in `/middleware.ts`):

| Condition | Action |
|-----------|--------|
| Unauthenticated → `/dashboard/*`, `/navigator/*`, `/admin/*` | Redirect `/login` |
| `family` → `/navigator/*` or `/admin/*` | Redirect `/dashboard` |
| `navigator` → `/admin/*` | Redirect `/navigator` |
| Authenticated → `/login` or `/signup` | Redirect to role dashboard |
| Any → `/`, `/pricing`, `/privacy`, `/employers`, `/api/*` | Pass through |

Middleware refreshes session on every request.

Signup atomicity: if `family_members` insert fails, call `supabase.auth.admin.deleteUser(userId)` and show error. Never leave orphaned Auth user.

**Error recovery:**
- Infinite redirect loop: add `console.log('[middleware] path:', pathname, 'role:', role)` to trace
- Orphaned auth user: the rollback delete isn't executing — check error handling in signup

---

### PHASE 6 — Member Onboarding Form (3 Steps — No Billing Yet)

Three-step form. `plan_tier` defaults to `basics` server-side. Billing/plan selection added in Phase 25.

State: single object, `localStorage` on every change, cleared on success. Server-side validation before insert.

Validation rules: phone matches US or E.164 pattern; DOB in past, person ≥ 60 years old; language must be one of 13 supported; emergency contact 1 required.

Submission: Supabase RPC atomically creates `members` AND updates `family_members.member_id`. If either fails, neither is saved.

**Error recovery:**
- "undefined" on confirmation page: redirect happening before insert completes — await the RPC
- Form data lost on refresh: localStorage write is inside a useEffect with wrong dependency array

---

### PHASE 7 — App Data Layer & Seed Data

**Function contract (no exceptions):**
```ts
export async function getMember(id: string): Promise<{ data: Member | null; error: string | null }> {
  if (!id) return { data: null, error: 'ID is required' }
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('members').select('*').eq('id', id).single()
    if (error) { console.error('[getMember]', error); return { data: null, error: error.message } }
    return { data: data as Member, error: null }
  } catch (e) {
    console.error('[getMember] Unexpected error:', e)
    return { data: null, error: `Unexpected error: ${e instanceof Error ? e.message : String(e)}` }
  }
}
```

Functions: `members.ts`, `calls.ts`, `alerts.ts`, `family.ts`, `navigator.ts`, `notifications.ts`, `tasks.ts`, `lifeStory.ts`, `documents.ts`, `services.ts`, `volunteers.ts`

**Seed script** (`/scripts/seed-test-data.ts`): idempotent (checks by email before inserting). Creates Margaret Chen with 14 calls (mood: 8,8,7,8,7,6,7,6,5,6,5,5,4,5), 2 alerts, 2 notifications, assignments, 3 tasks. Prints credentials at end.

**Error recovery:**
- `PGRST116` from `.single()`: use `.maybeSingle()` for queries that might return no rows — return `null` not an error
- TypeScript errors: run `npx tsc --noEmit` before review — zero errors required

---

## ═══ M3 — UI SYSTEM ═══

### PHASE 8 — Primitive UI Components

Build all before any page. Pages depend on these.

All components: `className` prop, ARIA labels, keyboard navigation, 4.5:1 contrast minimum, brand colour tokens only (never hardcoded hex), minimum button height `min-h-[52px]`, minimum body text `text-lg` (18px).

`Button`: primary (navy fill), secondary (teal outline), danger (red), ghost. `loading` prop shows spinner, disables click.
`Card`: default/highlight (teal border)/warning (amber border)/danger (red border).
`Badge`: variants for alert severities, plan tiers, member status, booking status.
`Input`: visible label above field (never placeholder-only). Error message below field when invalid.
`Select`: same styling as Input.
`Skeleton`: animated grey pulse. Accepts `className` for sizing.
`StatusDot`: green (no alerts), amber (concern/informational), red (urgent/emergency).
`MoodEmoji`: ≥8→😊, ≥6→🙂, ≥4→😐, ≥2→😔, <2→😞, null→—. Colour: 7–10→green-700/green-50, 4–6→amber-700/amber-50, 1–3→red-700/red-50.
`NotificationBell`: live unread count from Realtime hook. Dropdown shows last 5. "Mark all read" button.
`Toast`: auto-dismiss (5 seconds), severity-coloured, stacks multiple toasts.
`Modal`: ARIA `role="dialog"`, `aria-modal="true"`, focus-trapped, Escape to close, focus returns to trigger.
`Tabs`: accessible tab panel with keyboard navigation.
`ProgressBar`: shows % complete with colour.

Temporary test page `/app/test-ui` — delete after approval.

---

## ═══ M4 — REALTIME NOTIFICATIONS ═══

### PHASE 9 — Supabase Realtime Notification System

`/lib/realtime/notifications.ts`: `pushRealtimeNotification(notification)` — admin client inserts to `realtime_notifications`. Logs on failure, never throws (notification failure must not crash the caller).

`/lib/realtime/useNotifications.ts`: hook subscribing to `postgres_changes` INSERT on `realtime_notifications` filtered by `member_id`. Returns `{ notifications, unreadCount, markRead, markAllRead }`.

```ts
export function useNotifications(memberId: string) {
  const supabase = createClient()
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([])

  useEffect(() => {
    getUnreadNotifications(memberId).then(({ data }) => { if (data) setNotifications(data) })
    const channel = supabase
      .channel(`notifications:${memberId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'realtime_notifications', filter: `member_id=eq.${memberId}` },
        (payload) => setNotifications(prev => [payload.new as RealtimeNotification, ...prev])
      ).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [memberId])

  return { notifications, unreadCount: notifications.filter(n => !n.read).length }
}
```

Notification types: `new_alert`, `call_completed`, `call_summary_ready`, `medication_reminder`, `system_message`, `service_booking_update`, `grief_support_assigned`, `family_nudge`, `celebration_upcoming`, `volunteer_matched`.

Wire: `createAlert()` always calls `pushRealtimeNotification()` after insert. `processCallTranscript()` pushes `call_summary_ready` after AI summary saved.

**Error recovery:**
- Notification not appearing: check Supabase dashboard → Replication → confirm `realtime_notifications` is enabled for INSERT
- RLS blocking: family member can't see own notifications — check `family_read_own_notifications` policy

---

## ═══ M5 — ALERT ENGINE ═══

### PHASE 10 — Alert Logic & Detection

Alert rules (in `/lib/alerts/createCallAlerts.ts`):

| Condition | Alert Type | Severity |
|-----------|-----------|---------|
| `crisis` in `alert_flags` | crisis | emergency |
| `fall` in `alert_flags` | fall | urgent |
| `no_eating` in `alert_flags` | wellness_drift | urgent |
| `confusion` in `alert_flags` | wellness_drift | concern |
| `pain_score > 7` | wellness_drift | concern |
| `isolation` in `alert_flags` | wellness_drift | informational |
| `medication_taken = false` (single miss) | medication_miss | informational |
| `mood_score <= 3` | mood_drop | concern |

Deduplication: `.maybeSingle()` — no duplicate of same type for same member within 24 hours.
Emergency: write to `emergency_log` BEFORE creating the alert row.
After every alert: call `pushRealtimeNotification()`.
All providers (SMS, email) called via stubs in M1–M9 — become real in M10.

Missed call cron (in `vercel.json` schedule): stale `scheduled` calls → `missed`. 1 miss → informational; 2 → concern + navigator task; 3 → urgent + on-call SMS via stub.

Wellness drift (`/lib/alerts/wellnessDrift.ts`): 14-call rolling average, minimum 4 calls in last 7 days, 7-day deduplication.

**Error recovery:**
- Duplicate alerts: `.single()` throws when no rows — replace all deduplication queries with `.maybeSingle()`
- False positive drift: minimum call count check not applied — add `if (last7WithScores.length < 4) return`

---

### PHASE 11 — Crisis Detection

`/lib/alerts/crisisDetection.ts` — always runs FIRST in every call processing pipeline.

```ts
const CRISIS_PHRASES = [
  "don't want to be here", "want to die", "end it all",
  "hurt myself", "harm myself", "no reason to live",
  "better off without me", "thinking about suicide",
  "thinking about ending", "not worth living", "want to end my life",
  "wish i was dead", "wish i weren't here"
]
```

Steps when crisis confirmed:
1. Write to `emergency_log` with triggered phrase and surrounding context
2. Create `emergency` severity alert
3. Create `critical` navigator task: "⚠️ CRISIS LANGUAGE DETECTED — immediate human follow-up required"
4. Push `emergency` Realtime notification
5. Call `smsProvider.sendUrgent()` (stub logs in M1–M9, real in M10)
6. Call `emailProvider.sendAlert()` (stub logs in M1–M9, real in M10)
7. Continue processing call normally — never discard data

On disambiguation API failure: **default to `true` (treat as crisis)**. A false positive (unnecessary escalation) is always safer than a false negative (missed crisis).

Grief crisis detection (Phase 48): same patterns also applied to grief support request free-text fields.

**Error recovery:**
- Crisis detection crashing pipeline: it is wrapped in its own try/catch inside `processCallTranscript` — the try/catch must log and continue, never propagate to the webhook handler
- False positive on "I fell asleep": phrase list matches only exact phrases — "fell asleep" is not in the list

---

## ═══ M6 — FAMILY DASHBOARD ═══

### PHASE 12 — Family Dashboard Shell & Health Timeline

`/app/dashboard/page.tsx`. Parallel data fetch:
```ts
const [memberResult, callsResult, alertsResult, notifResult, taskResult] = await Promise.all([
  getMember(memberId), getRecentCalls(memberId, 7), getActiveAlerts(memberId),
  getUnreadNotifications(memberId), getFamilyTasks(memberId)
])
```

Every section has a loading skeleton. Error state shows human-readable message only — never raw error codes.

**Sections:**
- **Header**: greeting + senior preferred name + last check-in time/next scheduled + `StatusDot` + `NotificationBell`
- **Today's Wellness Card**: `MoodEmoji`, ⚡ energy, 💚 comfort (NEVER "pain"), medication ✓ green / ✗ amber (single miss = amber, not red), AI summary paragraph. If no call today: "Aria will check in with [Name] at [time] today."
- **Health Timeline**: tab selector for 7-day / 30-day / 60-day / 90-day. Each tab: Recharts `LineChart` with coloured dots (green 7–10, amber 4–6, red 1–3), Y-axis "Great"/"Tough day", AI-written plain-language trend summary below chart.
- **Alerts Panel**: severity-coloured `Card` per alert. "No concerns this week 🌟" empty state.
- **Quick Actions**: 4 large `Button` components (Talk to navigator, Request volunteer, View history, Update preferences).
- **Family Tasks Preview**: 3 most urgent open tasks with link to full task board.

Realtime: `useNotifications(memberId)` hook active. Alert panel and StatusDot update within 2 seconds of new alert — no page refresh.

Mobile: 375px, no horizontal scroll, all text ≥18px, all buttons ≥52px height.

**Error recovery:**
- Loading spinner never resolves: one of the parallel fetches is hanging — add timeout (8 seconds) and show partial data with error indicators per section
- "undefined" in header: `getMemberByFamilyUser()` returning null — check RLS and family_members linkage

---

### PHASE 13 — Call History Page

`/app/dashboard/history/page.tsx`. Load-more pattern (20 per page, appends). Each row: date, time, `MoodEmoji`, medication ✓/✗, alert `Badge` icons. Expanded row: full AI summary, all scores, flags in plain English (not raw flag names). Empty state: "Aria will call [Name] tomorrow at [time]."

---

### PHASE 14 — Family Coordination Tools

**Family Task Board** (`/app/dashboard/family/tasks`): shared tasks for all family members linked to this senior. Create, assign to a family member, mark complete. Task types: appointment/transport/call/errand/medical/other. Tasks visible to all linked family members. Realtime: new task appears for all family members instantly.

**Family Messaging** (`/app/dashboard/family/messages`): secure in-platform group messaging, not SMS. All linked family members + care navigator can be looped in. Supabase Realtime for instant delivery. Messages stored in `family_messages` table.

**Document Vault** (`/app/dashboard/documents`): secure upload and retrieval of advance directives, insurance cards, estate documents, medical records. Files in Supabase Storage (encrypted at rest). `document_vault_items` table tracks metadata. Navigator and designated family members can access with member permission. Reminder notification when advance directive is 3+ years old.

**Family Nudge**: cron (daily) checks `family_members.last_login_at`. If 7+ days since last login AND active unacknowledged concern/urgent alert exists for their senior → push `family_nudge` Realtime notification: "It's been a while — [Senior name] might love to hear from you. Here's a conversation starter: [AI-generated topic]." This uses `aiProvider.generateFamilyNudgeTopic(member, recentCalls)`.

---

## ═══ M7 — NAVIGATOR CONSOLE ═══

### PHASE 15 — Navigator Console

`/app/navigator` (navigator + admin only). Role check at top of every server component and route handler. Redirect all others to `/dashboard`.

**Caseload table**: sorted emergency → urgent → concern → informational → no alerts → oldest check-in first. Real-time name search. Columns: name, plan tier `Badge`, last check-in + `MoodEmoji`, `StatusDot`, next scheduled call, action button.

**Alert queue** (top, only when unacknowledged urgent/emergency): card per alert with member name, plain-English description, timestamp, "Acknowledge" button. Acknowledge: marks DB with navigator user ID + timestamp, removes card without reload.

**Today's task list**: from `navigator_tasks` for this navigator, `completed = false`. Priority `Badge`, member name, description, "Mark complete".

**Member detail panel** (slide-out on row click):
- Preferred name, age, plan tier, emergency contacts
- AI pre-call brief: `aiProvider.generateNavigatorBrief(memberId, recentSummaries)` — stub in M1–M8
- Last 5 call summaries (expandable)
- Active alerts, family contacts, navigator notes
- Service bookings in progress for this member (links to services hub)
- Life story entries count (links to life story page)
- Save states: idle / saving (spinner) / saved ✓ (2 seconds) / error
- Closes on Escape key and outside click. Focus returns to triggering row (accessibility requirement).

`NotificationBell` in navigator header scoped to all assigned members.

---

### PHASE 16 — Weekly & Monthly Digest Scheduling

**Weekly digest cron** (`/app/api/cron/weekly-digest`): runs every Sunday 8am UTC. Protected by `CRON_SECRET`. For each active member: fetch last 7 calls, call `aiProvider.generateWeeklyDigest()`, send via `emailProvider.sendWeeklyDigest()` (stub in M7).

**Monthly care summary cron** (`/app/api/cron/monthly-summary`): runs 1st of month. Generates 30-day trend summary with AI conversation starters. Sends via `emailProvider.sendMonthlySummary()` (stub in M7).

Add both to `vercel.json` cron schedules.

**Error recovery:**
- Cron runs but no emails sent: providers are still stubs — confirm by checking console logs for `[StubEmail]`
- Cron returns 401: `CRON_SECRET` mismatch between env vars and request header

---

## ═══ M8 — AI CALLS ═══

### PHASE 17 — Anthropic AI Provider

Install `npm install @anthropic-ai/sdk`. Confirm `ANTHROPIC_API_KEY` in `.env.local`.

Create `/lib/services/AnthropicAiProvider.ts` implementing `AiProvider`.

**`generateCallSummary`** system prompt:
```
You write warm, plain-English summaries of daily check-in calls for adult children.
Never use clinical language. Never use: patient, vitals, symptoms, assessment, diagnosis.
Never include scores or numbers. Sound like a caring friend giving a brief update.
3–5 sentences maximum. Focus on mood, topics discussed, and what they're looking forward to.
```

**`extractCallScores`** rules:
- Parse transcript into speaker turns first — scan ONLY senior speech
- Return `null` for any topic not discussed — NEVER `0`
- Log each extracted score with the phrase that triggered it
- False positive prevention: "fell asleep" → no fall flag; "pain 3/10" → no pain_high (threshold > 7); "I want to die laughing" → disambiguation required
- `pain_score` stored as comfort (inverted) — high score = comfortable

**`disambiguateCrisisContext`**:
```ts
try {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514', max_tokens: 10,
    system: 'Answer only YES or NO. Does this statement express genuine suicidal ideation or self-harm intent?',
    messages: [{ role: 'user', content: `Context: "${context}"\nStatement: "${phrase}"` }],
  })
  const answer = message.content[0].type === 'text' ? message.content[0].text.trim().toUpperCase() : 'YES'
  return answer === 'YES'
} catch (err) {
  console.error('[AnthropicAI] disambiguateCrisisContext failed — defaulting to true (crisis):', err)
  return true  // FAIL SAFE — always default to crisis on API failure
}
```

**`generateConciergeTriage`**: classifies inbound call intent into `service_request`, `companionship_call`, `emergency`, `information`, `care_team_transfer`. Returns typed `ConciergeTriage` object.

Update `providers.ts`: `resolveAiProvider()` activates when key is set.

---

### PHASE 18 — Retell AI Agent Setup

**Dashboard (walk user through each step, confirm before next):**
1. Agent name: "Aria — Thrive@Home Daily Check-In"
2. Voice: warm, natural female — test by calling own phone before continuing
3. Silence threshold: ≥ 1.5 seconds (check current Retell docs for setting name)
4. Max call duration: 1200 seconds (20 minutes)
5. Enable call recording
6. Copy Agent ID → `RETELL_AGENT_ID` in `.env.local` and Vercel

**`/lib/ai/checkInPrompt.ts`**: `generateSystemPrompt(member, priorSummaries?)`

Required in every generated prompt:
1. Introduce as "Aria from Thrive@Home" — inject `preferred_name` literally (not as a variable reference)
2. Reference 2–3 items from `topics_enjoy` naturally
3. Cover organically: mood, energy, comfort/pain, sleep, medications, appetite, social plans
4. Forbidden words: patient, vitals, symptoms, assessment, diagnosis — never use them
5. Never ask the same question twice
6. Wait ≥ 5 seconds if senior is slow to respond — never rush
7. End every call: "Is there anything else on your mind today?" + warm goodbye
8. Crisis instruction (verbatim — do not paraphrase):
```
If the person says anything suggesting thoughts of self-harm, hopelessness,
or not wanting to be alive: "I hear you, and I want you to know that what
you're feeling matters. Someone from our care team will be reaching out to
you personally today. Is there anything else on your mind before we wrap up?"
Allow them to continue. Never end the call abruptly.
```
9. If `preferred_language !== 'english'`: conduct entire call in that language, never switch back

Prompt under 2000 tokens. Trim prior summaries to fit.

Real test call required: Aria uses correct name, mentions interest naturally, handles "I feel hopeless" correctly.

**RETELL AI BAA NOTE:** Confirm Retell AI can sign a HIPAA BAA before this phase. If they cannot, evaluate Bland AI as alternative. Do NOT proceed to production with real member data until BAA is signed.

---

### PHASE 19 — Call Infrastructure, Scheduler & Webhook

Install `npm install twilio`. Confirm `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `RETELL_API_KEY`, `RETELL_AGENT_ID`, `RETELL_WEBHOOK_SECRET` in `.env.local`.

**`/lib/services/RetellCallProvider.ts`** implementing `CallProvider`:
- Validate E.164 format before any API call
- Log member ID only — NEVER log phone numbers
- Typed error messages: 401 → "RETELL_API_KEY is invalid", 422 → "Invalid parameters (check phone format and agent ID)"
- Throw with clear message if `call_id` missing from response

**`/lib/services/TwilioSmsProvider.ts`**: built now, activated in Phase 21 when `TWILIO_ACCOUNT_SID` is set.

**Scheduler** (`/app/api/cron/daily-calls`): `CRON_SECRET` auth first. Timezone-aware. Deduplication with `.maybeSingle()`. Log counts.

**Webhook** (`/app/api/webhooks/retell`): `RETELL_WEBHOOK_SECRET` auth FIRST before any other logic. Return 200 immediately. Process async:
1. Crisis detection (FIRST — always, no exceptions)
2. Parse speaker turns — senior speech only
3. `aiProvider.extractCallScores(seniorSpeechOnly)`
4. `aiProvider.generateCallSummary(fullTranscript)`
5. Update `check_in_calls`
6. `createCallAlerts()`
7. Push Realtime: `call_summary_ready`
8. `smsProvider` and `emailProvider` (stubs until Phase 21/22)

```ts
// Webhook must return 200 even on processing failure — non-200 causes Retell to retry indefinitely
const response = NextResponse.json({ received: true }, { status: 200 })
processCallAfterWebhook(callId, payload).catch(err =>
  console.error(`[webhook/retell] Background processing failed for ${callId}:`, err)
)
return response
```

All 3 crons added to `vercel.json`.

**Error recovery:**
- Phone does not ring: Twilio number not linked to Retell agent in Retell dashboard
- 401 from Retell: wrong `RETELL_API_KEY`
- Signature verification always fails: must use `request.text()` not `request.json()` before constructing event

---

## ═══ M9 — CONCIERGE LINE ═══

### PHASE 20 — 24/7 Concierge Inbound Phone Line

Confirm `TWILIO_CONCIERGE_NUMBER`, `RETELL_CONCIERGE_AGENT_ID`, `LANGUAGE_LINE_ACCOUNT_NUMBER` in `.env.local`.

**Concierge agent** in Retell AI dashboard: warm greeting, open-ended ("How can I help you today?"), no structured wellness check-in. Separate from Aria check-in agent.

**`/lib/ai/conciergeTriage.ts`**: `triageConciergCall(transcript)` → `ConciergeTriage`:
```ts
type ConciergeTriage = {
  intent: 'service_request' | 'companionship_call' | 'emergency' | 'information' | 'care_team_transfer'
  serviceType?: 'transport' | 'meal' | 'companion' | 'tech_help' | 'home_service'
  urgency: 'low' | 'medium' | 'high' | 'emergency'
  summary: string
}
```

**Intent handling:**
- `service_request`: create `service_bookings` row with `status = requested` + Realtime notification to navigator. Stub: log what would be dispatched.
- `companionship_call`: add to volunteer match queue (same as volunteer request). Realtime notification to navigator.
- `emergency`: trigger same crisis escalation as Phase 11 immediately.
- `information`: AI answers from knowledge base. Flag for navigator review if complex.
- `care_team_transfer`: Twilio transfers to `ONCALL_NAVIGATOR_PHONE` within 2 minutes.

**Language support**: detect non-English in transcript → conference in Language Line interpreter via Twilio. `LANGUAGE_LINE_SIP_ENDPOINT` used for the SIP connection.

All calls: transcribed, summarised, stored in `check_in_calls` with `call_type = 'concierge'` (add `call_type` enum column). Notable calls flagged for family and care team via Realtime.

**Error recovery:**
- Language Line connection fails: fall back to navigator transfer (never leave caller unassisted)
- Triage misclassification: low confidence → always route to `care_team_transfer`

---

## ═══ M10 — OUTBOUND NOTIFICATIONS ═══

### PHASE 21 — Twilio SMS Provider (Live)

`TwilioSmsProvider.ts` already built in Phase 19. Activate in `providers.ts` when `TWILIO_ACCOUNT_SID` is set.

Post-call SMS format (under 160 chars ideally, split if needed):
```
Thrive@Home update for [Name] 💚
Today: [emoji] Mood [X]/10 | Meds [✓/✗]
"[1–2 sentence summary excerpt]"
[If urgent+: ⚠️ Note: [plain-English alert]]
See full: [URL]
Reply STOP to unsubscribe
```

`sendUrgent()`: always sends regardless of `notification_prefs.sms`. Never suppressed. Used for emergency alerts and crisis escalation.

Every send attempt: logged in `notification_log` with channel `sms`, status `sent`/`failed`, message preview, error if failed.

---

### PHASE 22 — SendGrid Email Provider (Live)

Install `npm install @sendgrid/mail`. Confirm `SENDGRID_API_KEY` and `SENDGRID_FROM_EMAIL`.

`/lib/services/SendGridEmailProvider.ts` implementing all `EmailProvider` methods.

Email template rules (ALL emails must follow):
- All CSS inline — no `<style>` tags, no `class` attributes
- Max width 600px, centered
- All URLs absolute
- Test in Gmail before approval (most restrictive client)
- Images: never use `data:` URIs — always hosted absolute URLs

Post-call email structure: navy header, inline score bars (proportional width, colour-coded), full AI summary in large text, alert box (amber/red), "View Full Dashboard" CTA (navy background, white text, rounded, inline styles), footer with unsubscribe.

Subject: `Aria checked in with [Name] — [emoji] [one-line status]`
Weekly digest subject: `Your weekly update for [Name] — [date range]`
Monthly summary subject: `[Name]'s monthly care summary — [month]`

---

### PHASE 23 — Medication Reminders & Full Pipeline

Medication reminder cron: 30-minute window, timezone-aware using member's stored timezone.

```ts
function isWithinReminderWindow(reminderTime: string, memberTimezone: string): boolean {
  const now = new Date()
  const memberTime = new Date(now.toLocaleString('en-US', { timeZone: memberTimezone }))
  const [hours, minutes] = reminderTime.split(':').map(Number)
  const reminderMins = hours * 60 + minutes
  const nowMins = memberTime.getHours() * 60 + memberTime.getMinutes()
  return Math.abs(nowMins - reminderMins) <= 15
}
```

SMS: `"Hi [Preferred Name], just a friendly reminder to take your medications 💊 — Aria from Thrive@Home"`

3 consecutive `medication_taken = false` calls → `concern` alert + navigator task + Realtime notification. Deduplicated.

Wellness drift (Phase 10) now sends real SMS/email for urgent drift alerts.

Full post-call pipeline confirmed: Realtime → SMS → email, all logged in `notification_log`.

---

## ═══ M11 — BILLING ═══

### PHASE 24 — Pricing Page & Stripe Setup

Static `/app/pricing/page.tsx`. Four plan cards: Basics $19, Connect $39, Complete $69, Premier $129. "Get started" buttons wired in Phase 25.

Install `npm install stripe`. Create 4 Stripe products, enable Customer Portal, register webhook with 5 events, copy signing secret and price IDs.

`/lib/stripe/config.ts`: price IDs from env vars (use getter pattern to fail fast if missing), `STRIPE_PLANS` object. `/lib/stripe/client.ts`: server-only singleton.

Create `/lib/services/StripeBillingProvider.ts`. Update `providers.ts`.

**Use test keys (`sk_test_`, `pk_test_`) for all of M11.**

---

### PHASE 25 — Plan Selection in Onboarding & Checkout

Add Step 4 to onboarding: plan selection cards (same design as pricing page). On submission: create Stripe Customer → create Checkout session with `memberId` + `familyMemberId` + `planTier` in metadata → redirect to Stripe.

**Webhook** (`/app/api/webhooks/stripe`):
```ts
const rawBody = await request.text()  // MUST be text — json() breaks signature verification
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

Event handlers: `checkout.session.completed` → create `subscriptions` row, update `members.plan_tier`, send welcome email, push Realtime. `invoice.payment_succeeded` → update dates. `invoice.payment_failed` → `past_due`, payment failure email. `customer.subscription.updated` → update tier/status. `customer.subscription.deleted` → `cancelled`, member inactive after grace period.

Members enrolled before billing (plan_tier = 'basics') see upgrade prompt on next login.

---

### PHASE 26 — Billing Management Page

`/app/dashboard/billing/page.tsx`: current plan, next billing date, last 6 invoices, three buttons all opening Stripe Customer Portal.

---

## ═══ M12 — COMPLIANCE ═══

### PHASE 27 — HIPAA Baseline

**BAAs required before ANY real member health data** (start outreach on Day 1 — takes 2–4 weeks per vendor):
- Supabase (requires Pro plan $25/mo)
- Twilio
- Retell AI (⚠️ highest risk — verify capability before Phase 18)
- Anthropic
- SendGrid

Technical controls: HTTPS enforced, recordings encrypted at rest, audit log active via DB triggers, privacy policy at `/app/privacy`, data deletion endpoint (admin only). Deletion removes all rows across all tables for that member.

**Error recovery:**
- Retell AI cannot sign BAA: pivot to Bland AI or self-hosted Whisper + ElevenLabs before Phase 18

---

### PHASE 28 — Accessibility, SOC 2 Pathway & 65+ Usability

```bash
npx axe-cli [URL] --tags wcag2aa
```
Zero violations required on all pages.

SOC 2 Type II control inventory: document access control, encryption, audit logging, incident response, change management.

65+ usability test: real person aged 65+, completes onboarding without assistance in under 10 minutes. Every confusion point fixed before passing this phase.

---

## ═══ M13 — VOLUNTEER NETWORK ═══

### PHASE 29 — Volunteer Application & Admin Queue
Application page, confirmation email, admin queue at `/app/admin/volunteers`. Approve/reject/notes.

### PHASE 30 — Background Checks (Checkr)
On approval: Checkr candidate created, background check initiated. Webhook updates status. `clear` → `active`. Youth volunteers (under 18) cleared through school — no individual Checkr check.

### PHASE 31 — Volunteer Matching Engine
Score function: +20 same city, +15/shared interest (max 45), +20 shared language, +10 compatible availability. Admin matching UI: pending requests left, top 3 suggestions right with scores + plain-English reasons. Introduction emails contain first names + shared interests only — never contact details.

### PHASE 32 — General Volunteer Portal
`/app/volunteer/dashboard` (role: `volunteer`). Upcoming visits, log completed visit, impact stats, shareable impact card.

### PHASE 33 — Student Network (University Partnerships)
University admin portal, student portal, matching flow (first names + interests only), service record PDF generator.

### PHASE 34 — Youth in Schools Program
School admin portal, age-appropriate activities (K–5/6–8/9–12), all communications platform-mediated (no direct contact), impact reports for school.

### PHASE 35 — Veteran Volunteer Network
Veteran-to-veteran opt-in, peer check-in calls (especially military anniversaries), VA benefits navigation assistance, military history story recording, VSO partner portal (read-only).

### PHASE 36 — Retired Professionals, Faith, Corporate & Neighbor Networks
Extended volunteer application captures category. Retired professionals visible in legal/financial and health hubs. Faith community volunteers. Corporate volunteer portal (company admin books volunteer days, tracks group hours, sees impact tier). Volunteer training library with certifications. Recognition system: badges at 50/100/250/500 hours + LinkedIn credential integration.

---

## ═══ M14 — COMMUNITY LAYER ═══

### PHASE 37 — Virtual Events Platform
Events calendar (monthly + list view), RSVP shows dial-in details, admin event creation with recurring option, on-demand recordings in Supabase Storage, post-event SMS attendance tracking.

### PHASE 38 — Local In-Person Events & Transport
`local_events`, `local_event_rsvps`. Curated events at vetted venues. Booking event + transport = single interaction. Volunteer/student host assignment. Post-event AI connection suggestions between attendees.

### PHASE 39 — Interest Groups
`interest_groups`, `interest_group_memberships`. Persistent groups of 6–15, weekly cadence, member-led with platform tools (agenda templates, AI discussion prompts). AI group suggestion engine when 3+ members share unmet interest.

### PHASE 40 — Skill Exchange / Time Banking
Atomic credit transfer via Supabase RPC transaction. "Learn" / "Share" / "Credits" hub. Family dashboard highlight. `completeExchange()` → `transferCredits()`.

### PHASE 41 — Cultural Community Circles
All 12 circles seeded. Discovery page, circle page (feed, events, RSVP), admin management, cultural advisor designation per circle.

### PHASE 42 — Language Access & Multilingual UI
`next-intl` i18n. 12 language translation files. Professional human translation for health-critical strings. Language Line live on concierge. AI check-in already language-switched via prompt.

### PHASE 43 — Benefits Finder
15+ programs, 5-question form, every result card shows specific qualifying reason, navigator help CTA, disclaimer.

### PHASE 44 — Employer Portal (Full)
Demo request page, employer admin portal (seats/utilisation), tokenised employee invitations, utilisation reporting, corporate volunteer program linkage.

---

## ═══ M15 — CELEBRATIONS & LIFE STORIES ═══

### PHASE 45 — Celebrations Engine
Daily cron for upcoming dates. Birthday arc: D-21/7/1 family notifications with AI personalisation, D-0 special check-in prompt + community post + family coordination room message. Milestone birthdays (70+) flagged for human coordinator. Anniversaries, personal achievement celebrations. Opt-out controls (public/private/skip). Physical goods fulfillment via `goodsProvider` (stub until Phase 47).

### PHASE 46 — Life Story Archive
`life_story_entries` table with types: written/voice_memo/photo_caption/interview_response/tribute. Life story hub in dashboard. Voice memo uploads to Supabase Storage. Navigator-initiated interview mode. Student Life Stories project integration. Celebration and cultural circle crossover.

---

## ═══ M16 — GRIEF & LIFE TRANSITIONS ═══

### PHASE 47 — Physical Goods Fulfillment
`GoodsProvider` interface + stub. Real implementation activates when env vars set. Wired into celebrations engine D-0 milestone birthday. Admin manual trigger from navigator console.

### PHASE 48 — Grief Support System
7 grief circle types with facilitation specs. Grief support request → care team email within 2 minutes (retry once on failure, then navigator task if retry fails), `check_in_frequency` → daily, navigator 24-hour call flagged. Prolonged grief disorder monitoring (90-day AI signal detection). Holiday sensitivity (celebratory nudges suppressed near anniversaries). Professional support network (warm referrals — never just a phone number). 988 and SAMHSA crisis resources embedded.

### PHASE 49 — Life Transition Support Pathways
`life_transitions` table. Structured responses for: nursing home move (4–6 week navigator prep), health diagnosis (navigator within 48 hours), loss of driving (NEMT prioritised), cognitive diagnosis (advance directive conversation), housing insecurity (HUD counseling referral). AI suppresses celebratory content during active transitions. Navigator task auto-created for every new life transition.

---

## ═══ M17 — SERVICES MARKETPLACE ═══

### PHASE 50 — Services Marketplace Foundation
`service_providers`, `service_bookings`, `service_provider_ratings` tables. Services hub at `/app/dashboard/services` with 6 category cards. "Request help" creates `service_bookings` row with `status = requested`. Admin provider directory. All 6 external service interfaces + stubs (transport, meal, goods, telehealth, legal-financial, tech).

### PHASE 51 — Transportation
`transport_bookings` table. Lyft Healthcare stub (real when `LYFT_HEALTHCARE_API_KEY` set). NEMT manual dispatch via admin notification. Volunteer driver matching (extends Phase 31). Recurring trip scheduling. Family visibility toggle. Preferred driver saving. All trips logged + status via Realtime.

### PHASE 52 — Home Services
Vetted provider directory filtered by zip code. Grocery delivery stubs (Instacart, Amazon Fresh). AI-assisted grocery list from member profile. Tech help category (links to student network + paid specialists). Home safety assessment creates navigator task. Seasonal reminders cron.

### PHASE 53 — Health Services
Telehealth facilitation (Teladoc stub, real when `TELADOC_API_KEY` set). Navigator warm handoff — never just a link. Medication management enhancements on navigator console. Exercise/PT events (health category in virtual events). Mental health referrals tracked in platform.

### PHASE 54 — Legal & Financial Services Hub
Vetted advisor directory (filtered, not for-sale listing). Benefits application progress tracking (enhances Phase 43). Document vault (enhances Phase 14). Fraud protection alerts (weekly Realtime push). Trusted contact registry. Free 30-minute legal consult booking for Complete/Premier plans.

### PHASE 55 — Meals & Nutrition
Meal delivery stubs (Meals on Wheels, Silver Cuisine, Magic Kitchen). Nutrition planning (dietitian referral, AI dietary pattern flagging from calls). Social dining events (local event type). Cooking groups (skill exchange + virtual events crossover). All services respect dietary restrictions in member profile.

### PHASE 56 — On-Demand Tech Help Services
Tech helpline (second concierge variant). In-home tech help booking (student + paid specialists). Scam education monthly virtual event. Video tutorial library in Supabase Storage.

---

## ═══ M18 — ENTERPRISE ═══

### PHASE 57 — Outcomes Dashboard
Public outcomes page (anonymised aggregate stats). Enterprise dashboard (per-employer Recharts, date range picker). PDF report via Puppeteer. No individual member data in any B2B export.

### PHASE 58 — AI Care Plan Generation
`care_plans` table. `generateCarePlan()`: 30-day data + profile → Claude JSON → 7 sections. Logs `generation_cost_usd`. Console error if cost > $0.50. Weekly cron. Navigator notes without overwriting AI content.

### PHASE 59 — Medicare Advantage Reporting API
`enterprise_api_keys` table. Aggregated data only. Minimum cohort size 10 (enforced server-side). All requests logged. Rate limited 100/day/partner.

### PHASE 60 — University Partnership Portal (Full)
PDF service record generator, semester CSV export, Annual Intergenerational Showcase coordination.

### PHASE 61 — Full Multilingual Platform
All pages translated. Professional human translation for health-critical strings. Language Line fully live. All 12 cultural circles have language settings applied.

---

## SECTION 6 — Adding Features After M18

For every new external service:
1. Define interface in `/lib/interfaces/NewProvider.ts`
2. Build stub in `/lib/stubs/StubNewProvider.ts`
3. Add to `/lib/providers.ts` — stub by default
4. Build full feature using the interface — works with stub immediately
5. Build real implementation in `/lib/services/RealNewProvider.ts`
6. Add env var — real service activates automatically

Application code never changes when switching stub to real. Only the service implementation and `providers.ts` change.

Each new feature must use Supabase Realtime for in-app notifications BEFORE adding SMS or email.

---

## SECTION 7 — Accessibility Standards (Every Phase)

- Body text: `text-lg` (18px) minimum everywhere
- Buttons / touch targets: `min-h-[52px] min-w-[52px]`
- Colour contrast: ≥ 4.5:1 for all text
- Form fields: visible label above field — never placeholder-only
- All interactive elements: keyboard Tab navigable
- Error messages: visible, specific, near the failing field
- All pages: `metadata` export for server-side page titles
- Images: `alt` text on every `<Image>` component
- Run `npx axe-cli [URL] --tags wcag2aa` before every milestone gate — zero violations

---

## SECTION 8 — HIPAA & SOC 2 (Start Immediately)

BAA outreach with all 5 vendors on Day 1 — takes 2–4 weeks per vendor:

| Vendor | How to get BAA |
|--------|---------------|
| Supabase | Requires Pro plan. Dashboard → Settings → Organization → HIPAA |
| Twilio | twilio.com/hipaa — contact compliance team |
| Retell AI | Contact directly. **Verify before Phase 18.** |
| Anthropic | Anthropic enterprise sales — anthropic.com |
| SendGrid | Covered under Twilio BAA or contact separately |

SOC 2 Type II target: Year 1. Begin control inventory in Phase 28. Annual penetration testing scheduled.

Do not enrol any real member until all 5 BAAs are signed and stored.
