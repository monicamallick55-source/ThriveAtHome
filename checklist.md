# Thrive@Home — AI Build Checklist

> **This file is maintained by the AI agent. Update it at the end of every session.**
> The human may read this file but should not edit it — it is the AI's tracking record.

---

## Status key

| Symbol | Meaning |
|--------|---------|
| `[ ]` | Not started |
| `[~]` | In progress — code written but tests not yet passed |
| `[A]` | Awaiting human approval — phase review presented, waiting for APPROVED |
| `[x]` | Complete — test passed AND human replied APPROVED |
| `[!]` | Blocked — cannot proceed without human input (see Blocked Items Log) |

**A phase is `[x]` only when both conditions are true:**
1. Every test in tests.md for that phase produced the expected result
2. The user replied APPROVED to the phase review

---

## How the AI uses this file

**Start of every session:**
1. Read the entire file
2. Find the first phase that is not `[x]`
3. That is the current phase — start there, not anywhere else
4. If the first non-`[x]` phase is `[A]`, wait for the human's APPROVED before touching code

**End of every session:**
1. Update phase statuses based on what was accomplished
2. Add any new blocked items to the Blocked Items Log
3. Update the environment variable table as variables are added
4. Update the service accounts table as services are configured

---

## Layer 1 — Core Product (Phases 1–12)

*Goal: Complete working product with Supabase Realtime notifications. No paid external services needed.*

| # | Phase | Status | Completion date | Notes |
|---|-------|--------|----------------|-------|
| 1 | Project Scaffold | `[ ]` | | |
| 2 | Supabase Connection | `[ ]` | | |
| 3 | Database Schema | `[ ]` | | |
| 4 | Row Level Security | `[ ]` | | |
| 5 | Authentication | `[ ]` | | |
| 6 | Member Onboarding Form | `[ ]` | | |
| 7 | App Data Layer | `[ ]` | | |
| 8 | Primitive UI Components | `[ ]` | | |
| 9 | Supabase Realtime Notifications | `[ ]` | | |
| 10 | Alert Logic | `[ ]` | | |
| 11 | Family Dashboard | `[ ]` | | |
| 12 | Navigator Console | `[ ]` | | |

**Layer 1 complete when:** All 12 phases are `[x]`. A family member can sign up, enrol a senior, see a real-time dashboard with alerts, and a navigator can manage their caseload — with no external paid service beyond Supabase.

**⛔ LAYER 1 GATE — required before Phase 13:**
- [ ] All 12 Layer 1 phases marked `[x]`
- [ ] User has confirmed Layer 1 with APPROVED at the Layer 1 Gate review
- [ ] At least one real test member enrolled and visible in Supabase
- [ ] Realtime notification visible in browser within 2 seconds of alert insert (tested live)

---

## Layer 2 — AI & Calls (Phases 13–17)

*Goal: Real AI check-in calls. Transcripts become scores, summaries, and alerts in real time.*

| # | Phase | Status | Completion date | Notes |
|---|-------|--------|----------------|-------|
| 13 | Anthropic AI Provider | `[ ]` | | |
| 14 | Retell AI Agent Setup | `[ ]` | | |
| 15 | Twilio & Retell Call Infrastructure | `[ ]` | | |
| 16 | Outbound Call Scheduler | `[ ]` | | |
| 17 | Call Webhook & Transcript Processing | `[ ]` | | |

**Layer 2 complete when:** A real call is made to a real phone, the transcript is processed into scores and a Claude summary, alerts fire from call content, and Realtime notification appears on the dashboard without refreshing.

**⛔ LAYER 2 GATE — required before Phase 18:**
- [ ] All 5 Layer 2 phases marked `[x]`
- [ ] User has confirmed Layer 2 with APPROVED at the Layer 2 Gate review
- [ ] At least 3 real test calls completed end-to-end
- [ ] Family dashboard shows real call data (not seed data)
- [ ] ANTHROPIC_API_KEY, RETELL_API_KEY, RETELL_AGENT_ID, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER all set in Vercel

---

## Layer 3 — Outbound Notifications (Phases 18–23)

*Goal: Real SMS and email replace stub notifications. Crisis escalation fully live.*

| # | Phase | Status | Completion date | Notes |
|---|-------|--------|----------------|-------|
| 18 | Twilio SMS Provider | `[ ]` | | |
| 19 | SendGrid Email Provider | `[ ]` | | |
| 20 | Post-Call Notification Pipeline | `[ ]` | | |
| 21 | Medication Reminders | `[ ]` | | |
| 22 | Wellness Drift (Fully Live) | `[ ]` | | |
| 23 | Call History Page | `[ ]` | | |

