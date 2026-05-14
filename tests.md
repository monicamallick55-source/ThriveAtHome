# Thrive@Home — Test Suite (v3.0)

> **Every test must pass before the corresponding phase is marked complete.**
> `[AUTO]` = run with a script. `[MANUAL]` = requires a human or real device. `[LIVE]` = calls a real external service (costs money/credits).
> A test is "passed" only when the expected output is personally observed. "It probably works" is not a passing test.

---

## M1 — Foundation

### Phase 1 — Project Scaffold

**T1.1** `[MANUAL]` Open Vercel deployment URL in browser. Expected: "Thrive@Home" in navy text, tagline in teal, zero console errors.

**T1.2** `[MANUAL]` Push trivial change to `main`. Expected: Vercel shows new deployment within 60 seconds. Deployment succeeds (green checkmark).

**T1.3** `[AUTO]` `npx tsc --noEmit` → zero errors.

**T1.4** `[MANUAL]` `echo "TEST=secret" > .env.local && git status` → `.env.local` under "Untracked files" ONLY, never under "Changes to be committed".

**T1.5** `[MANUAL]` Open `.env.local.example` — confirm all 34 variable names present, all values blank.

**T1.6** `[MANUAL]` `ls lib/interfaces/` → 8 interface files present: CallProvider, SmsProvider, EmailProvider, AiProvider, BillingProvider, TransportProvider, MealProvider, GoodsProvider.

**T1.7** `[MANUAL]` `ls lib/stubs/` → 8 stub files present (one per interface).

**T1.8** `[AUTO]` Verify all providers export stub instances when env vars absent:
```bash
node -e "const p = require('./lib/providers'); console.log(Object.keys(p).map(k => p[k].constructor.name).join(', '))"
```
Expected: all names contain "Stub".

---

### Phase 2 — Supabase Connection

**T2.1** `[MANUAL]` Navigate to `/test`. Expected: database message appears, matches what was inserted.

**T2.2** `[MANUAL]` Corrupt `NEXT_PUBLIC_SUPABASE_URL`, restart dev server. Expected: human-readable error about missing/invalid env var — not a raw stack trace.

**T2.3** `[AUTO]` After deleting test page and table: `npx tsc --noEmit` → zero errors.

---

### Phase 3 — Database Schema

**T3.1** `[MANUAL]` Supabase → Table Editor: confirm all 43 tables visible.

**T3.2** `[MANUAL]` Supabase → Database → Foreign Keys: confirm all FK relationships present.

**T3.3** `[MANUAL]` Test cascade delete:
```sql
INSERT INTO members (full_name, phone_number, plan_tier, status) VALUES ('Test', '+15550001234', 'basics', 'active') RETURNING id;
-- Copy id, then:
INSERT INTO family_members (member_id, full_name, email, role) VALUES ('[id]', 'Test Family', 'test@test.com', 'family');
DELETE FROM members WHERE full_name = 'Test';
SELECT * FROM family_members WHERE email = 'test@test.com';
```
Expected: family_members row deleted by cascade. Clean up.

**T3.4** `[MANUAL]` Supabase → Database → Replication: `realtime_notifications` enabled for INSERT.

**T3.5** `[AUTO]` Confirm audit triggers:
```sql
SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_schema = 'public' ORDER BY event_object_table;
```
Expected: `members_audit`, `calls_audit`, `alerts_audit` present.

---

### Phase 4 — Row Level Security

**T4.1** `[MANUAL]` Supabase → Authentication → Policies: ALL tables show "RLS enabled".

**T4.2** `[AUTO]` Cross-user isolation test (see prompt.md Phase 4 for full script). Expected: User A cannot read User B's member data. Own data accessible. Admin service role reads all.

**T4.3** `[MANUAL]` Same cross-user test on `realtime_notifications` table. Expected: User A cannot see User B's notifications.

---

## M2 — Member Data

### Phase 5 — Authentication

**T5.1** `[MANUAL]` Sign up at `/signup`. Expected: Auth user + `family_members` row created. Redirected to `/dashboard`.

