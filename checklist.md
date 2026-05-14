# Thrive@Home — AI Build Checklist (v3.0)

> **AI maintains this file. Update at end of every session.**
> Human may read but should not edit.

---

## Status key

| Symbol | Meaning |
|--------|---------|
| `[ ]` | Not started |
| `[~]` | In progress — code written but tests not yet passed |
| `[A]` | Awaiting human APPROVED — review presented, waiting |
| `[x]` | Complete — test passed AND human replied APPROVED |
| `[!]` | Blocked — needs human input (see Blocked Items Log) |

**A phase is `[x]` only when:** test in tests.md passed AND user replied APPROVED.

---

## How the AI uses this file

**Start of session:** Read entire file → find first non-`[x]` phase → start there. If `[A]`, wait for APPROVED before touching code.

**End of session:** Update phase statuses → add blocked items → update env var table → update service accounts table.

---

## M1 — Foundation (Phases 1–4)

| # | Phase | Status | Date | Notes |
|---|-------|--------|------|-------|
| 1 | Project Scaffold | `[ ]` | | |
| 2 | Supabase Connection | `[ ]` | | |
| 3 | Database Schema | `[ ]` | | |
| 4 | Row Level Security | `[ ]` | | |

**⛔ M1 Gate:** All 4 phases `[x]`. Vercel URL loads. `.env.local` untracked by git. `npx tsc --noEmit` zero errors.

---

## M2 — Member Data (Phases 5–7)

| # | Phase | Status | Date | Notes |
|---|-------|--------|------|-------|
| 5 | Authentication | `[ ]` | | |
| 6 | Member Onboarding Form (3 steps, no billing) | `[ ]` | | |
| 7 | App Data Layer & Seed Data | `[ ]` | | |

**⛔ M2 Gate:** Family member can sign up, enrol a senior, member row in Supabase with `plan_tier = basics`. Seed script creates Margaret Chen test data.

---

## M3 — UI System (Phase 8)

| # | Phase | Status | Date | Notes |
|---|-------|--------|------|-------|
| 8 | Primitive UI Components | `[ ]` | | |

**⛔ M3 Gate:** All 13 components render. All keyboard-navigable. Test-ui page deleted.

---

## M4 — Realtime Notifications (Phase 9)

| # | Phase | Status | Date | Notes |
|---|-------|--------|------|-------|
| 9 | Supabase Realtime Notification System | `[ ]` | | |

**⛔ M4 Gate:** Alert inserted in SQL Editor → toast appears in dashboard tab within 2 seconds — no page refresh. RLS confirmed: User A cannot see User B's notifications.

---

## M5 — Alert Engine (Phases 10–11)

| # | Phase | Status | Date | Notes |
|---|-------|--------|------|-------|
| 10 | Alert Logic & Detection | `[ ]` | | |
| 11 | Crisis Detection | `[ ]` | | |

**⛔ M5 Gate:** Crisis transcript → all 5 escalation steps logged (stub mode). Deduplication confirmed. Realtime notification fires on alert creation. Normal transcript → no false positives.

---

## M6 — Family Dashboard (Phases 12–14)

| # | Phase | Status | Date | Notes |
|---|-------|--------|------|-------|
| 12 | Family Dashboard Shell & Health Timeline | `[ ]` | | |
| 13 | Call History Page | `[ ]` | | |
| 14 | Family Coordination Tools | `[ ]` | | |

**⛔ M6 Gate:** Dashboard loads in <3 seconds with seed data. Health timeline renders all 4 views. New alert appears within 2 seconds via Realtime. Document uploads/retrieves. Family task visible to all linked family members.

---

## M7 — Navigator Console (Phases 15–16)

| # | Phase | Status | Date | Notes |
|---|-------|--------|------|-------|
| 15 | Navigator Console | `[ ]` | | |
| 16 | Weekly & Monthly Digest Scheduling | `[ ]` | | |