**Layer 3 complete when:** Family receives SMS within 5 minutes of a call, email within 30 minutes, crisis escalation sends real SMS to all family members and the on-call navigator, medication reminders fire on schedule.

**⛔ LAYER 3 GATE — required before Phase 24:**
- [ ] All 6 Layer 3 phases marked `[x]`
- [ ] User has confirmed Layer 3 with APPROVED at the Layer 3 Gate review
- [ ] At least 5 test users through the full call → Realtime → SMS → email flow
- [ ] SMS arrives within 5 minutes of call ending (tested with real phone)
- [ ] Email renders correctly in Gmail on mobile (tested manually)
- [ ] SENDGRID_API_KEY, SENDGRID_FROM_EMAIL, ONCALL_NAVIGATOR_PHONE all set in Vercel

---

## Layer 4 — Billing (Phases 24–29)

*Goal: Stripe subscription billing as a feature on top of a fully working product.*

| # | Phase | Status | Completion date | Notes |
|---|-------|--------|----------------|-------|
| 24 | Pricing Page (Static) | `[ ]` | | |
| 25 | Stripe Products & Config | `[ ]` | | |
| 26 | Plan Selection in Onboarding | `[ ]` | | |
| 27 | Checkout Flow & Stripe Webhook | `[ ]` | | |
| 28 | Billing Management Page | `[ ]` | | |
| 29 | Accessibility & Compliance Audit | `[ ]` | | |

**Layer 4 complete when:** A subscriber can select a plan, pay via Stripe, see their billing status, and manage their subscription — all verified with Stripe test cards. Zero WCAG 2.1 AA violations. 65+ real user completes onboarding without assistance.

**⛔ LAYER 4 GATE — required before switching to live Stripe keys:**
- [ ] All 6 Layer 4 phases marked `[x]`
- [ ] User has confirmed Layer 4 with APPROVED at the Layer 4 Gate review
- [ ] Test payment succeeded with card 4242 4242 4242 4242
- [ ] All Stripe webhook events handled correctly (tested via Stripe CLI)
- [ ] axe-cli shows zero WCAG 2.1 AA violations on all pages
- [ ] Real person aged 65+ completed onboarding without assistance
- [ ] All HIPAA BAAs signed: Supabase, Twilio, Retell AI, Anthropic, SendGrid
- [ ] User has explicitly confirmed they are ready to switch to live Stripe keys

---

## Overall progress

```
Layer 1  Core Product      [ ][ ][ ][ ][ ][ ][ ][ ][ ][ ][ ][ ]  0/12 complete
Layer 2  AI & Calls        [ ][ ][ ][ ][ ]                         0/5 complete
Layer 3  Notifications     [ ][ ][ ][ ][ ][ ]                      0/6 complete
Layer 4  Billing           [ ][ ][ ][ ][ ][ ]                      0/6 complete

TOTAL: 0/29 phases complete
```

---

## Blocked items log

When a phase is blocked (`[!]`), record it here immediately.

| Phase | Date blocked | Why blocked | Human action required | Resolved? |
|-------|-------------|-------------|----------------------|-----------|
| — | — | — | — | — |

---

## Environment variables tracker

Track every variable. A phase cannot start if its required variables are not set.