**T5.2** `[MANUAL]` Log out, navigate to `/dashboard`. Expected: immediately redirected to `/login`.

**T5.3** `[MANUAL]` Log out, navigate to `/navigator` and `/admin`. Expected: both redirect to `/login`.

**T5.4** `[MANUAL]` Set a user's role to `navigator` in Supabase. Log in. Expected: lands on `/navigator`, not `/dashboard`.

**T5.5** `[MANUAL]` As `family` role, type `/navigator` in URL bar. Expected: immediately redirected to `/dashboard`.

**T5.6** `[MANUAL]` Simulate failed `family_members` insert. Expected: Supabase Auth user also deleted (rollback). User sees clear error. No orphaned auth user.

---

### Phase 6 — Member Onboarding Form

**T6.1** `[MANUAL]` Click "Next" on Step 1 with all fields empty. Expected: errors on every required field. Does NOT advance.

**T6.2** `[MANUAL]` Enter `abc-def-ghij` as phone. Expected: format validation error.

**T6.3** `[MANUAL]` Enter today's date as DOB. Expected: error — must be at least 60 years old.

**T6.4** `[MANUAL]` Complete all 3 steps. Expected: member row in Supabase, `plan_tier = 'basics'`, confirmation shows correct preferred name.

**T6.5** `[MANUAL]` Partially fill form, refresh page. Expected: form data preserved (localStorage).

**T6.6** `[MANUAL]` Complete form on real phone at 375px. Expected: no horizontal scroll, all buttons tappable.

**T6.7** `[MANUAL]` Check new member's `plan_tier`. Expected: `basics` (not null, not empty).

---

### Phase 7 — App Data Layer & Seed Data

**T7.1** `[AUTO]` Run `/scripts/test-data-layer.ts`:
- Create member → confirm row exists with correct fields
- Fetch by valid ID → returns typed data
- Fetch by invalid UUID → returns `{ data: null, error: 'not found' }` not a crash
- Get active alerts (empty) → returns `[]` not error
- Run twice (idempotency) → no duplicate rows created

**T7.2** `[AUTO]` Run `/scripts/seed-test-data.ts`. Expected: "Seed complete. Login: test-family@thriveathome.dev / TestPassword123!" printed. Check Supabase: Margaret Chen member row, 14 call rows, 2 alert rows, 2 notification rows.

**T7.3** `[AUTO]` Run `/scripts/clear-test-data.ts`. Expected: all seeded rows deleted.

**T7.4** `[AUTO]` `npx tsc --noEmit` → zero errors.

---

## M3 — UI System

### Phase 8 — Primitive UI Components

**T8.1** `[MANUAL]` Navigate to `/test-ui`. Visually confirm all 13 components render in all variants.

**T8.2** `[MANUAL]` Tab through all components using only keyboard. Expected: every interactive element reachable, focus ring always visible, Enter/Space activates buttons.

**T8.3** `[MANUAL]` `NotificationBell` shows "0" count. Click it: dropdown opens. Confirm no hardcoded data.

**T8.4** `[AUTO]` `npx tsc --noEmit` → zero errors. Then delete test-ui page.

---

## M4 — Realtime Notifications

### Phase 9 — Supabase Realtime

**T9.1** `[MANUAL]` Open family dashboard for seeded member in one tab. In SQL Editor:
```sql
INSERT INTO realtime_notifications (member_id, type, title, body, severity)
VALUES ('[MARGARET_CHEN_ID]', 'new_alert', 'Test Alert', 'Realtime test notification.', 'concern');
```
Expected: Toast notification appears in dashboard tab within 2 seconds — no page refresh. Bell count increments.

**T9.2** `[MANUAL]` Click bell. Expected: dropdown shows notification.

**T9.3** `[MANUAL]` Click "Mark read". Expected: bell count → 0. Supabase row: `read = true`, `read_at` timestamp.

**T9.4** `[MANUAL]` As User A (linked to Member A), insert notification for Member B. Expected: User A does NOT see it.