**⛔ M7 Gate:** Navigator sees only assigned members. Acknowledge removes alert card. Panel opens/closes correctly. Weekly/monthly crons log stub output.

---

## M8 — AI Calls (Phases 17–19)

| # | Phase | Status | Date | Notes |
|---|-------|--------|------|-------|
| 17 | Anthropic AI Provider | `[ ]` | | |
| 18 | Retell AI Agent Setup | `[ ]` | | |
| 19 | Call Infrastructure, Scheduler & Webhook | `[ ]` | | |

**⛔ M8 Gate:** Real test call made and received. Crisis transcript → all 5 escalation steps. Dashboard shows real call data via Realtime. At least 3 end-to-end calls completed.

---

## M9 — Concierge Line (Phase 20)

| # | Phase | Status | Date | Notes |
|---|-------|--------|------|-------|
| 20 | 24/7 Concierge Inbound Phone Line | `[ ]` | | |

**⛔ M9 Gate:** Concierge number rings. Service request → stub dispatch logged. Crisis phrase → escalation fires. Human transfer tested. Language Line connection tested.

---

## M10 — Outbound Notifications (Phases 21–23)

| # | Phase | Status | Date | Notes |
|---|-------|--------|------|-------|
| 21 | Twilio SMS Provider (Live) | `[ ]` | | |
| 22 | SendGrid Email Provider (Live) | `[ ]` | | |
| 23 | Medication Reminders & Full Pipeline | `[ ]` | | |

**⛔ M10 Gate:** SMS arrives within 5 minutes of call. Email arrives within 30 minutes. Email renders in Gmail on mobile. Medication reminder SMS arrives within 3 minutes. Full pipeline: all 3 channels logged as `sent`.

---

## M11 — Billing (Phases 24–26)

| # | Phase | Status | Date | Notes |
|---|-------|--------|------|-------|
| 24 | Pricing Page & Stripe Setup | `[ ]` | | |
| 25 | Plan Selection in Onboarding & Checkout | `[ ]` | | |
| 26 | Billing Management Page | `[ ]` | | |

**⛔ M11 Gate:** Test card 4242 4242 4242 4242 completes checkout. Subscription active in Supabase and Stripe. All 5 webhook events handled (Stripe CLI). Billing page shows correct plan. NOTE: Use test keys only until M12 compliance gate.

---

## M12 — Safety & Compliance (Phases 27–28)

| # | Phase | Status | Date | Notes |
|---|-------|--------|------|-------|
| 27 | HIPAA Baseline | `[ ]` | | |
| 28 | Accessibility, SOC 2 & 65+ Usability | `[ ]` | | |

**⛔ M12 Gate (required before any real member data and before switching to live Stripe keys):**
- [ ] All 5 HIPAA BAAs signed and stored
- [ ] axe-cli shows zero WCAG 2.1 AA violations on all pages
- [ ] Real person aged 65+ completed onboarding without assistance
- [ ] Audit log active (tested: member read creates log entry)
- [ ] Data deletion confirmed (all member rows deleted on request)
- [ ] SOC 2 control inventory documented

---

## M13 — Volunteer Network (Phases 29–36)

| # | Phase | Status | Date | Notes |
|---|-------|--------|------|-------|
| 29 | Volunteer Application & Admin Queue | `[ ]` | | |
| 30 | Background Checks (Checkr) | `[ ]` | | |
| 31 | Volunteer Matching Engine | `[ ]` | | |
| 32 | General Volunteer Portal | `[ ]` | | |
| 33 | Student Network (University Partnerships) | `[ ]` | | |
| 34 | Youth in Schools Program | `[ ]` | | |
| 35 | Veteran Volunteer Network | `[ ]` | | |
| 36 | Retired Professionals, Faith, Corporate, Neighbor Networks | `[ ]` | | |

**⛔ M13 Gate:** All 8 volunteer types have role-appropriate views. Checkr background check initiated on approval. Matching engine scores correctly. Training library certificate required before first assignment. Recognition badges fire at correct hour milestones.

---