| Variable | Required for phase | In .env.local | In Vercel | Notes |
|----------|-------------------|---------------|-----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Phase 2 | `[ ]` | `[ ]` | supabase.com → project → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Phase 2 | `[ ]` | `[ ]` | supabase.com → project → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Phase 2 | `[ ]` | `[ ]` | ⚠️ Server-only. Never NEXT_PUBLIC_. Bypasses RLS. |
| `NEXT_PUBLIC_APP_URL` | Phase 1 | `[ ]` | `[ ]` | http://localhost:3000 locally; Vercel URL in production |
| `CARE_TEAM_EMAIL` | Phase 1 | `[ ]` | `[ ]` | Your email for now; real care team inbox in production |
| `CRON_SECRET` | Phase 1 | `[ ]` | `[ ]` | Generated: `openssl rand -base64 32` |
| `ANTHROPIC_API_KEY` | Phase 13 | `[ ]` | `[ ]` | console.anthropic.com → API Keys |
| `RETELL_API_KEY` | Phase 14 | `[ ]` | `[ ]` | retellai.com → Dashboard → API Keys |
| `RETELL_AGENT_ID` | Phase 14 | `[ ]` | `[ ]` | Filled in after creating Aria agent in Retell dashboard |
| `RETELL_WEBHOOK_SECRET` | Phase 17 | `[ ]` | `[ ]` | Generated: `openssl rand -base64 32` |
| `TWILIO_ACCOUNT_SID` | Phase 15 | `[ ]` | `[ ]` | twilio.com/console — starts with AC |
| `TWILIO_AUTH_TOKEN` | Phase 15 | `[ ]` | `[ ]` | twilio.com/console — click eye icon to reveal |
| `TWILIO_PHONE_NUMBER` | Phase 15 | `[ ]` | `[ ]` | E.164 format: +1XXXXXXXXXX |
| `ONCALL_NAVIGATOR_PHONE` | Phase 18 | `[ ]` | `[ ]` | Your mobile for now; real navigator in production |
| `SENDGRID_API_KEY` | Phase 19 | `[ ]` | `[ ]` | app.sendgrid.com → Settings → API Keys |
| `SENDGRID_FROM_EMAIL` | Phase 19 | `[ ]` | `[ ]` | Must be verified in SendGrid Sender Authentication |
| `STRIPE_SECRET_KEY` | Phase 25 | `[ ]` | `[ ]` | Use sk_test_... until Layer 4 gate is passed |
| `STRIPE_PUBLISHABLE_KEY` | Phase 25 | `[ ]` | `[ ]` | Use pk_test_... until Layer 4 gate is passed |
| `STRIPE_WEBHOOK_SECRET` | Phase 27 | `[ ]` | `[ ]` | Generated by Stripe when registering webhook endpoint |
| `STRIPE_PRICE_ID_BASICS` | Phase 25 | `[ ]` | `[ ]` | Filled in after creating $19/mo product in Stripe |
| `STRIPE_PRICE_ID_CONNECT` | Phase 25 | `[ ]` | `[ ]` | Filled in after creating $39/mo product in Stripe |
| `STRIPE_PRICE_ID_COMPLETE` | Phase 25 | `[ ]` | `[ ]` | Filled in after creating $69/mo product in Stripe |
| `STRIPE_PRICE_ID_PREMIER` | Phase 25 | `[ ]` | `[ ]` | Filled in after creating $129/mo product in Stripe |

---

## Service accounts tracker

| Service | Account created | Credentials saved | Configured | Notes |
|---------|----------------|-------------------|-----------|-------|
| GitHub | `[ ]` | `[ ]` | `[ ]` | Repo `thrive-at-home` created as Private |
| Vercel | `[ ]` | `[ ]` | `[ ]` | Connected to GitHub via OAuth |
| Supabase | `[ ]` | `[ ]` | `[ ]` | Project `thrive-at-home` created |
| Twilio | `[ ]` | `[ ]` | `[ ]` | Phone number purchased with Voice + SMS |
| Retell AI | `[ ]` | `[ ]` | `[ ]` | API key created — agent created in Phase 14 |
| Anthropic | `[ ]` | `[ ]` | `[ ]` | Payment method added, spending limit set |
| Stripe | `[ ]` | `[ ]` | `[ ]` | Use test mode until Layer 4 gate |
| SendGrid | `[ ]` | `[ ]` | `[ ]` | Sender email verified |

---

## HIPAA BAA tracker

All five BAAs must be signed before any real member health data enters the system. Start outreach immediately — takes 2–4 weeks per vendor.

| Vendor | Outreach started | BAA signed | Date signed | Stored location |
|--------|-----------------|-----------|-------------|----------------|
| Supabase | `[ ]` | `[ ]` | | Requires Pro plan ($25/mo) |
| Twilio | `[ ]` | `[ ]` | | twilio.com/hipaa |
| Retell AI | `[ ]` | `[ ]` | | ⚠️ Verify BAA availability BEFORE Phase 14 |
| Anthropic | `[ ]` | `[ ]` | | Contact Anthropic enterprise sales |
| SendGrid | `[ ]` | `[ ]` | | Covered under Twilio BAA or contact separately |

---

## npm packages tracker

Track every package installed. If a package is not here, it should not be in the codebase.

| Package | Installed in phase | Purpose |
|---------|-------------------|---------|
| `@supabase/supabase-js` | Phase 2 | Supabase database client |
| `@supabase/ssr` | Phase 2 | Supabase server-side rendering helpers |
| `recharts` | Phase 11 | Mood trend chart in family dashboard |
| `@anthropic-ai/sdk` | Phase 13 | Claude AI API client |
| `twilio` | Phase 15 | Twilio SMS and call infrastructure |
| `@sendgrid/mail` | Phase 19 | SendGrid email delivery |
| `stripe` | Phase 25 | Stripe billing and subscriptions |

---

*Checklist version: 2.0 — Aligned with 4-layer, 29-phase build structure*
*AI maintains this file. Human reads it. Neither deletes from it.*