**T9.5** `[AUTO]` Call `pushRealtimeNotification` with a non-existent `member_id`. Expected: function logs error but does NOT throw. Calling code continues.

---

## M5 — Alert Engine

### Phase 10 — Alert Logic & Detection

**T10.1** `[AUTO]` Alert rules test:
```ts
// Crisis → emergency alert + emergency_log entry
// Fall → urgent alert
// Medication miss (single) → informational
// Mood ≤ 3 → concern mood_drop
// Confirm each creates correct severity
```
Expected: all rule-severity mappings correct.

**T10.2** `[AUTO]` Deduplication test: call `createCallAlerts` twice with same type for same member within 24 hours. Expected: exactly 1 alert row, not 2.

**T10.3** `[MANUAL]` After alert created, open family dashboard. Expected: Realtime notification appears within 2 seconds — no page refresh.

**T10.4** `[AUTO]` Wellness drift: insert 14 calls with declining scores (8,8,7,8,7,6,7,6,5,6,5,5,4,5). Run `checkWellnessDrift`. Expected: `concern` alert created. Insert 14 flat calls at score 6. Run again. Expected: no new alert.

**T10.5** `[AUTO]` Insufficient data check: insert only 3 calls. Run `checkWellnessDrift`. Expected: no alert, no error.

---

### Phase 11 — Crisis Detection

**T11.1** `[AUTO]` Send transcript containing "I don't want to be here anymore". Confirm within 60 seconds: emergency_log row with triggered phrase, emergency alert in alerts, critical navigator task, emergency Realtime notification. Stubs log urgent SMS and email.

**T11.2** `[AUTO]` Send normal transcript. Expected: no emergency alert, no false positive.

**T11.3** `[AUTO]` Send "I don't want to be here — I'd rather be at the beach!" Expected: disambiguation runs → no crisis (non-crisis context). Confirm no false positive.

**T11.4** `[AUTO]` Simulate Anthropic API failure during disambiguation (mock to throw). Expected: function returns `true` (defaults to crisis). All 4 escalation steps still fire.

---

## M6 — Family Dashboard

### Phase 12 — Family Dashboard

**T12.1** `[MANUAL]` Log in as seeded family member. Navigate to `/dashboard`. Expected: loads within 3 seconds. Senior's name visible. No "undefined". StatusDot visible. NotificationBell shows "1" (one unread from T9.1).

**T12.2** `[MANUAL]` While dashboard open, insert new alert via SQL Editor. Expected: alert card appears within 2 seconds — no page refresh. StatusDot updates.

**T12.3** `[MANUAL]` View health timeline. Toggle between 7-day, 30-day, 60-day, 90-day tabs. Expected: chart renders for each. AI trend summary text changes.

**T12.4** `[MANUAL]` Break Supabase URL temporarily, reload dashboard. Expected: friendly error message — no raw error code visible.

**T12.5** `[MANUAL]` View dashboard on real phone at 375px. Expected: no horizontal scroll, all text readable, all buttons tappable.

---

### Phase 13 — Call History

**T13.1** `[MANUAL]` With 14+ seeded calls, navigate to `/dashboard/history`. Expected: calls listed newest-first, mood emoji, medication ✓/✗, alert badges.

**T13.2** `[MANUAL]` Click "View summary". Expected: full AI summary + scores + plain-English flags.

**T13.3** `[MANUAL]` With 25+ calls: load-more button appears. Clicking it appends more calls without page reload.

---

### Phase 14 — Family Coordination Tools

**T14.1** `[MANUAL]` Create a task as one family member. Log in as another family member linked to the same senior. Expected: task visible without page reload (Realtime).

**T14.2** `[MANUAL]` Send a message in family messaging. Expected: message appears for all linked family members in real time.

**T14.3** `[MANUAL]` Upload a document to document vault. Expected: file retrievable. Supabase Storage row visible.

**T14.4** `[MANUAL]` Set a family member's `last_login_at` to 8 days ago in Supabase. Ensure member has an unacknowledged concern alert. Trigger family nudge cron. Expected: `family_nudge` Realtime notification pushed for that family member.

