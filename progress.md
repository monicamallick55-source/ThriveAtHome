# ThriveAtHome — Progress Log

## Current Status — October 23, 2026
**G1–G8 ALL COMPLETE** ✅
**Migrations committed through: 099_encore_careers.sql** (G6 complete)
**Last confirmed: Oct 23, 2026 — code audit verified G6 fully built**

---

## Work Log

### 2026-10-23
- ✅ **Code audit confirmed G6 fully built** (all 4 migrations + all routes verified in Codespace)
  - Migration 096: `community_partners` table (G6.0)
  - Migration 097: Home Safety Program tables (G6.1)
  - Migration 098: Home Sharing tables (G6.2)
  - Migration 099: Encore Careers tables (G6.3/G6.4)
- ✅ **G8 Network Content Hub fully built and deployed** (G8.1–G8.7)

### 2026-10-22
- ✅ **Hybrid Nova Voice Onboarding rebuilt — comprehensive 6-step intake**
  - `components/onboarding/types.ts` — fully rewritten: 50+ field `OnboardingFormData` interface + `EMPTY_FORM` + `NOVA_PROMPTS` (per-step intro + tip text) + `STORAGE_KEY`
  - `components/onboarding/OnboardingForm.tsx` — full rewrite: 6-step form with inline step components, Nova voice banner per step, progress bar + step dots, localStorage save/restore, validation, submit
  - `app/api/onboarding/route.ts` — expanded: `OnboardingBody` interface covers all 50+ fields; `.insert()` persists all new columns
  - **Step 1 — Identity**: full_name, preferred_name, dob, phone, address, zip, language (12 options), cultural_background
  - **Step 2 — Health & Medications**: conditions, medications, schedule, pharmacy name+phone, refill_reminder_days, doctor name+phone, upcoming_appointments, lives_alone, mobility_aids
  - **Step 3 — Family & Emergency**: 2 emergency contacts (name/phone/rel), family_emails_to_invite, family_can_see_mood/summaries checkboxes
  - **Step 4 — Daily Life & Reminders**: wake/bed times, preferred_call_time, meal_preferences, weekly_routine, reminder_methods, subscriptions_to_track, subscription_renewal_months, service_needs, transportation_needs
  - **Step 5 — Interests & Community**: tap-to-select topic tag grid (20 tags), hobbies, music_preferences, topics_avoid, cultural_circle_interest dropdown (16 circles), buddy_match_topics/era/length_preference
  - **Step 6 — Aria & Grief**: aria_call_opt_in radio (daily/less_often/no), check_in_frequency, grief_welcome_path checkbox + grief_loss_type dropdown
  - **Nova banner**: dark navy gradient panel on every step with 🌟 Nova avatar, step-specific intro/tip text, 🎤/⏹ voice toggle (UI; Retell integration wired on toggle state)
  - **UX**: ← Back / Continue → / ✓ Complete Profile nav; animated progress bar; step dots with ✓ check marks; "skip — update from dashboard" note on optional steps
- ✅ **Pitch deck**: monetization.html + revenue_model.html built and published (all 18 slides confirmed live at deck artifact)

### 2026-10-20
- ✅ Landing page: nonprofit mission strip added (dark navy band below hero)
  - "1% of every subscription funds free Community Access memberships" + "Donate a membership →" CTA
- ✅ Landing page: `♥ Donate` link added to main nav (teal, links to /donate)
- ✅ Nonprofit platform built — full subsystem:
  - `lib/nonprofit/types.ts` — TypeScript types for NonprofitOrg, SponsoredMembership, NonprofitReferral, NonprofitImpactReport
  - `lib/nonprofit/db.ts` — all DB helpers: createNonprofitOrg, createReferral, enrollSponsoredMembership, getImpactReport, getSponsoredMembershipsForOrg, etc.
  - `supabase/migrations/20261020_nonprofit_tables.sql` — 3 new tables + 2 RPC functions + triggers + RLS
  - `app/api/nonprofit/orgs/route.ts` — GET (by email for portal login, or all) + POST (register org)
  - `app/api/nonprofit/referrals/route.ts` — GET (by org_id or all pending) + POST (submit referral)
  - `app/api/nonprofit/referrals/[id]/approve/route.ts` — POST: navigator approves referral → enrolls member
  - `app/api/nonprofit/referrals/[id]/decline/route.ts` — POST: navigator declines with reason
  - `app/api/nonprofit/members/route.ts` — GET (sponsored memberships for org)
  - `app/api/nonprofit/impact/route.ts` — GET (impact report with call stats, mood scores, events, subsidies)
  - `app/nonprofit-admin/page.tsx` — full partner portal (4 tabs: Register, Referrals, Members, Impact)