## M14 — Community Layer (Phases 37–44)

| # | Phase | Status | Date | Notes |
|---|-------|--------|------|-------|
| 37 | Virtual Events Platform | `[ ]` | | |
| 38 | Local In-Person Events & Transport | `[ ]` | | |
| 39 | Interest Groups | `[ ]` | | |
| 40 | Skill Exchange / Time Banking | `[ ]` | | |
| 41 | Cultural Community Circles | `[ ]` | | |
| 42 | Language Access & Multilingual UI | `[ ]` | | |
| 43 | Benefits Finder | `[ ]` | | |
| 44 | Employer Portal (Full) | `[ ]` | | |

**⛔ M14 Gate:** All 12 cultural circles seeded. Credit transfer atomic (tested with injected failure). Events RSVP shows dial-in. Interest group AI suggestion triggers. Benefits finder shows qualifying reason per result. Multilingual: no raw translation keys in Spanish.

---

## M15 — Celebrations & Life Stories (Phases 45–46)

| # | Phase | Status | Date | Notes |
|---|-------|--------|------|-------|
| 45 | Celebrations Engine | `[ ]` | | |
| 46 | Life Story Archive | `[ ]` | | |

**⛔ M15 Gate:** D-7 birthday notification personalised (not generic). D-0 community post + modified check-in prompt. Milestone birthday flagged for coordinator. Voice memo uploads to Supabase Storage. Life story entry appears in community feed when marked public.

---

## M16 — Grief & Life Transitions (Phases 47–49)

| # | Phase | Status | Date | Notes |
|---|-------|--------|------|-------|
| 47 | Physical Goods Fulfillment | `[ ]` | | |
| 48 | Grief Support System | `[ ]` | | |
| 49 | Life Transition Support Pathways | `[ ]` | | |

**⛔ M16 Gate:** Grief care team email within 2 minutes (tested). Holiday sensitivity suppresses nudges near anniversaries. 90-day monitoring alert fires. Nursing home transition → navigator task. Physical goods stub logs correctly.

---

## M17 — Services Marketplace (Phases 50–56)

| # | Phase | Status | Date | Notes |
|---|-------|--------|------|-------|
| 50 | Services Marketplace Foundation | `[ ]` | | |
| 51 | Transportation | `[ ]` | | |
| 52 | Home Services | `[ ]` | | |
| 53 | Health Services (Telehealth) | `[ ]` | | |
| 54 | Legal & Financial Services Hub | `[ ]` | | |
| 55 | Meals & Nutrition | `[ ]` | | |
| 56 | On-Demand Tech Help Services | `[ ]` | | |

**⛔ M17 Gate:** All 6 service categories accessible from services hub. Service request creates booking row and Realtime notification. Transport booking creates row + volunteer match for volunteer-driver trips. Document vault upload/retrieve confirmed. Fraud alert Realtime notification sends on schedule.

---

## M18 — Enterprise (Phases 57–61)

| # | Phase | Status | Date | Notes |
|---|-------|--------|------|-------|
| 57 | Outcomes Dashboard | `[ ]` | | |
| 58 | AI Care Plan Generation | `[ ]` | | |
| 59 | Medicare Advantage Reporting API | `[ ]` | | |
| 60 | University Partnership Portal (Full) | `[ ]` | | |
| 61 | Full Multilingual Platform | `[ ]` | | |

**⛔ M18 Gate:** Care plan cost < $0.50/plan. MA API suppresses cohort < 10. All pages in 12 languages with zero raw translation keys. Professional Spanish speaker reviews health-critical strings.

---

## Overall progress tracker