---

## M7 — Navigator Console

### Phase 15 — Navigator Console

**T15.1** `[MANUAL]` Log in as navigator. Navigate to `/navigator`. Expected: only assigned members visible (not all members). Members with alerts sorted to top.

**T15.2** `[MANUAL]` Acknowledge an urgent alert. Expected: card disappears without reload. DB: `acknowledged = true`, `acknowledged_by = navigatorUserId`, `acknowledged_at` timestamp.

**T15.3** `[MANUAL]` Click a member row. Expected: panel slides in with preferred name, age, plan tier, AI brief (stub text in M7), last 5 summaries.

**T15.4** `[MANUAL]` Save a navigator note. Expected: saving → saved ✓ → persists after close/reopen.

**T15.5** `[MANUAL]` Press Escape with panel open. Expected: panel closes, focus returns to triggering row.

**T15.6** `[MANUAL]` As `family` role, type `/navigator` in URL bar. Expected: redirected to `/dashboard`.

---

### Phase 16 — Digest Scheduling

**T16.1** `[MANUAL]` Trigger weekly digest cron manually with CRON_SECRET. Expected: console shows `[StubEmail] Would send weekly digest to [email] for Margaret Chen`. One log per active member.

**T16.2** `[MANUAL]` Trigger cron without CRON_SECRET. Expected: 401 response.

---

## M8 — AI Calls

### Phase 17 — Anthropic AI Provider

**T17.1** `[AUTO]` Happy transcript → `mood_score ≥ 7`, `medication_taken = true`, `energy_score ≥ 7`.

**T17.2** `[AUTO]` Difficult transcript ("I've been really down, pain is an 8 out of 10, forgot my pills") → `mood_score ≤ 4`, `pain_score ≥ 8` (comfort = 2), `medication_taken = false`.

**T17.3** `[AUTO]` "Fell asleep watching TV" → NO fall flag.

**T17.4** `[AUTO]` "Pain is a 3 out of 10" → NO pain_high flag (threshold is > 7).

**T17.5** `[AUTO]` Brief transcript (topic not discussed) → `medication_taken = null`, never `false`. `energy_score = null`, never `0`.

**T17.6** `[LIVE]` Real Claude summary: no forbidden words (patient, vitals, symptoms, assessment, diagnosis). No numbers or scores. 3–5 sentences. Warm tone.

**T17.7** `[AUTO]` Disambiguation API failure (mock to throw) → returns `true`.

**T17.8** `[MANUAL]` Confirm `aiProvider.constructor.name === 'AnthropicAiProvider'` (not Stub).

---

### Phase 18 — Retell AI Agent

**T18.1** `[LIVE]` Test call to own phone. Expected: rings within 15 seconds, warm female voice, "Aria from Thrive@Home" introduction, natural conversation.

**T18.2** `[LIVE]` Test call with Margaret Chen prompt. Expected: Aria says "Margaret", mentions gardening OR books naturally, does not use checklist tone.

**T18.3** `[LIVE]` Say "I've been feeling really hopeless." Expected: Aria responds warmly, says team will be in touch, does NOT end call abruptly.

**T18.4** `[LIVE]` After test call, Retell AI → Call History: call logged with recording and transcript.

---

### Phase 19 — Call Infrastructure, Scheduler & Webhook

**T19.1** `[LIVE]` Trigger cron with CRON_SECRET. Expected: `check_in_calls` row created with `status = scheduled`. Phone rings within 2 minutes. Console: "1 scheduled, 0 skipped, 0 failed".

**T19.2** `[MANUAL]` Trigger cron second time immediately. Expected: no duplicate call. Console: "0 scheduled, 1 skipped".

**T19.3** `[MANUAL]` Trigger cron without CRON_SECRET. Expected: 401 response.

**T19.4** `[MANUAL]` Send test webhook payload with correct Authorization. Expected: `check_in_calls` row updated with transcript and timestamps. Response: `{"received": true}`.

**T19.5** `[MANUAL]` Send webhook without Authorization header. Expected: 401.

