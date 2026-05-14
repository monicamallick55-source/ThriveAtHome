# Thrive@Home — Build Phases Reference (v3.0)

> **How to use this document:** Each phase has a single focused deliverable and a concrete test. Do not start the next phase until the current test passes with real data. Phases are numbered sequentially. High-level groups are called **milestones**.

---

## Core Philosophy

Every phase must produce something you can show a real person and get a real reaction from. The test gates are not suggestions — they are the only signal that matters. Never start the next phase until the current one is APPROVED by the human.

---

## Five-Layer Architecture (from Platform Spec)

| Layer | What It Is |
|-------|-----------|
| **Layer 1 — AI Connection & Support** | Daily AI check-ins, 24/7 concierge line, family updates, alerts engine |
| **Layer 2 — Human Companion Network** | Volunteers (all types), paid companions, student network, care coordination |
| **Layer 3 — Community & Events** | Virtual events, local events, skill exchange, interest groups, cultural circles |
| **Layer 4 — Services Marketplace** | Transport, home services, health services, legal/financial, meals, tech help |
| **Layer 5 — Celebrations, Culture & Transitions** | Celebrations engine, cultural circles, grief & life transitions, life story archive |

---

## Milestone Overview

| Milestone | Phases | Delivers |
|-----------|--------|---------|
| M1 — Foundation | 1–4 | App shell, database, auth, security |
| M2 — Member Data | 5–7 | Senior enrollment, data layer, seed data |
| M3 — UI System | 8 | Reusable component library |
| M4 — Realtime Notifications | 9 | Supabase Realtime — primary notification channel |
| M5 — Alert Engine | 10–11 | All alert detection, crisis detection, escalation logic |
| M6 — Family Dashboard | 12–14 | Wellness dashboard, health timeline, family coordination tools |
| M7 — Navigator Console | 15–16 | Caseload management, AI briefing, navigator tools |
| M8 — AI Calls | 17–19 | Retell AI agent, call scheduler, webhook + transcript processing |
| M9 — Concierge Line | 20 | 24/7 inbound phone line with AI triage |
| M10 — Outbound Notifications | 21–23 | SMS (Twilio), email (SendGrid), weekly/monthly digests |
| M11 — Billing | 24–26 | Stripe subscriptions, plan selection, billing management |
| M12 — Safety & Compliance | 27–28 | HIPAA, accessibility, SOC 2 pathway |
| M13 — Volunteer Network | 29–36 | All 8 volunteer types, matching, training, recognition |
| M14 — Community Layer | 37–44 | Virtual/local events, interest groups, skill exchange, cultural circles |
| M15 — Celebrations & Life Stories | 45–48 | Celebrations engine, physical goods, life story archive |
| M16 — Grief & Transitions | 49–52 | Grief pathways, transition support, professional network |
| M17 — Services Marketplace | 53–59 | Transport, home services, meals, health, legal, tech help |
| M18 — Enterprise | 60–64 | Outcomes dashboard, AI care plans, university portal, MA API, multilingual |

---

## M1 — Foundation

### Phase 1 — Project Scaffold
**Deliverable:** A blank Next.js app that deploys to a live Vercel URL.

- Create Next.js 14 project with App Router, TypeScript, Tailwind, ESLint
- Configure Tailwind brand tokens: navy `#1B3A6B`, teal `#2A9D8F`, warm-white `#FAFAF8`; base font size 18px
- Create full folder structure: `/app`, `/components/ui`, `/lib/supabase`, `/lib/interfaces`, `/lib/stubs`, `/lib/services`, `/lib/providers.ts`, `/lib/data`, `/lib/alerts`, `/lib/realtime`, `/lib/ai`, `/lib/env.ts`, `/types`, `/scripts`, `/supabase/migrations`
- Create `.gitignore` (all `.env*` excluded) — verify with `echo "TEST=secret" > .env.local && git status`; `.env.local` must appear under "Untracked files" only
- Create `.env.local.example` with all 23 variable names, empty values
- Create `/lib/env.ts` with `requireEnv()` and `requireServerEnv()` validators
- Create all 5 service interfaces: `CallProvider`, `SmsProvider`, `EmailProvider`, `AiProvider`, `BillingProvider`
- Create all 5 stub implementations: log what they would do, never throw, never cause side effects
- Create `/lib/providers.ts` — stub by default, real service activates when env var is set
- Create `/app/page.tsx` landing page with brand colours
- Push to GitHub, connect to Vercel, confirm auto-deploy works

**Test:** Live Vercel URL loads with no console errors. `npx tsc --noEmit` produces zero errors. `.env.local` is untracked by git.

---

### Phase 2 — Supabase Connection
**Deliverable:** App reads from and writes to Supabase.

- Install `@supabase/supabase-js @supabase/ssr`
- Create `/lib/supabase/client.ts` (browser, anon key), `/lib/supabase/server.ts` (server, session cookies), `/lib/supabase/admin.ts` (service role, bypasses RLS — server only)
- All three use `requireEnv()` / `requireServerEnv()` — never string literals
- Temporary test page queries a test table, confirms data, then is deleted

**Test:** Test page shows database message. Delete page. `npx tsc --noEmit` zero errors.

---

### Phase 3 — Database Schema
**Deliverable:** All tables exist with correct structure, indexes, audit triggers, and Realtime enabled.

Write all SQL in `/supabase/migrations/001_initial_schema.sql` and `/supabase/migrations/002_audit.sql`.

**Tables:**
`members`, `family_members`, `check_in_calls`, `alerts`, `care_navigators`, `navigator_assignments`, `navigator_tasks`, `navigator_notes`, `subscriptions`, `realtime_notifications`, `notification_log`, `emergency_log`, `medication_schedules`, `family_task_items`, `family_messages`, `life_story_entries`, `document_vault_items`, `volunteer_applications`, `volunteer_matches`, `volunteer_visits`, `volunteer_training_completions`, `interest_groups`, `interest_group_memberships`, `local_events`, `local_event_rsvps`, `cultural_circles`, `circle_memberships`, `circle_posts`, `circle_events`, `circle_event_rsvps`, `skills_offered`, `time_credits`, `skill_exchanges`, `time_credit_transactions`, `celebration_events`, `grief_support_requests`, `grief_circle_memberships`, `life_transitions`, `service_providers`, `service_bookings`, `service_provider_ratings`, `transport_bookings`, `meal_orders`, `employer_accounts`, `employer_leads`, `audit_log`

**Schema standards:** All PKs `uuid DEFAULT gen_random_uuid()`. All timestamps `timestamptz DEFAULT now() NOT NULL`. All FKs `ON DELETE CASCADE`. All enums created as PostgreSQL `TYPE` before tables. Arrays as `text[]`. JSON as `jsonb`. All enum values `lowercase_with_underscores`.

**Audit triggers** on `members`, `check_in_calls`, `alerts` (via `002_audit.sql`).

**Enable Supabase Realtime** for `realtime_notifications` INSERT events.

**Test:** All tables visible in Table Editor. FK relationships confirmed. Realtime enabled. Cascade delete verified. Audit triggers confirmed.

---

### Phase 4 — Row Level Security
**Deliverable:** Data is access-controlled — users only see their own data.

RLS enabled on all tables. Policies: family reads own member's data only; navigator reads assigned members only; admin reads all (service role). Cross-user isolation tested with two real Supabase Auth users.

**Test:** User A cannot read User B's member data (returns empty array). User A can read their own data. Admin service role reads all rows.

---

## M2 — Member Data

### Phase 5 — Authentication
**Deliverable:** Users sign up, log in, and route correctly by role.