```
M1  Foundation          [ ][ ][ ][ ]                         0/4
M2  Member Data         [ ][ ][ ]                            0/3
M3  UI System           [ ]                                  0/1
M4  Realtime            [ ]                                  0/1
M5  Alert Engine        [ ][ ]                               0/2
M6  Family Dashboard    [ ][ ][ ]                            0/3
M7  Navigator Console   [ ][ ]                               0/2
M8  AI Calls            [ ][ ][ ]                            0/3
M9  Concierge Line      [ ]                                  0/1
M10 Notifications       [ ][ ][ ]                            0/3
M11 Billing             [ ][ ][ ]                            0/3
M12 Compliance          [ ][ ]                               0/2
M13 Volunteers          [ ][ ][ ][ ][ ][ ][ ][ ]             0/8
M14 Community           [ ][ ][ ][ ][ ][ ][ ][ ]             0/8
M15 Celebrations        [ ][ ]                               0/2
M16 Grief & Transitions [ ][ ][ ]                            0/3
M17 Services Marketplace[ ][ ][ ][ ][ ][ ][ ]                0/7
M18 Enterprise          [ ][ ][ ][ ][ ]                      0/5

TOTAL: 0/61 phases complete
```

---

## Blocked items log

| Phase | Date blocked | Why | Human action needed | Resolved? |
|-------|-------------|-----|---------------------|-----------|
| — | — | — | — | — |

---

## Environment variables tracker

| Variable | Required phase | .env.local | Vercel | Notes |
|----------|---------------|-----------|--------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Phase 2 | `[ ]` | `[ ]` | supabase.com → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Phase 2 | `[ ]` | `[ ]` | |
| `SUPABASE_SERVICE_ROLE_KEY` | Phase 2 | `[ ]` | `[ ]` | ⚠️ Server only. Bypasses RLS. |
| `NEXT_PUBLIC_APP_URL` | Phase 1 | `[ ]` | `[ ]` | localhost:3000 locally; Vercel URL in prod |
| `CARE_TEAM_EMAIL` | Phase 1 | `[ ]` | `[ ]` | Your email for now |
| `CRON_SECRET` | Phase 1 | `[ ]` | `[ ]` | `openssl rand -base64 32` |
| `ANTHROPIC_API_KEY` | Phase 17 | `[ ]` | `[ ]` | console.anthropic.com |
| `RETELL_API_KEY` | Phase 18 | `[ ]` | `[ ]` | retellai.com → API Keys |
| `RETELL_AGENT_ID` | Phase 18 | `[ ]` | `[ ]` | After creating Aria agent |
| `RETELL_WEBHOOK_SECRET` | Phase 19 | `[ ]` | `[ ]` | `openssl rand -base64 32` |
| `RETELL_CONCIERGE_AGENT_ID` | Phase 20 | `[ ]` | `[ ]` | After creating concierge agent |
| `TWILIO_ACCOUNT_SID` | Phase 19 | `[ ]` | `[ ]` | twilio.com/console — starts with AC |
| `TWILIO_AUTH_TOKEN` | Phase 19 | `[ ]` | `[ ]` | |
| `TWILIO_PHONE_NUMBER` | Phase 19 | `[ ]` | `[ ]` | E.164: +1XXXXXXXXXX |
| `TWILIO_CONCIERGE_NUMBER` | Phase 20 | `[ ]` | `[ ]` | Second Twilio number |
| `ONCALL_NAVIGATOR_PHONE` | Phase 21 | `[ ]` | `[ ]` | Your mobile for now |
| `SENDGRID_API_KEY` | Phase 22 | `[ ]` | `[ ]` | app.sendgrid.com → API Keys |
| `SENDGRID_FROM_EMAIL` | Phase 22 | `[ ]` | `[ ]` | Must be verified in SendGrid |
| `STRIPE_SECRET_KEY` | Phase 24 | `[ ]` | `[ ]` | Use sk_test_ until M12 gate |
| `STRIPE_PUBLISHABLE_KEY` | Phase 24 | `[ ]` | `[ ]` | Use pk_test_ until M12 gate |
| `STRIPE_WEBHOOK_SECRET` | Phase 25 | `[ ]` | `[ ]` | Generated by Stripe |
| `STRIPE_PRICE_ID_BASICS` | Phase 24 | `[ ]` | `[ ]` | After creating $19/mo product |
| `STRIPE_PRICE_ID_CONNECT` | Phase 24 | `[ ]` | `[ ]` | After creating $39/mo product |
| `STRIPE_PRICE_ID_COMPLETE` | Phase 24 | `[ ]` | `[ ]` | After creating $69/mo product |
| `STRIPE_PRICE_ID_PREMIER` | Phase 24 | `[ ]` | `[ ]` | After creating $129/mo product |
| `CHECKR_API_KEY` | Phase 30 | `[ ]` | `[ ]` | checkr.com |
| `CHECKR_WEBHOOK_SECRET` | Phase 30 | `[ ]` | `[ ]` | `openssl rand -base64 32` |
| `LANGUAGE_LINE_ACCOUNT_NUMBER` | Phase 20 | `[ ]` | `[ ]` | languageline.com |
| `LANGUAGE_LINE_SIP_ENDPOINT` | Phase 20 | `[ ]` | `[ ]` | From Language Line setup |
| `LYFT_HEALTHCARE_API_KEY` | Phase 51 | `[ ]` | `[ ]` | Commercial agreement required |
| `INSTACART_API_KEY` | Phase 52 | `[ ]` | `[ ]` | |
| `TELADOC_API_KEY` | Phase 53 | `[ ]` | `[ ]` | |
| `ARTIFACT_UPRISING_API_KEY` | Phase 47 | `[ ]` | `[ ]` | |
| `ONE800FLOWERS_API_KEY` | Phase 47 | `[ ]` | `[ ]` | |