**T19.6** `[LIVE]` After real call completes and webhook fires: `mood_score` is 1–10 (not 0, not null if discussed). `ai_summary` warm, no forbidden words. Realtime: `call_summary_ready` notification appears on dashboard within 30 seconds.

**T19.7** `[MANUAL]` Send crisis transcript via webhook. Expected within 60 seconds: emergency_log row, emergency alert, critical navigator task, emergency Realtime notification. Stubs log urgent SMS and email.

---

## M9 — Concierge Line

### Phase 20 — Concierge Line

**T20.1** `[LIVE]` Call the concierge number. Expected: rings, warm greeting ("How can I help you today?").

**T20.2** `[LIVE]` Say "I need a ride to the doctor tomorrow." Expected: `service_bookings` row created with `service_category = transport`. Console (stub): "[StubTransport] Would book ride..."

**T20.3** `[LIVE]` Say "I just want to talk to someone." Expected: volunteer match queue request created. Realtime notification to navigator.

**T20.4** `[LIVE]` Say "I don't want to be here anymore." Expected: full crisis escalation fires (same as T11.1).

**T20.5** `[LIVE]` Say "I need to speak with a real person." Expected: Twilio transfers call to `ONCALL_NAVIGATOR_PHONE` within 2 minutes.

**T20.6** `[MANUAL]` Check that all concierge calls are transcribed and logged in `check_in_calls` with `call_type = 'concierge'`.

---

## M10 — Outbound Notifications

### Phase 21 — Twilio SMS

**T21.1** `[LIVE]` Complete test call. Family member (sms: true) receives SMS within 5 minutes. SMS starts with "Thrive@Home update for [Name] 💚". Ends with "Reply STOP to unsubscribe". `notification_log` shows `status = sent`.

**T21.2** `[LIVE]` Set family member `notification_prefs.sms = false`. Complete call. Expected: no SMS. `notification_log` shows no SMS attempt.

**T21.3** `[LIVE]` Create emergency alert. Trigger `sendUrgentAlertSMS`. Expected: SMS arrives within 60 seconds even for family member with `sms: false`.

**T21.4** `[MANUAL]` Confirm `smsProvider.constructor.name === 'TwilioSmsProvider'`.

---

### Phase 22 — SendGrid Email

**T22.1** `[LIVE]` Complete test call. Email arrives within 30 minutes. Subject has name + emoji. Body: score bars, AI summary, CTA button, unsubscribe link.

**T22.2** `[MANUAL]` Open email on real phone. Expected: no cut-off, readable without zoom, button tappable.

**T22.3** `[MANUAL]` Open email in Gmail specifically. Expected: score bars render correctly.

---

### Phase 23 — Medication Reminders & Full Pipeline

**T23.1** `[LIVE]` Set medication reminder 2 minutes away, trigger cron. Expected: SMS arrives within 3 minutes with 💊 emoji.

**T23.2** `[AUTO]` Insert 3 consecutive `medication_taken = false` calls. Expected: concern alert + navigator task + Realtime notification. No duplicate on 4th miss.

**T23.3** `[LIVE]` Full pipeline after real call: Realtime appears within 30 seconds, SMS within 5 minutes, email within 30 minutes. All 3 logged as `sent` in `notification_log`.

---

## M11 — Billing

### Phase 24 — Pricing Page & Stripe Setup

**T24.1** `[MANUAL]` Navigate to `/pricing`. Four plan cards visible with correct prices and features.

**T24.2** `[AUTO]` All 4 Stripe price IDs present and start with `price_`.

**T24.3** `[MANUAL]` Stripe dashboard → Webhooks: endpoint registered, enabled, 5 events selected.

---

### Phase 25 — Plan Selection & Checkout

**T25.1** `[LIVE]` Complete onboarding form: Step 4 (plan selection) now appears. Selecting plan redirects to Stripe Checkout.

**T25.2** `[LIVE]` Complete payment with card `4242 4242 4242 4242`, expiry `12/34`, CVC `123`. Expected: redirected to `/dashboard?subscribed=true`. Welcome banner visible. `subscriptions` row in Supabase `status = active`. Stripe shows Customer + Subscription.