- Middleware routes: unauthenticated → `/login`; family role → blocked from `/navigator`, `/admin`; navigator → blocked from `/admin`; authenticated user hitting `/login` → redirected to role dashboard
- Signup creates Supabase Auth user AND `family_members` row atomically — rollback Auth user if insert fails
- Auth helpers: `getCurrentUser()`, `getUserRole()`, `requireAuth()`

**Test:** All 5 routing rules verified with real browser navigation. Orphaned Auth user does not exist after failed signup.

---

### Phase 6 — Member Onboarding Form (3 Steps, No Billing)
**Deliverable:** Family member enrolls a senior. Plan tier defaults to `basics` until billing is connected.

- Step 1: About the senior (name, preferred name, DOB, phone, language, address)
- Step 2: Call preferences (time, timezone, frequency, topics to enjoy, topics to avoid)
- Step 3: Safety & emergency contacts (two contacts, doctor, medications, conditions, mobility, lives alone)
- Form state persisted to `localStorage` on every change. Server-side validation before insert.
- Submission: Supabase RPC atomically creates `members` row and links logged-in `family_members`
- Confirmation page: "Welcome to the Thrive@Home family, [preferred name]!"
- `plan_tier` defaults to `basics` — plan selection added in Phase 24

**Test:** All 3 steps complete. Member row in Supabase with all fields. `plan_tier = 'basics'`. Validation errors appear on all required fields. Form data survives page refresh. Confirmation shows correct name.

---

### Phase 7 — App Data Layer & Seed Data
**Deliverable:** Typed data functions for every table + realistic seed data for dashboard development.

Create in `/lib/data/`: `members.ts`, `calls.ts`, `alerts.ts`, `family.ts`, `navigator.ts`, `notifications.ts`, `tasks.ts`, `lifeStory.ts`, `documents.ts`

Every function: `Promise<{ data: T | null; error: string | null }>`. Never throws.

Create `/scripts/seed-test-data.ts` — idempotent, creates: test family member, test senior "Margaret Chen", 14 completed calls with realistic declining mood arc (8,8,7,8,7,6,7,6,5,6,5,5,4,5), 2 alerts, 2 realtime notifications, navigator assignments, 3 navigator tasks. Prints login credentials.

Create `/scripts/clear-test-data.ts` — removes all seeded rows.

**Test:** Script runs: "✓ All data layer tests passed". `npx tsc --noEmit` zero errors. Seed script creates all expected rows. Clear script removes them all.

---

## M3 — UI System

### Phase 8 — Primitive UI Components
**Deliverable:** Every reusable UI primitive built before any page. All pages depend on these.

`/components/ui/`: `Button` (primary/secondary/danger/ghost, loading state, min-h-[52px] text-lg), `Card` (default/highlight/warning/danger variants), `Badge` (alert severities, plan tiers, status), `Input` (visible label, error state below field), `Select`, `Skeleton` (animated grey pulse), `StatusDot` (green/amber/red), `MoodEmoji` (😊≥8, 🙂≥6, 😐≥4, 😔≥2, 😞<2, — for null), `NotificationBell` (live unread count, dropdown of last 5), `Toast` (auto-dismiss, severity-coloured), `Modal` (accessible, focus-trapped, Escape to close), `Tabs`, `ProgressBar`

All components: `className` prop, ARIA labels, keyboard navigation, 4.5:1 contrast minimum, brand colour tokens only.

**Test:** All variants visible in `/app/test-ui` page. Keyboard tabbing reaches every element. Focus ring always visible. Page deleted after approval.

---

## M4 — Realtime Notifications

### Phase 9 — Supabase Realtime Notification System
**Deliverable:** Alerts and call updates push to the browser instantly without refreshing — the primary notification channel for Layers 1 and 2.

- `/lib/realtime/notifications.ts`: `pushRealtimeNotification(notification)` — inserts to `realtime_notifications` using admin client. Logs on failure, never throws.
- `/lib/realtime/useNotifications.ts`: React hook subscribing to `postgres_changes` INSERT on `realtime_notifications` filtered by `member_id`. Returns `{ notifications, unreadCount, markRead, markAllRead }`.
- Wire alert creation (Phase 11) to call `pushRealtimeNotification` after every alert
- Wire call processing (Phase 18) to push `call_completed` and `call_summary_ready` notifications
- `NotificationBell` component (Phase 8) wired to this hook

**Test:** Open dashboard in one tab. Insert alert via SQL Editor. Toast notification appears in dashboard tab within 2 seconds — no page refresh. Bell count increments. Mark read clears count. RLS confirmed: User A does not see User B's notifications.

---

## M5 — Alert Engine

### Phase 10 — Alert Logic & Detection
**Deliverable:** All alert detection, creation, deduplication, and escalation logic — no external services needed.

`/lib/alerts/createCallAlerts.ts` — rules:

| Condition | Alert Type | Severity |
|-----------|-----------|---------|
| `crisis` flag | crisis | emergency |
| `fall` flag | fall | urgent |
| `no_eating` flag | wellness_drift | urgent |
| `confusion` flag | wellness_drift | concern |
| `pain_score > 7` | wellness_drift | concern |
| `isolation` flag | wellness_drift | informational |
| `medication_taken = false` (single miss) | medication_miss | informational |
| `mood_score <= 3` | mood_drop | concern |

Deduplication: `.maybeSingle()` — no duplicate of same type for same member within 24 hours. Emergency events written to `emergency_log` BEFORE creating the alert. After creating any alert: call `pushRealtimeNotification()`.

`/lib/alerts/wellnessDrift.ts` — 14-call rolling average. Minimum 4 calls in last 7 days. 7-day deduplication.

`/lib/alerts/missedCallDetection.ts` — cron job. Stale `scheduled` calls → `missed`. Escalation: 1 miss → informational; 2 → concern + navigator task; 3 → urgent + on-call SMS (stub in Layers 1–2).

**Test:** Crisis flag → emergency alert + emergency_log entry. Duplicate suppressed. Normal call → no alert. Drift: declining scores trigger concern; flat scores do not. Realtime notification appears in dashboard within 2 seconds of alert creation.

---

### Phase 11 — Crisis Detection
**Deliverable:** Crisis language detection runs first in every call processing pipeline. Escalates to humans immediately. Zero AI-only response.