- ✅ 2 new Community Access membership tiers:
  - `community_free` — $0/mo to member, foundation covers $29 subsidy
  - `community_subsidised` — $5/mo to member, foundation covers $24 subsidy
- ✅ Referral workflow: org submits → navigator reviews + approves/declines → member enrolled → navigator `community_access_welcome` task auto-created

### 2026-10-19
- ✅ Full page audit completed (PAGE_AUDIT_2026-10-19.md)
- ✅ G7.5 birthday arc opt-out built (migration 116)
- ✅ G7.6 milestone birthday programs built (migration 117)
- ✅ G7 Sprint 2 complete (G7.3–G7.6)

### 2026-10-14 (Sprint 1 complete)
- ✅ G7.1 Fraud Detection built (migration 111, detect.ts, flagService.ts)
- ✅ G7.2 Family Events Calendar built (migration 112, cron, dashboard tab)
- ✅ G7.14 Life Transitions — 4 missing pathways confirmed in GriefSupportClient.tsx
- ✅ Migrations 110–115 ALL applied to production Supabase
- ✅ Anthropic BAA signed
- ✅ Retell AI BAA signed
- ✅ Twilio: 2 numbers purchased, wired to Retell, tested
- ✅ Resend: email account active, env vars set, tested
- ✅ Subscription prices corrected: $29/$49/$99/$199
- ✅ End-to-end test plan execution begun (TC-101 Build ✅ PASS)

### 2026-10-13
- ✅ Twilio numbers purchased and wired to Retell AI agents
- ✅ Resend account activated (replacing SendGrid)
- ✅ BAAs signed: Anthropic + Retell AI
- ✅ G7.1 fraud detection tarball: task61_g71_fraud_detection.tar.gz
- ✅ G7.2/G7.14 tarball: task62_g72_g714_celebrations.tar.gz

---

## Migrations — Full Status

| Migration | Description | Status |
|-----------|-------------|--------|
| 001–109 | Core platform (M1–M16) | ✅ Applied |
| 110 | Companion marketplace | ✅ Applied (UI hidden — deferred until Stripe Connect + LLC) |
| 111 | fraud_flags table | ✅ Applied |
| 112 | family_events, gift_orders, celebration_requests, celebration_messages | ✅ Applied |
| 113 | (G7 schema updates) | ✅ Applied |
| 114 | (G7 schema updates) | ✅ Applied |
| 115 | (G7 schema updates) | ✅ Applied |
| 116 | celebration_opt_out + birthday_arc_state (G7.5) | ✅ Committed — apply to production |
| 117 | milestone_birthday_programs seed + trigger_days_before column (G7.6) | ✅ Committed — apply to production |
| 20261020_nonprofit_tables.sql | nonprofit_orgs, nonprofit_referrals, sponsored_memberships + RPC + RLS | ✅ Committed — apply to production |
| 118 | Age-group circles (55–64, 65–74, 75–84, 85+) | ✅ Committed — apply to production |
| 096 | community_partners + partner_referrals (G6.0) | ✅ Committed — apply to production |
| 097 | Home Safety Program tables (G6.1) | ✅ Committed — apply to production |
| 098 | Home Sharing tables (G6.2) | ✅ Committed — apply to production |
| 099 | Encore Careers + Member Campaigns tables (G6.3/G6.4) | ✅ Committed — apply to production |

---

## Subscription Plans (live in code)

| Plan | Monthly | Stripe cents |
|------|---------|--------------|
| Thrive Basics | $29 | 2900 |
| Thrive Connect | $49 | 4900 |
| Thrive Complete | $99 | 9900 |
| Thrive Premier | $199 | 19900 |

### Community Access Tiers (new — nonprofit-sponsored, not in Stripe checkout)

| Tier | Member pays | Foundation subsidy | Who qualifies |
|------|------------|-------------------|---------------|
| community_free | $0/mo | $29/mo | Fully funded by ThriveAtHome Foundation / 1% revenue |
| community_subsidised | $5/mo | $24/mo | Senior pays $5, foundation/partner covers rest |

---

## What's Working ✅ — COMPLETE PLATFORM