**T25.3** `[LIVE]` Stripe CLI replay all 5 webhook events. Expected: each updates Supabase correctly. `payment_failed` → family receives payment failure email. `subscription.deleted` → `status = cancelled`.

**T25.4** `[MANUAL]` POST to webhook without `stripe-signature`. Expected: 401.

**T25.5** `[MANUAL]` Previously enrolled member (plan_tier = basics) logs in. Expected: plan upgrade prompt visible.

---

### Phase 26 — Billing Management

**T26.1** `[MANUAL]` Navigate to `/dashboard/billing`. Expected: current plan, next billing date, 6 invoices, 3 buttons.

**T26.2** `[MANUAL]` Click "Change plan". Expected: Stripe Customer Portal opens.

---

## M12 — Compliance

### Phase 27 — HIPAA Baseline

**T27.1** `[MANUAL]` Access app via `http://` (not https). Expected: automatically redirected to `https://`.

**T27.2** `[MANUAL]` Read a member record while logged in as family user. Check `audit_log` table. Expected: entry created with `action = SELECT`, `resource_type = members`, correct `user_id`.

**T27.3** `[MANUAL]` POST to `/api/admin/delete-member` without admin auth. Expected: 401 or 403.

**T27.4** `[MANUAL]` POST with admin auth and valid member ID. Expected: all member rows deleted across all tables. Response confirms deletion.

**T27.5** `[MANUAL]` Navigate to `/privacy`. Expected: page loads with readable privacy policy covering collection, retention, sharing, deletion rights.

---

### Phase 28 — Accessibility & 65+ Usability

**T28.1** `[AUTO]` Run axe-cli on all main pages:
```bash
npx axe-cli [URL] --tags wcag2aa
npx axe-cli [URL]/login --tags wcag2aa
npx axe-cli [URL]/onboarding --tags wcag2aa
npx axe-cli [URL]/dashboard --tags wcag2aa
npx axe-cli [URL]/pricing --tags wcag2aa
npx axe-cli [URL]/dashboard/services --tags wcag2aa
```
Expected: zero violations on all pages.

**T28.2** `[MANUAL]` Navigate entire onboarding → dashboard flow using only keyboard. Expected: every element reachable, focus ring always visible.

**T28.3** `[MANUAL]` Real 65+ person completes onboarding without assistance in under 10 minutes. Understands dashboard without explanation. Document every confusion point and fix all.

---

## M13 — Volunteer Network

**T29.1** Submit application → row created with `status = pending`. Admin receives email. Approval → `background_check`.

**T30.1** Approval triggers Checkr API call (test mode). Webhook updates status. `clear` → `active`.

**T31.1** Member [gardening, cooking] in SF matched higher than member without shared interests. Introduction email: no phone numbers or email addresses.

**T32.1** Volunteer logs in → only matched members visible. Visit logged → `volunteer_visits` row. Impact stats update.

**T33.1** Student logs 2-hour visit. PDF service record shows correct data. Semester CSV accurate.

**T34.1** School admin creates student group. Activity logged. No direct contact info visible to either party.

**T35.1** Veteran volunteer matched to veteran member. VA benefits session logged. VSO coordinator sees volunteer hours.

**T36.1** Training module completed → `volunteer_training_completions` row. Certificate issued. Training required before first assignment is enforced. Badge awarded at correct hour milestone (50, 100, 250, 500).

---

## M14 — Community Layer

**T37.1** RSVP to event → dial-in details visible. Post-event SMS "Reply YES" → `attended = true`. Recording uploaded to Supabase Storage.

**T38.1** RSVP local event with transport → both `local_event_rsvp` and `transport_booking` rows created.

**T39.1** Interest group created. Members join. AI discussion prompts appear. 3+ members share interest → new group suggestion created.

**T40.1** 2 members at credit balance 0. Exchange completes → teacher +1, learner -1. Atomicity: injected failure mid-transaction → neither balance changes.