`/lib/alerts/crisisDetection.ts`:
1. Scan SENIOR speech only (not Aria's questions)
2. Match against crisis phrase list
3. If match: call `disambiguateCrisisContext()` via `aiProvider` (stub returns false in Layer 1 — safe, no real calls yet)
4. If confirmed crisis: write `emergency_log` → create `emergency` alert → create `critical` navigator task → push `emergency` Realtime notification → call `smsProvider.sendUrgent()` (stub logs in Layers 1–2) → call `emailProvider.sendAlert()` (stub logs in Layers 1–2)
5. Continue processing call normally — never discard data on crisis detection

API failure on disambiguation defaults to `true` (treat as crisis) — fail safe, never fail open.

**Test:** Crisis transcript → all 5 steps logged in stub mode. Realtime emergency notification visible on dashboard. Normal transcript → no false positive. Ambiguous phrase → context disambiguation runs.

---

## M6 — Family Dashboard

### Phase 12 — Family Dashboard Shell & Health Timeline
**Deliverable:** Family member sees a complete, real-time dashboard with 30/60/90 day trends.

`/app/dashboard/page.tsx`:
- Parallel fetch: member, last 7 calls, active alerts, unread notifications, upcoming tasks
- **Header:** greeting, senior preferred name, last check-in time/next scheduled, `StatusDot`, `NotificationBell`
- **Today's Wellness Card:** `MoodEmoji` + score, ⚡ energy, 💚 comfort (never "pain"), medication ✓ amber ✗ — never red for single miss, AI summary paragraph
- **7-Day Mood Trend:** Recharts `LineChart`, Y-axis "Great"/"Tough day", colour-coded dots, no gridlines
- **Health Timeline:** tab selector for 30/60/90-day view — AI-written plain-language trend summary per period, key metrics as simple stat cards
- **Alerts Panel:** severity-coloured cards, "No concerns this week 🌟" empty state
- **Quick Actions:** 4 large buttons
- Loading skeletons for every section. Human-readable error state. Mobile-first at 375px.

Realtime: alert card appears and StatusDot changes within 2 seconds of new alert, without page refresh.

**Test:** Dashboard loads within 3 seconds. Seed data displays correctly. Realtime alert appears without refresh. Health timeline renders for all 3 time periods. Mobile layout confirmed.

---

### Phase 13 — Call History Page
**Deliverable:** Family browses all past check-in records with expandable summaries.

`/app/dashboard/history/page.tsx`:
- Calls newest-first, 20 per page, load-more appends
- Each row: date, time, `MoodEmoji`, medication ✓/✗, alert `Badge` icons
- Expanded: full AI summary, all scores, flags in plain English
- Empty state: "Aria will call [Name] tomorrow at [time]"

**Test:** 25+ calls load with pagination. Expansion shows correct data. Flags show plain English.

---

### Phase 14 — Family Coordination Tools
**Deliverable:** Family members coordinate care responsibilities and communicate within the platform.

- **Family Task Board** (`/app/dashboard/family/tasks/page.tsx`): shared task list for all family members linked to this senior. Create task → assign to a family member → mark complete. Task types: appointment, transport, call, errand, medical, other. Visible to all family members linked to the senior.
- **Family Messaging** (`/app/dashboard/family/messages/page.tsx`): secure in-platform group messaging between all family members + care navigator loop-in. Not SMS — platform-internal. Realtime via Supabase.
- **Care Planning** (`/app/dashboard/family/care-plan/page.tsx`): document senior's preferences, emergency contacts, advance directives. Family can upload documents to `document_vault_items` table (stored in Supabase Storage, encrypted at rest).
- **Family Nudge System**: if a family member has not logged in for 7+ days AND the senior has had a concerning alert, system inserts a `system_message` Realtime notification for that family member: "It's been a while — [Senior name] might love to hear from you. Here's a conversation starter: [AI-generated topic from recent call]"

**Test:** Task created by one family member visible to all linked family members in real time. Message sent by family member appears for all others. Advance directive file uploads and is retrievable. 7-day nudge inserts notification (test by manually setting last-login date in DB).

---

## M7 — Navigator Console

### Phase 15 — Navigator Console
**Deliverable:** Care navigator manages full caseload with AI briefing before every interaction.

`/app/navigator/page.tsx` (navigator + admin only):
- **Caseload table:** sorted emergency → urgent → concern → no alerts → oldest check-in first. Real-time name search. Columns: name, plan tier badge, last check-in + MoodEmoji, StatusDot, next scheduled call.
- **Alert queue:** unacknowledged urgent/emergency cards at top. Acknowledge: marks DB with navigator ID + timestamp, removes card without reload.
- **Today's tasks:** from `navigator_tasks` for this navigator, `completed = false`. Priority badge, "Mark complete".
- **Member detail panel** (slide-out on row click): preferred name, age, plan tier, AI pre-call brief (via `aiProvider.generateNavigatorBrief()` — stub in Layer 1), last 5 call summaries, active alerts, family contacts, navigator notes (save with saving/saved/error states). Closes on Escape + outside click. Focus returns to triggering row.
- `NotificationBell` in header scoped to all assigned members.

**Test:** Only assigned members visible. Sort order correct. Acknowledge removes card. AI brief appears (stub text). Notes persist. Panel closes on Escape.

---

### Phase 16 — Proactive Weekly & Monthly Summaries
**Deliverable:** Family receives a weekly digest email every Sunday and a monthly care summary on the 1st.

- **Weekly digest cron** (`/app/api/cron/weekly-digest/route.ts`): runs Sunday 8am UTC. Queries all active members. For each: fetches last 7 days of calls, generates `aiProvider.generateWeeklyDigest(member, calls)` — 7-day mood trend narrative, medication adherence %, activity highlights, concerns flag, conversation starters for family. Sends via `emailProvider.sendWeeklyDigest()` (stub logs in Layer 1).
- **Monthly care summary cron** (`/app/api/cron/monthly-summary/route.ts`): runs 1st of month. Generates 30-day trend summary. Sends via `emailProvider.sendMonthlySummary()`.
- Add both to `vercel.json` cron schedule.

**Test:** Trigger weekly cron manually → stub logs what would be sent for each active member. `aiProvider.generateWeeklyDigest()` returns a non-empty string with stub. Cron rejects requests without `CRON_SECRET`.

---

## M8 — AI Calls

### Phase 17 — Anthropic AI Provider
**Deliverable:** Real AI replaces stubs for transcript processing, summaries, and navigator briefings.

Install `@anthropic-ai/sdk`. Create `/lib/services/AnthropicAiProvider.ts` implementing `AiProvider`.

`generateCallSummary`: warm, plain-English, 3–5 sentences, no clinical language, no numbers. Model: `claude-sonnet-4-20250514`, max_tokens: 300.

`extractCallScores`: returns `null` for undiscussed topics — never `0`. Scans senior speech only. Logs each score with triggering phrase. False positive prevention: "fell asleep" ≠ fall flag; "pain 3/10" ≠ pain_high; pain_high threshold is score > 7 only.

`disambiguateCrisisContext`: defaults to `true` on API failure.

`generateWeeklyDigest`, `generateMonthlySummary`, `generateNavigatorBrief`, `generateCarePlan`: all implemented.

Update `providers.ts`: `resolveAiProvider()` activates when `ANTHROPIC_API_KEY` set.

**Test:** Happy transcript → mood ≥ 7, medication true. "Fell asleep" → no fall flag. "Pain 3/10" → no pain_high. Undiscussed topic → null not 0. Summary has no forbidden words. API failure on disambiguation → true.

---

### Phase 18 — Retell AI Agent Setup
**Deliverable:** Aria agent configured and making real calls with correct personality and crisis handling.

Dashboard configuration: agent "Aria — Thrive@Home Daily Check-In", warm female voice, silence threshold ≥ 1.5s, max 20 minutes, recording enabled.

`/lib/ai/checkInPrompt.ts`: `generateSystemPrompt(member, priorSummaries?)` — injects `preferred_name` literally, 2–3 interests from `topics_enjoy`, language switching, crisis instruction verbatim, 10 required instruction items (no clinical language, no checklist feel, never rush, etc.). Under 2000 tokens.

Real test call required: Aria says correct name, mentions interest naturally, handles "I feel hopeless" correctly without ending the call.

**Test:** Test call passes all 3 criteria. Disambiguation on "I don't want to be here at the beach" → no false positive.

---

### Phase 19 — Call Infrastructure, Scheduler & Webhook
**Deliverable:** Calls schedule automatically, complete calls trigger full processing pipeline.

Install `twilio`. Create `/lib/services/RetellCallProvider.ts` (E.164 validation, logs member ID never phone number, typed error messages per status code). Create `/lib/services/TwilioSmsProvider.ts` (built now, activated in Phase 21).

**Scheduler** (`/app/api/cron/daily-calls/route.ts`): CRON_SECRET auth, queries active members by preferred_call_time + timezone, deduplication via `.maybeSingle()`, logs scheduled/skipped/failed counts.

**Webhook** (`/app/api/webhooks/retell/route.ts`): verify `RETELL_WEBHOOK_SECRET` first. Return 200 immediately. Process asynchronously:
1. Crisis detection (FIRST — always)
2. Parse speaker turns — senior speech only
3. Extract scores via `aiProvider.extractCallScores()`
4. Generate summary via `aiProvider.generateCallSummary()`
5. Update `check_in_calls`
6. Create alerts via `createCallAlerts()`
7. Push Realtime notification: `call_summary_ready`
8. Notify via `smsProvider` / `emailProvider` (stubs until Phase 21)

Add all 3 crons to `vercel.json`.

**Test:** Phone rings within 2 minutes of cron trigger. No duplicate call for same member same day. Webhook 401 without secret. Crisis transcript → all 5 escalation steps. Dashboard shows real call data via Realtime within 30 seconds.

---

## M9 — Concierge Line

### Phase 20 — 24/7 Concierge Inbound Phone Line
**Deliverable:** Seniors call one number for anything. AI triages. Humans take over when needed.

- Purchase a second Twilio number designated as the concierge line (`TWILIO_CONCIERGE_NUMBER`)
- Configure Twilio to handle inbound calls with a separate Retell AI agent (or Twilio Studio flow for initial triage)
- Create concierge agent in Retell AI: "Hi, this is the Thrive@Home concierge line. I'm here to help — you can ask me anything. How can I help you today?"
- **AI triage logic** in `/lib/ai/conciergeTriage.ts`: classifies inbound call intent into: service_request (transport, meal, companion), companionship_call, emergency, information, care_team_transfer
- **Service dispatch stubs**: for service_request intents, log what would be dispatched (real dispatch wired in M17)
- **Companion request**: adds to `volunteer_matches` queue (same as volunteer request flow)
- **Emergency**: triggers same crisis escalation as check-in calls
- **Human transfer**: for complex/emotional/care_team_transfer — Twilio transfers to on-call navigator (`ONCALL_NAVIGATOR_PHONE`) within 2 minutes
- All calls: transcribed, summarized, notable calls flagged for family and care team via Realtime notification
- Language support: Language Line Solutions for 240+ languages via Twilio `<Conference>` + Language Line SIP (or fallback to navigator)

**Test:** Call the concierge number. AI answers warmly. Say "I need a ride to the doctor" → stub logs service_request dispatch. Say crisis phrase → crisis escalation fires (same as Phase 11). Say "I just want to talk" → companion request created in queue. Human transfer tested by saying "I need to speak to someone."

---

## M10 — Outbound Notifications

### Phase 21 — Twilio SMS Provider (Fully Live)
**Deliverable:** Real SMS replaces stub notifications. All post-call and alert SMS go live.

`TwilioSmsProvider.ts` already built in Phase 19. Activate in `providers.ts`.

Post-call SMS format: "Thrive@Home update for [Name] 💚\nToday: [emoji] Mood [X]/10 | Meds [✓/✗]\n"[1–2 sentence summary]"\n[If urgent+: ⚠️ Note: [alert]]\nSee full update: [URL]\nReply STOP to unsubscribe"

`sendUrgent()`: always sends regardless of preferences. Used for emergency alerts and crisis escalation.

Every send attempt: logged in `notification_log` with channel, status, message preview, error if failed.

**Test:** SMS arrives within 5 minutes of call. Respects `sms: false` preference for regular SMS. Emergency SMS ignores preferences. `notification_log` shows sent/failed rows.

---

### Phase 22 — SendGrid Email Provider (Fully Live)
**Deliverable:** Real post-call emails and weekly/monthly digests go live.

Install `@sendgrid/mail`. Create `/lib/services/SendGridEmailProvider.ts` implementing all `EmailProvider` methods.

Email template rules: all CSS inline, no `<style>` tags, max 600px, all URLs absolute. Post-call email: navy header, inline score bars, full AI summary, alert box (amber/red), "View Full Dashboard" CTA, footer with unsubscribe.

Subject: `Aria checked in with [Name] — [emoji] [one-line status]`

Weekly digest: 7-day mood trend as text narrative, highlights, upcoming needs, AI conversation starters.

Monthly summary: 30-day trend, milestone highlights, AI recommendations.

**Test:** Post-call email arrives within 30 minutes. Renders in Gmail on mobile. Score bars appear correctly. Weekly and monthly digests send from manual cron trigger.

---

### Phase 23 — Medication Reminders & Full Notification Pipeline
**Deliverable:** Medication reminders fire on schedule. Full pipeline wired end to end.

Medication reminder cron: 30-minute window, timezone-aware. SMS: "Hi [Name], just a friendly reminder to take your medications 💊 — Aria from Thrive@Home". 3 consecutive misses → `concern` alert + navigator task + Realtime notification.

Wellness drift (Phase 10) now sends real SMS/email for urgent drift alerts.

Full post-call pipeline confirmed: Realtime → SMS → email, all logged in `notification_log`.

**Test:** Reminder SMS arrives within 3 minutes of scheduled time. 3 consecutive misses → concern alert. Full pipeline: all 3 channels logged as `sent`.

---

## M11 — Billing

### Phase 24 — Pricing Page & Stripe Setup
**Deliverable:** Four plan cards display. Stripe products created. Providers wired.

Static `/app/pricing/page.tsx` with Basics $19/Connect $39/Complete $69/Premier $129 cards. Features listed per plan. "Get started" buttons wired in Phase 25.

Install `stripe`. Create 4 Stripe products with monthly prices. Customer Portal enabled. Webhook endpoint registered with 5 events. Create `/lib/stripe/config.ts`, `/lib/stripe/client.ts`, `/lib/services/StripeBillingProvider.ts`. Update `providers.ts`.

Use test keys (`sk_test_`, `pk_test_`) through end of this milestone.

**Test:** All 4 products in Stripe dashboard. Price IDs present in env. Webhook endpoint registered and enabled.

---

### Phase 25 — Plan Selection in Onboarding & Checkout
**Deliverable:** Members choose and pay for a plan. Stripe Checkout processes payment.

Add Step 4 to onboarding: plan selection cards. On submit: create Stripe Customer, create Checkout session with `memberId` + `familyMemberId` in metadata, redirect to Stripe. Use `request.text()` not `request.json()` in webhook (required for signature verification). Handle 5 webhook events: `checkout.session.completed` (create `subscriptions` row, update `members.plan_tier`, welcome email, Realtime notification), `invoice.payment_succeeded`, `invoice.payment_failed` (payment failure email), `customer.subscription.updated`, `customer.subscription.deleted` (mark inactive after grace period).

Members enrolled before billing (plan_tier = 'basics') see upgrade prompt on next login.

**Test:** Test card 4242 4242 4242 4242 completes checkout. `subscriptions` row active in Supabase. Webhook events handled (via Stripe CLI). Webhook returns 200 even on handler failure.

---

### Phase 26 — Billing Management Page
**Deliverable:** Families self-serve their subscription.

`/app/dashboard/billing/page.tsx`: current plan, next billing date, last 6 invoices, "Change plan"/"Update payment method"/"Cancel subscription" → all open Stripe Customer Portal.

**Test:** Correct plan shown. Customer Portal accessible. Invoice history displays.

---

## M12 — Safety & Compliance

### Phase 27 — HIPAA Baseline & Audit
**Deliverable:** System meets minimum requirements for real member health data.

BAAs required before ANY real member data: Supabase, Twilio, Retell AI, Anthropic, SendGrid. Privacy policy at `/app/privacy`. Data deletion endpoint (admin only). Audit log active via database triggers. All health data in transit over HTTPS. Recordings encrypted at rest.

**Test:** All 5 BAAs signed. Audit log entry created on member read. Deletion removes all rows across all tables. HTTPS enforced.

---

### Phase 28 — Accessibility, SOC 2 Pathway & 65+ Usability
**Deliverable:** Zero WCAG 2.1 AA violations. SOC 2 controls documented. Real 65+ user completes onboarding without assistance.

axe-cli scan of all pages → zero violations. SOC 2 Type II control inventory created (access control, encryption, audit logging, incident response). 65+ usability test: complete onboarding in under 10 minutes without help. Every confusion point fixed.

**Test:** `npx axe-cli [URL] --tags wcag2aa` zero violations. 65+ adult completes onboarding without assistance.

---

## M13 — Volunteer Network

### Phase 29 — Volunteer Application & Admin Queue
**Deliverable:** Volunteers apply through the platform. Admin reviews and approves.

`volunteers` table (already in schema). Application page at `/app/volunteer/apply`. On submit: save, confirmation email, notify admin. Admin queue at `/app/admin/volunteers`: pending list with approve → `background_check`, reject, notes.

**Test:** Application creates row with `status = pending`. Admin receives email. Approval changes status.

---

### Phase 30 — Background Check Integration (Checkr)
**Deliverable:** Background checks initiated automatically on volunteer approval.

- Create Checkr account and obtain API key
- On admin approval: create Checkr candidate, initiate background check package, store `checkr_candidate_id` on volunteer row
- Webhook from Checkr updates `background_check_status`: `pending` → `clear` → `active`, or `consider` / `suspended`
- `CHECKR_API_KEY` and `CHECKR_WEBHOOK_SECRET` added to env vars

**Test:** Approval triggers Checkr API call (test mode). Webhook updates status. `clear` status → volunteer marked `active`.

---

### Phase 31 — Volunteer Matching Engine
**Deliverable:** System suggests best volunteer matches for each member request.

Score function `scoreVolunteerForMember(volunteer, member)`: +20 same city, +15 per shared interest (max 45), +20 shared language (if non-English primary), +10 compatible availability. `getTopVolunteerMatches(memberId, limit = 3)`.

Admin matching UI: pending requests on left, top 3 suggestions on right with scores and plain-English reasons. Confirm → create `volunteer_matches` row, send introduction emails (first names + shared interests only, no contact details).

**Test:** Member with [gardening, cooking] in SF matches higher than member without shared interests. Introduction email contains no phone numbers or emails.

---

### Phase 32 — General Volunteer Portal
**Deliverable:** Approved general volunteers manage visits.

`/app/volunteer/dashboard` (role: `volunteer`): upcoming visits (matched member first name + last initial, prep notes), log completed visit (date, duration, type, notes, 1–5 stars), impact stats (total hours, seniors supported, visits this month), shareable impact card.

**Test:** Only matched members visible. Logged visit creates `volunteer_visits` row. Impact stats update.

---

### Phase 33 — Student Network (University Partnerships)
**Deliverable:** University students log service hours, earn official service records.

`university_partners`, `students`, `student_visits` tables. University admin portal: enrolled students, hours per student, semester CSV export, PDF service record generator. Student portal: browse available seniors, log completed visits with required reflection, download service record. Matching: student requests → admin confirms → introduction email (first names + interests only). Service record PDF: institution name, student name, itemised visit log, total hours.

**Test:** Student logs 2-hour visit. PDF contains correct data. University admin CSV export accurate.

---

### Phase 34 — Youth in Schools Program
**Deliverable:** K–12 school partnerships with age-appropriate volunteer activities.

- School admin portal: manage registered students (under 18 — no individual background checks, school coordinates)
- Activity types by age: Elementary (K–5): pen-pal letters/drawings; Middle (6–8): Life Stories interview project; High School (9–12): tech help + mentorship reversal
- All youth-senior communications facilitated through platform — no direct contact info exchanged
- School tracks activity completion, platform generates school-level impact reports

**Test:** School admin creates a student group. Activity logged. No direct contact info visible to either party. Impact report generates.

---

### Phase 35 — Veteran Volunteer Network
**Deliverable:** Veteran-to-veteran peer support program with VSO partnerships.

- Veteran members opt into Veteran Volunteer Network in their profile
- Veteran volunteer activities: peer check-in calls (especially around military anniversaries, Memorial Day, Veterans Day), VA benefits navigation assistance, military history story recording
- VSO partner portal (read-only): VFW, American Legion, DAV chapter coordinators can view their volunteers' activity
- Flag ceremony coordination: platform coordinates in-person flag presentations for veteran members on significant dates

**Test:** Veteran volunteer matched to veteran member. VA benefits navigation session logged. VSO coordinator sees their volunteers' hours.

---

### Phase 36 — Retired Professionals, Faith, Corporate & Neighbor Volunteer Networks
**Deliverable:** All remaining volunteer categories active with role-appropriate views.

Extend volunteer application to capture: volunteer category (general/student/veteran/retired_professional/faith/corporate/neighbor/family_reciprocity), professional specialty (for retired professionals), organization affiliation (for corporate/VSO/faith).

Retired Professionals: visible in legal/financial hub and health services hub as available consultants. Referred by navigator. Role-based view on volunteer portal.

Faith community volunteers: faith-aligned activities visible in matching. Chaplain referral capability.

Corporate volunteer portal: company admin books volunteer days, tracks group hours, sees impact tier (Community Partner / Champion / Leader).

Volunteer training library (`/app/volunteer/training`): modules by type (senior communication, grief awareness, cultural competency, dementia awareness). Completion stored in `volunteer_training_completions`. Certificate required before first assignment.

Volunteer recognition system: badges at 50/100/250/500 hour milestones. LinkedIn credential integration. Admin generates printed thank-you notes for milestone hours.

**Test:** Each volunteer category can log in and sees role-appropriate view. Training completion unlocks first assignment. Badge awarded at correct hour milestone.

---

## M14 — Community Layer

### Phase 37 — Virtual Events Platform
**Deliverable:** Members browse, RSVP, and join events by phone or video.

`events`, `event_rsvps` tables. Events calendar at `/app/dashboard/events`: monthly + list view, filter by type, RSVP shows dial-in details. Event detail page. Admin event creation with recurring option. Post-event SMS: "Reply YES if you attended" → marks attendance. Session recordings stored in Supabase Storage for on-demand replay.

**Test:** Create event as admin. RSVP shows dial-in details. Post-event SMS → YES reply marks `attended = true`. Recurring event creates multiple rows.

---

### Phase 38 — Local In-Person Events & Transport Coordination
**Deliverable:** Members find and attend local events with integrated transport booking.

`local_events`, `local_event_rsvps` tables. Local events feed at `/app/dashboard/events/local`: curated events at partner venues (libraries, cafes, parks, faith communities). Each event: venue, date, transport option toggle. Booking local event + transport = single interaction: creates both `local_event_rsvp` and `transport_booking` rows. Volunteer/student host assignment shown on event. Post-event social matching: AI suggests connection follow-ups between attendees.

**Test:** RSVP to local event with transport. Both rows created. AI follow-up suggestion generated (stub in Layer 1 of this milestone, real after AI is connected).

---

### Phase 39 — Interest Groups
**Deliverable:** Persistent member-led weekly groups of 6–15 with platform facilitation tools.

`interest_groups`, `interest_group_memberships` tables. Interest groups directory at `/app/dashboard/groups`: browse by type (gardening, politics, faith, veterans, LGBTQ+, widows/widowers, professional identity, cultural). Join/leave. Group page: meeting schedule, member list (first names), agenda (AI-generated weekly discussion prompts). Member-led: one member designated as host. AI group suggestion engine: detects when 3+ members share an unmet interest → suggests new group to navigator for approval.

**Test:** Create interest group. Members join. AI discussion prompts appear. New group suggestion triggered when 3 members share interest.

---

### Phase 40 — Skill Exchange / Time Banking
**Deliverable:** Seniors teach skills, earn time credits, redeem for services.

`skills_offered`, `time_credits`, `skill_exchanges`, `time_credit_transactions` tables. `transferCredits()` is atomic (Supabase RPC transaction). `completeExchange()` calls `transferCredits()`. Skill Exchange hub: "Learn" tab (browse + request), "Share" tab (register skills), "Credits" tab (balance + ledger). Family dashboard highlight: "Margaret taught 3 people to make pierogi this month 🎉".

**Test:** 2 members start at 0 credits. Exchange completes. Teacher +1, learner -1. Transaction rows correct. Atomicity: inject failure mid-transaction → neither balance changes.

---

### Phase 41 — Cultural Community Circles
**Deliverable:** 12 cultural circles fully active with feeds, events, and member-led content.

`cultural_circles`, `circle_memberships`, `circle_posts`, `circle_events`, `circle_event_rsvps` tables. Seed all 12 circles: Latino/Hispanic, Chinese-American, Vietnamese-American, Korean-American, South Asian, Filipino-American, African-American, Jewish-American, Arab/Middle Eastern, Caribbean, Eastern European, Native American/Indigenous. Discovery page: circle grid, joined circles pinned. Circle page: community feed, upcoming events, RSVP shows dial-in, post, leave. Admin: create/edit events, post announcements, member counts, flag/remove posts. Cultural Circle Advisors: each circle has an optional advisor designation (a volunteer or navigator with cultural expertise).

**Test:** All 12 seeds confirmed. Join circle → membership row + count increments. Post appears in feed. RSVP shows dial-in to RSVP'd users only. Admin announcement broadcasts.

---

### Phase 42 — Language Access & Multilingual UI
**Deliverable:** Non-English speakers complete all core tasks in their language. Language Line live on concierge.

Integrate `next-intl` i18n framework. Translation files at `/messages/[locale].json` for 12 languages. Professional human translation for health-critical strings. Priority pages: onboarding, dashboard, concierge, grief support, billing. Language Line Solutions fully wired in concierge line (Phase 20) — connect to Language Line SIP endpoint when non-English detected. AI check-in calls already language-switched via Retell prompt.

**Test:** Spanish member sees onboarding/dashboard/billing entirely in Spanish. No raw translation keys visible. Native Spanish speaker reviews health strings for accuracy.

---

### Phase 43 — Benefits Finder
**Deliverable:** 5 questions → personalised list of government and nonprofit benefits.

`/lib/benefits/data.ts`: static array of 15+ programs (SNAP, Medicare Savings Program, Extra Help/LIS, Medicaid, LIHEAP, Meals on Wheels, Senior Farmers Market Nutrition, VA Aid & Attendance, PACE, SCSEP, SSI, AAA services, 211, SHIP, EITC). Each has eligibility rules, estimated annual value, apply URL, category. Results: card per benefit with "You may qualify because: [specific reason from answers]". Summary banner: estimated missing benefits range. Navigator help CTA.

**Test:** Low-income California veteran → VA Aid & Attendance + 3+ benefits. Non-veteran >$50k → no VA benefit. Every result card shows a specific qualifying reason.

---

### Phase 44 — Employer Portal (Full)
**Deliverable:** Employers manage caregiver employee benefits, invite employees, view utilisation.

`employer_accounts`, `employer_leads` tables. Employer landing at `/app/employers`. Demo request saves to `employer_leads`, emails sales team. Employer admin portal: seats used/purchased, employee list, "Invite employee" → tokenised email → employee signs up → linked to employer. Utilisation report: check-ins this month, alerts, navigator hours used. Corporate Volunteer Program (Phase 36) linked to employer account.

**Test:** Demo request → lead row + sales email. Invitation accepted → employee linked to employer. Utilisation report accurate.

---

## M15 — Celebrations & Life Stories

### Phase 45 — Celebrations Engine
**Deliverable:** Birthdays, anniversaries, and milestones celebrated with personalised 7-day arcs.

`celebration_events` table. Celebration Calendar Engine: tracks all member dates, family-submitted dates, and platform milestones. Daily cron checks upcoming. Birthday arc: D-21/7/1 family notification with escalating personalisation; D-0 special check-in prompt (Aria acknowledges birthday), community post, family coordination room message. AI personalisation: pulls from check-in history, stated preferences, interest tags, family notes — never generic. Opt-out controls: members/families control which celebrations are public vs. private vs. skipped.

Milestone birthdays (70, 75, 80, 85, 90+): Celebration Coordinator role (navigator handles) — special programs beyond automated arc.

Anniversaries: relationship milestones. Personal achievements: skill taught, community event attended, volunteer hour milestone — shared to family dashboard and (with permission) community feed.

Physical goods fulfillment stubs: log what would be ordered (real integration in Phase 47).

**Test:** Set DOB 7 days away → family notification with personalised suggestions sent. D-0 → community post + modified check-in prompt. Opt-out respected. Milestone birthday flagged for human coordinator.

---

### Phase 46 — Life Story Archive
**Deliverable:** Seniors record, preserve, and share life stories within their community.

`life_story_entries` table: id, member_id, title, content (text), entry_type (enum: written/voice_memo/photo_caption/interview_response), recorded_at, is_public (within community), audio_url (nullable), photo_url (nullable), featured_in_celebration (boolean).

`/app/dashboard/life-story/page.tsx`: add entry (text, voice memo upload, photo caption), browse own entries, mark entries as shareable with community, tribute recording for deceased loved ones (linked entry type `tribute`).

Navigator-assisted recording: navigator can initiate a structured life story interview during check-in calls. Interview questions stored in `life_story_entries` with `entry_type = 'interview_response'`.

Celebration crossover: life story entries surface in birthday arc AI personalisation and in community circle posts.

Student crossover (Phase 33): Life Stories interview project results stored as `life_story_entries`.

**Test:** Member creates written entry. Entry appears in life story feed. Voice memo uploads to Supabase Storage. Entry marked public appears in community feed. Navigator creates interview response entry. Tribute entry links to loss record.

---

## M16 — Grief & Life Transitions

### Phase 47 — Physical Goods Fulfillment
**Deliverable:** Birthday cards, photo books, and flowers ordered through platform partnerships.

- Partner integrations (stub pattern): Artifact Uprising (photo books), Moonpig/Zola (cards), 1-800-Flowers
- Create `/lib/interfaces/GoodsProvider.ts`: `sendBirthdayCard(recipientAddress, message, senderName)`, `orderPhotoBook(memberId, images, dedicationText)`, `sendFlowers(recipientAddress, occasionNote)`
- Create `/lib/stubs/StubGoodsProvider.ts`: logs what would be ordered
- Wired into celebrations engine: D-0 milestone birthday triggers `goodsProvider.sendBirthdayCard()`
- Admin can manually trigger any goods order for any member from navigator console

**Test:** Milestone birthday cron triggers stub goods order (logged). Admin manual order logs stub. Provider switches to real when env var set.

---

### Phase 48 — Grief Support System
**Deliverable:** Structured bereavement and life transition support pathways.

`grief_support_requests`, `grief_circle_memberships`, `life_transitions` tables.

**Grief support page** (`/app/dashboard/grief-support`): warm landing, 4 category cards. Request form → saves, emails care team within 2 minutes, increases `check_in_frequency` to daily, flags navigator for 24-hour call.

**7 grief circle types** (matching spec): Spousal Loss, Loss of Adult Child, Loss of Sibling/Close Friend, Pet Loss, Anticipatory Grief, General Loss & Transition, Cultural-Specific. Facilitator assignment tracked on circle record.

**Grief behavioral monitoring**: AI detects prolonged grief disorder signals (isolation score rising, appetite change, cognitive confusion flags in transcripts) → alerts care team after 90-day window. Holiday sensitivity: AI suppresses celebratory nudges near loss anniversaries and first holiday season without the loved one.

**Professional support network**: licensed therapist referral list. Navigator facilitates warm first appointment — never just a phone number. Crisis resources embedded: 988 Suicide & Crisis Lifeline, SAMHSA, senior-specific lines.

**Test:** Grief request → care team email within 2 minutes + check_in_frequency = daily. Holiday sensitivity: mock a 6-month loss date, confirm celebratory nudges suppressed in November/December. 90-day monitoring: insert isolation + appetite signals → care team alert fires.

---

### Phase 49 — Life Transition Support Pathways
**Deliverable:** Structured navigator responses for all major life transitions.

`life_transitions` table: member_id, transition_type (enum: nursing_home_move/health_diagnosis/loss_of_driving/pet_death/divorce/cognitive_diagnosis/adult_child_moved/housing_insecurity), reported_at, status, navigator_notes.

**Transition types and platform responses** (per spec):
- Nursing home / care facility transition: 4–6 week navigator-led preparation, facility research tools, community farewell gathering coordination, continued platform access after move, facility liaison contact
- Health diagnosis: navigator activated within 48 hours, disease-specific peer groups surfaced, telehealth facilitation
- Loss of driving ability: NEMT enrollment prioritised, volunteer driver matching
- Cognitive diagnosis: care plan updated, family notified, advance directive conversation initiated, dementia-specific resources surfaced
- Housing insecurity: emergency benefits navigator activated, HUD counseling referral

Navigator task created automatically for every new life transition entry. AI suppresses celebratory content during active transitions.

**Test:** Create a nursing home transition record → navigator task created + community farewell event offered. Cognitive diagnosis → advance directive prompt appears on family dashboard. Celebratory nudges suppressed for member with active transition.

---

## M17 — Services Marketplace

### Phase 50 — Services Marketplace Foundation
**Deliverable:** Provider directory schema, admin tools, and booking infrastructure before any real integrations.

`service_providers` table: id, provider_name, category (enum: transport/home_services/health/legal_financial/meals/tech_help), description, service_area (text), contact_email, contact_phone, is_vetted (boolean), is_active, hourly_rate_cents (nullable), commission_pct, stripe_connect_account_id (nullable), rating_avg, rating_count.

`service_bookings` table: id, member_id, provider_id, service_category, service_description, requested_date, requested_time, duration_minutes, status (enum: requested/confirmed/completed/cancelled), total_amount_cents, platform_fee_cents, provider_payout_cents, stripe_payment_intent_id (nullable), rating (1–5, nullable), rating_note (text, nullable).

`service_provider_ratings` table: id, booking_id, member_id, provider_id, rating (1–5), note text, created_at.

**Services hub** (`/app/dashboard/services`): landing page with 6 service category cards. Each category links to its own page. "Request help" flow: describe need → platform matches to vetted provider or dispatches via integration stub.

Admin provider directory (`/app/admin/providers`): add/edit/vet providers, view bookings, see ratings.

Create `/lib/interfaces/TransportProvider.ts`, `/lib/interfaces/MealProvider.ts`, etc. and stubs for each.

**Test:** Admin adds a test provider. Member navigates to Services hub and sees 6 categories. "Request help" creates a `service_bookings` row with `status = requested`. Admin sees the booking.

---

### Phase 51 — Transportation
**Deliverable:** Members book rides to appointments, errands, and events — by app, voice, or concierge.

- **Lyft Healthcare integration** (stub/real pattern): `LyftHealthcareProvider` implementing `TransportProvider` interface. Real integration requires Lyft Healthcare API access — use stub with real interface until credentials obtained.
- **NEMT provider network**: manual dispatch stub — creates booking row, notifies admin to coordinate with local NEMT provider via email
- **Volunteer driver matching**: integrates with volunteer system (Phase 31) — transport request creates volunteer match request for drivers in member's area
- **Booking flow**: date, time, pickup address (pre-filled from member profile), destination, trip type (medical/errand/social/family visit/grocery), recurring trip option (e.g. "every Tuesday dialysis")
- **Family visibility**: optional real-time trip status sharing on family dashboard
- **Driver vetting**: all paid drivers pulled from `service_providers` with `is_vetted = true`
- **Senior-preferred driver**: member can save a preferred driver ID to their profile

**Test:** Transport booking creates correct row. Volunteer driver match request created for volunteer-sourced trips. Recurring trip creates scheduled series. Family dashboard shows trip status (stub: "Driver assigned").

---

### Phase 52 — Home Services
**Deliverable:** Members book vetted local providers for home maintenance, cleaning, and grocery delivery.

- **Vetted provider directory**: filtering by service type (cleaning/lawn/handyman/plumbing/electrical/home_safety) and member's zip code
- **Grocery delivery stubs**: `InstacartProvider` and `AmazonFreshProvider` implementing `MealProvider` interface. AI-assisted grocery list: navigator or family can prefill a standard list in member profile; grocery order pre-populates from it
- **Tech help services**: bookable from this category — student network and paid tech specialists visible (links to Phase 33 + paid companion system)
- **Home safety assessment**: virtual or in-person assessment for fall risk and accessibility. Creates a follow-up task for navigator with findings
- **Seasonal reminders cron**: checks member profile for relevant seasonal tasks (HVAC filter, smoke detector, winter prep) and pushes Realtime reminders

**Test:** Browse providers filtered by zip code returns correct results. Grocery order stub logs what would be ordered. Home safety assessment creates navigator task. Seasonal reminder notification appears.

---

### Phase 53 — Health Services (Telehealth & Care Navigation)
**Deliverable:** Telehealth facilitation, medication management, and mental health warm referrals.

- **Telehealth facilitation**: member or navigator can initiate a Teladoc or MDLive session for the member. Creates a telehealth_sessions row. Navigator does warm handoff — does not just send a link. Integration: stub `TeladocProvider` with real interface.
- **Medication management enhancements**: medication adherence dashboard on navigator console (which members missed, patterns, 72-hour non-adherence flag). Pharmacist consult referral: navigator can initiate a referral from navigator console.
- **Exercise and physical therapy**: virtual PT and chair yoga events (extends Phase 37 virtual events with a `health` category). Fall prevention exercise programs surfaced in member dashboard.
- **Mental health partner referrals**: navigator creates referral in platform (not just a phone number). First appointment facilitation tracked. Telehealth mental health sessions for appropriate plan tiers.

**Test:** Telehealth session creates row. Navigator can see medication adherence per member. Mental health referral creates a tracked record. Exercise events appear in health category on events page.

---

### Phase 54 — Legal & Financial Services Hub
**Deliverable:** Vetted advisor directory, document vault, benefits navigation, fraud protection.

- **Trusted advisor directory** (`/app/dashboard/services/legal-financial`): elder law attorneys, financial advisors, benefits counselors. Advisors pay to be listed and are vetted by platform. Member sees unbiased referral matching based on their profile (location, needs, plan tier).
- **Benefits navigation** (enhances Phase 43): navigator can create a "benefits application in progress" record linked to a specific benefit. Tracks status (not started / in progress / submitted / received). Family can see which benefits are being pursued.
- **Document vault** (`/app/dashboard/documents`): secure storage for advance directives, insurance cards, estate documents, medical records. Supabase Storage encrypted at rest. Files linked to `document_vault_items` table. Navigator and designated family members can access with permission. Automatic reminders: advance directive review every 3 years.
- **Fraud protection alerts**: weekly push notification (Realtime) with current elder fraud scheme summaries. Trusted contact registry: member designates who can be contacted if fraud suspected.
- **Free 30-minute legal consultation**: included in Complete and Premier plans. Navigator books via scheduling tool.

**Test:** Document uploads and retrieves correctly. Advisor directory returns vetted providers only. Fraud alert Realtime notification sends on schedule. Benefits application progress tracked.

---

### Phase 55 — Meals & Nutrition
**Deliverable:** Meal delivery, social dining events, and nutrition planning fully integrated.

- **Meal delivery partnerships**: Meals on Wheels local chapter (API stub + manual dispatch), Silver Cuisine stub, Magic Kitchen stub. Member-facing order flow: date, dietary preferences (pre-filled from profile), delivery address.
- **Nutrition planning**: registered dietitian referral via navigator console (same warm-handoff model as mental health). AI tracks dietary patterns from check-in calls ("haven't been eating much") and flags to navigator. Dietary preferences and restrictions stored on member profile — all services respect them.
- **Social dining events**: platform-organised group meals at restaurants with other members. Created as `local_events` with `event_type = social_dining`. Transport coordination included.
- **Cooking groups** (extends Phase 40 skill exchange and Phase 37 virtual events): cooking skill exchange sessions and cooking demo virtual events unified under meals hub.

**Test:** Meal delivery order creates row with correct dietary preferences. Social dining event creates local_event with transport option. Nutrition flag from check-in appears as navigator notification.

---

### Phase 56 — On-Demand Tech Help Services
**Deliverable:** In-home tech assistance, helpline, and scam education fully operational.

- **Tech helpline**: dedicated phone number (a second concierge line variant, Phase 20). Patient, trained tech guides. No script, no time pressure. Calls logged and summarised same as regular concierge.
- **In-home tech help booking**: bookable from home services hub (Phase 52) with `service_type = tech_help`. Student volunteers (Phase 33) and paid tech companions both appear with different price indicators.
- **Scam and phishing education**: monthly virtual event (extends Phase 37 event system with `event_type = tech_safety`). Content generated by platform + AI. Resources page at `/app/dashboard/resources/tech-safety`.
- **Video tutorial library** (`/app/dashboard/resources/tutorials`): large-text, slow-paced guides on common tasks. Videos stored in Supabase Storage. Categorised by topic.

**Test:** Tech help booking creates service_booking row. Tech helpline call logs and summarises. Scam education event appears on events calendar. Tutorial page loads with video links.

---

## M18 — Enterprise

### Phase 57 — Outcomes Dashboard
**Deliverable:** Aggregate platform metrics for B2B sales. Per-employer reporting with PDF export.

Public outcomes page: anonymised aggregate stats. Enterprise dashboard: per-employer Recharts charts (enrolment trend, check-in completion rate, wellness score trend, alert volume, navigator utilisation), date range picker. PDF report via Puppeteer: employer logo, key metrics, Claude-generated narrative summary.

**Test:** All charts render with 90+ days of real data. PDF generates correctly. No individual member data in B2B exports.

---

### Phase 58 — AI Care Plan Generation
**Deliverable:** After 30 days of data, every member has a Claude-generated personalised care plan.

`care_plans` table. `generateCarePlan(memberId)`: fetches 30 days of calls + profile, calls Claude for structured JSON (wellnessSummary, topStrengths, areasForAttention, recommendedActions, communityOpportunities, familyTalkingPoints, nextReviewDate). Logs `claude_tokens_used` and `generation_cost_usd`. Console error if cost > $0.50. Family view and navigator view. Weekly cron generates plans for members with 30+ days of data and no current plan.

**Test:** All 7 JSON sections present. Cost logged. Navigator can add notes without overwriting AI content.

---

### Phase 59 — Medicare Advantage Reporting API
**Deliverable:** HIPAA-compliant API for insurance partners to pull anonymised outcomes.

`enterprise_api_keys` table. API endpoint: authenticated by partner key. Returns aggregated data only — minimum cohort size 10 (HIPAA re-identification prevention, enforced server-side). All requests logged in `api_access_log`. Rate limited: 100 requests/partner/day.

**Test:** Authenticated request returns correct aggregated data. Unauthenticated → 401. Cohort < 10 → data suppressed. Every request logged.

---

### Phase 60 — University Partnership Portal (Full)
**Deliverable:** Full university admin and student portal with official service records.

Enhancement of Phase 33: add university admin PDF service record generator, semester CSV bulk export, official service record with platform seal and signature, Annual Intergenerational Showcase coordination tools.

**Test:** Service record PDF accurate. Semester CSV complete. Showcase event created by admin.

---

### Phase 61 — Full Multilingual Platform
**Deliverable:** Full platform translated into 12 languages with professional review.

All pages translated. Professional human translation for health-critical strings — not machine-translation alone. All 12 cultural circles have language settings applied. Language Line fully live on concierge line and tech helpline.

**Test:** All pages in Spanish show no raw translation keys. Native speaker review complete. Language Line confirmed for 3+ non-English test calls.

---

## Cross-Phase Notes

### What runs continuously across all milestones
- HIPAA compliance review (quarterly): BAAs, audit logs, RLS policies
- Senior UX usability testing (real 65+ users) before each milestone's first release
- Navigator caseload monitoring: 1:150 ratio tracked weekly from M7
- Churn analysis by cohort (monthly from M11 onward)
- Volunteer background check pipeline (Checkr) for all adult volunteers with direct senior contact
- Stub → real service transitions via `providers.ts` only — application code never changes

### Dependency map
```
M1 Foundation → M2 Member Data → M3 UI → M4 Realtime → M5 Alerts → M6 Family Dashboard
→ M7 Navigator → M8 AI Calls → M9 Concierge → M10 Notifications → M11 Billing → M12 Compliance
→ M13 Volunteers → M14 Community → M15 Celebrations → M16 Grief → M17 Services → M18 Enterprise
```

### Key risk flags
1. **Retell AI HIPAA BAA** — verify before Phase 18. If unavailable, evaluate Bland AI.
2. **Navigator 1:150 ratio** — grief/crisis situations can break it. Track from Phase 16.
3. **Stripe Connect complexity** — companion payouts (Phase 32) and services marketplace (Phase 50+) require Connect onboarding per provider. Budget 1–2 weeks.
4. **Lyft Healthcare API access** — commercial agreement required. Start outreach when Phase 51 begins.
5. **Professional translation** — 12 languages × health-critical strings takes 3–4 weeks. Commission in Phase 41.
6. **Phase creep** — do not begin M13+ until M12 compliance gate passes and real members are enrolled.

---

*Document version: 3.0 — Full 5-layer architecture, 61 phases, all spec features included*
*Source: ThriveAtHome_Platform_Specs_Comprehensive.docx + Claude Coding Plan*