---

## Service accounts tracker

| Service | Account | Credentials saved | Configured | Notes |
|---------|---------|-------------------|-----------|-------|
| GitHub | `[ ]` | `[ ]` | `[ ]` | Repo `thrive-at-home` as Private |
| Vercel | `[ ]` | `[ ]` | `[ ]` | Connected to GitHub via OAuth |
| Supabase | `[ ]` | `[ ]` | `[ ]` | Project `thrive-at-home` |
| Twilio | `[ ]` | `[ ]` | `[ ]` | 2 phone numbers (check-in + concierge) |
| Retell AI | `[ ]` | `[ ]` | `[ ]` | 2 agents (Aria + concierge) |
| Anthropic | `[ ]` | `[ ]` | `[ ]` | Spending limit set |
| Stripe | `[ ]` | `[ ]` | `[ ]` | Test mode until M12 gate |
| SendGrid | `[ ]` | `[ ]` | `[ ]` | Sender email verified |
| Checkr | `[ ]` | `[ ]` | `[ ]` | For volunteer background checks |
| Language Line | `[ ]` | `[ ]` | `[ ]` | For concierge multilingual |

---

## HIPAA BAA tracker

All 5 required before ANY real member health data.

| Vendor | Outreach started | BAA signed | Date | Stored |
|--------|-----------------|-----------|------|--------|
| Supabase | `[ ]` | `[ ]` | | Requires Pro plan |
| Twilio | `[ ]` | `[ ]` | | twilio.com/hipaa |
| Retell AI | `[ ]` | `[ ]` | | ⚠️ Verify before Phase 18 |
| Anthropic | `[ ]` | `[ ]` | | Enterprise sales |
| SendGrid | `[ ]` | `[ ]` | | Under Twilio or separate |

---

## npm packages tracker

| Package | Phase | Purpose |
|---------|-------|---------|
| `@supabase/supabase-js` | 2 | Supabase client |
| `@supabase/ssr` | 2 | SSR session handling |
| `recharts` | 12 | Mood trend and health timeline charts |
| `@anthropic-ai/sdk` | 17 | Claude AI client |
| `twilio` | 19 | SMS and call infrastructure |
| `@sendgrid/mail` | 22 | Email delivery |
| `stripe` | 24 | Billing and subscriptions |
| `next-intl` | 42 | i18n framework |
| `puppeteer` | 57 | PDF generation for reports |

---

*Checklist v3.0 — 61 phases across 18 milestones*