**T41.1** All 12 circle seeds confirmed. Join → membership + count increments. RSVP → dial-in shows to RSVP'd users only. Admin announcement broadcasts to all circle members.

**T42.1** Spanish member: onboarding/dashboard/billing render entirely in Spanish. Zero raw translation keys. Native speaker review complete.

**T43.1** Low-income California veteran → VA Aid & Attendance + 3+ benefits. Non-veteran >$50k → no VA benefit. Every result shows specific qualifying reason.

**T44.1** Demo request → `employer_leads` row + sales email. Employee invitation accepted → linked to employer account. Utilisation report accurate.

---

## M15 — Celebrations & Life Stories

**T45.1** Set DOB 7 days away. Trigger cron. Expected: family notification email with personalised (not generic) gift suggestions. Set DOB to today. D-0: community post created + modified check-in prompt used. Milestone birthday (set DOB to 70th birthday year) → flagged for coordinator.

**T45.2** Set `celebration_opt_out = true` for a member. Expected: no community post, no nudges.

**T46.1** Written entry created. Appears in life story feed. Voice memo uploads to Supabase Storage. Entry marked public → appears in cultural circle feed. Navigator creates interview response entry. Tribute entry links to loss record.

---

## M16 — Grief & Life Transitions

**T47.1** Milestone birthday D-0 → `goodsProvider` stub logs birthday card order for milestone birthday. Admin manual trigger from navigator console → stub logs.

**T48.1** Submit grief support request. Expected: care team email arrives within 2 minutes. If email fails, retry once after 30 seconds, then create critical navigator task.

**T48.2** Set loss date to 6 months ago. Set `November 15` as test date. Trigger celebratory nudge system. Expected: nudge suppressed for this member.

**T48.3** Insert isolation + appetite change + confusion signals for a member over 90 days. Run grief monitoring detection. Expected: care team alert fires.

**T49.1** Create nursing home transition record for a member. Expected: navigator task created + community farewell event offered. Member's AI check-in tone switches to transition mode.

**T49.2** Create cognitive diagnosis transition. Expected: advance directive prompt appears on family dashboard. Dementia-specific resources surfaced.

---

## M17 — Services Marketplace

**T50.1** Admin adds test provider to directory. Member navigates to `/dashboard/services` → 6 category cards visible. "Request help" creates `service_bookings` row with `status = requested`. Realtime notification fires to navigator.

**T51.1** Transport booking creates `transport_bookings` row. For volunteer-driver trip: volunteer match request created. Recurring trip creates scheduled series. Family dashboard shows trip status ("stub_confirmed").

**T52.1** Browse home service providers filtered by zip code. Grocery order stub logs what would be ordered with correct dietary restrictions.

**T53.1** Telehealth session creates `service_bookings` row with telehealth type. Warm handoff note visible in navigator console. Mental health referral tracked in `service_bookings`.

**T54.1** Document uploads and retrieves. Advisor directory returns only `is_vetted = true` providers. Fraud alert Realtime notification pushes on weekly schedule. Benefits application progress tracked.

**T55.1** Meal delivery order creates row with correct dietary preferences from member profile. Social dining event creates `local_events` row with transport option.

**T56.1** Tech helpline call logs and summarises (same pipeline as concierge). Tech help booking creates `service_bookings` row. Scam education event appears in events calendar.

---

## M18 — Enterprise

**T57.1** Enterprise dashboard loads with 90+ days of real data. All charts render. PDF generates: correct metrics, no individual member data, employer name visible.

**T58.1** Generate care plan for member with 30+ days of data. All 7 JSON sections present and typed. `generation_cost_usd` logged and < $0.50.

**T59.1** Authenticated request → correct aggregated data. Unauthenticated → 401. Cohort < 10 → data suppressed. Every request in `api_access_log`.

**T60.1** Student service record PDF: student name, institution, itemised visits, total hours, platform seal. Semester CSV complete and accurate.

**T61.1** All pages in Spanish: zero raw translation keys. Native Spanish speaker reviews health-critical strings and confirms accuracy.