| Feature | Status |
|---------|--------|
| Auth + onboarding | ✅ Built |
| **Comprehensive hybrid onboarding (Nova voice, 6 steps, 50+ fields)** | ✅ **Rebuilt Oct 22** |
| Member dashboard | ✅ Built |
| Family dashboard | ✅ Built |
| Navigator console | ✅ Built |
| AI check-in calls (Aria, Quinn, Grace, Rosa, Hope, Joy, Sam, Morgan, Nova, Claire, Alex, Jordan) | ✅ Active — Retell + Twilio live |
| Billing / Stripe | ✅ Built ($29/$49/$99/$199) |
| Communities (20 circles + 4 age-stage circles) | ✅ Built |
| Volunteer network | ✅ Built |
| Grief & transitions (9 pathways) | ✅ Built |
| Celebrations & life story | ✅ Built |
| G7.1 Fraud detection | ✅ Built |
| G7.2 Family Events Calendar | ✅ Built |
| G7.14 Life transitions (4 new pathways) | ✅ Built |
| G7.3 Gift sending (senior → family) | ✅ Built |
| G7.4 Family-initiated celebrations (3-tier) | ✅ Built |
| G7.5 Birthday arc opt-out + extended D-5/D-3/D-1/D+1 steps | ✅ Built |
| G7.6 Milestone birthday programs (70/75/80/85/90/95/100) | ✅ Built |
| Landing page mission strip + ♥ Donate nav link | ✅ Built |
| Nonprofit partner portal (`/nonprofit-admin`) | ✅ Built |
| Community Access membership tiers | ✅ Built |
| Nonprofit org referral flow | ✅ Built |
| Impact reporting for nonprofit orgs | ✅ Built |
| Investor pitch deck (18 slides) | ✅ Built |
| **G6.0 Community Partners** (community_partners table, admin CRUD, referral flow with consent) | ✅ Built |
| **G6.1 Home Safety Program** (programs, enrollments, inspections, proposals, work orders, volunteer view, fridge magnet) | ✅ Built |
| **G6.2 Home Sharing** (listings, matches, referrals, navigator handoff, participation tracking) | ✅ Built |
| **G6.3 Encore Careers** (career profile, opportunities board, SCSEP referrals, applications) | ✅ Built |
| **G6.4 Member-in-Need Campaigns** (campaigns, contributions, admin review, family + navigator views) | ✅ Built |
| **G8.1 Blog post pages** | ✅ Built |
| **G8.2 Resource articles** | ✅ Built |
| **G8.3 Checklists hub + 36 individual checklist pages** | ✅ Built |
| **G8.4 State resource pages (all 50 states)** | ✅ Built |
| **G8.5 Partner directory** (Supabase-backed, 15 seed listings) | ✅ Built |
| **G8.6 Resources nav dropdown + footer links** | ✅ Built |
| **G8.7 Homepage directory CTA** | ✅ Built |

---

## Remaining TODOs

### Code (remaining — minor)
- [ ] Fraud scan in circle posts before-insert trigger (G7.1 wiring)
- [ ] Buddy "My Buddies" tab (partially done)
- [ ] Auto-join members to age-group circle during onboarding
- [ ] Age-group circles section in `/dashboard/communities`
- [ ] `/contact` form wired to `/api/contact/inquiry`
- [ ] Retell AI voice integration in Nova onboarding banner (UI wired, Retell call initiation + transcript → field population logic pending)
- [ ] Activate seeded community_partners (confirm phone/details with each partner, set status=active)

### Compliance (non-code, urgent)
- [ ] Apply migrations 116, 117, 20261020_nonprofit_tables.sql, 118, 096, 097, 098, 099 to production Supabase
- [ ] **URGENT: Change Supabase DB password (`Mickey55!` was exposed)**
- [ ] **URGENT: Revoke and replace Resend API key**
- [ ] Sign Twilio BAA
- [ ] Upgrade Supabase HIPAA tier
- [ ] Sign Resend BAA
- [ ] 10DLC registration
- [ ] Delaware C-Corp + PBC formation
- [ ] Stripe live mode activation
- [ ] Note on /donate: donations are NOT tax-deductible until 501(c)(3) / Foundation entity formed — update page copy
- [ ] Confirm all 7 seeded community_partners by phone/website before activating

### Third-Party Keys Needed
- [ ] 1-800-Flowers / gift API key
- [ ] Lyft API key for ride booking
- [ ] Stripe Connect (blocked pending entity formation)

---

## Deploy Method (important)
- **Only use**: `git push origin main` — Vercel webhook picks it up automatically
- **Never use**: `npx vercel --prod --yes` alongside git push — causes double deploys
