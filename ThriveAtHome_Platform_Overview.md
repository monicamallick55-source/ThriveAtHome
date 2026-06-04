# ThriveAtHome — Platform Overview
## Single Source of Truth — June 2026

> This document is the authoritative reference for ThriveAtHome's current state,
> vision, features, and go-to-market plan. It supersedes all previous spec documents.
> Update this document as major milestones complete or strategy evolves.

---

## What ThriveAtHome Is

ThriveAtHome is a senior independence platform that helps older adults live safely and with dignity at home — while giving their families real-time peace of mind.

**The core experience:**
A senior receives a warm daily phone call from Aria, ThriveAtHome's AI care companion. Aria asks how they're doing, checks in on mood, sleep, medications, and wellbeing — in a natural, unhurried conversation, never a checklist. After every call, the family receives an instant summary. If anything needs attention, the family and care team are alerted immediately.

**What makes ThriveAtHome different:**
- The only senior care platform built around human warmth, not clinical monitoring
- AI-powered daily check-ins that feel like a conversation, not a survey
- A real community layer — cultural circles, events, skill exchange, volunteer connections
- A complete services marketplace — transport, meals, tech help, home services, health, legal
- Life story archive, memory books, and celebration engine — honoring seniors' lives, not just tracking health
- Grief and life transition support built into the platform

**Who it serves:**
- **Primary:** Adult children (35–65) caring for aging parents at a distance
- **Secondary:** The senior members themselves — especially those who are socially isolated
- **B2B channels:** Employers, Medicare Advantage plans, home care agencies, nonprofits, universities

**Geographic model — Hybrid Chapter System:**
ThriveAtHome operates as a national open platform with soft local chapters. Members can enroll anywhere in the US and immediately receive full virtual services. Behind the scenes, members are grouped into metro areas by zip code. When a metro area reaches 50+ active members it becomes an official ThriveAtHome Chapter with a local coordinator, local events, and a local volunteer pool. Rural and small-town members always receive full virtual service — no degraded experience for lower-density areas.

- Volunteers prioritized by proximity: same chapter (+30 pts), adjacent metro (+15 pts), national virtual (+0 pts)
- Events: local chapter events shown prominently with "Near you" badge, virtual events always available nationwide
- Services: in-person services filtered by distance radius, phone/video services available nationally
- Community circles: national cultural/interest circles + local neighborhood circles per chapter
- Launch strategy: build first chapter in one metro area (Bay Area), prove the model, expand to Chicago, New York, LA

---

## Brand Vision

**ThriveAtHome is a consumer brand first.**

Families trust ThriveAtHome. Partners use ThriveAtHome. The brand always belongs to ThriveAtHome.

- Own the consumer relationship end-to-end
- B2B partners amplify the brand — they never own the member relationship
- White-label is available for agencies but always "Powered by ThriveAtHome"
- Never license to direct competitors

The goal: become the first beloved consumer brand in senior care — the way families trust Apple or Spotify — in a market full of clinical, confusing, institutional tools.

---

## Pricing Model

| Plan | Price | Best For |
|------|-------|---------|
| **Thrive Basics** | $19/month | Families who want daily peace of mind |
| **Thrive Connect** | $39/month | Families who want community and volunteers too |
| **Thrive Complete** | $69/month | Families who want active care navigation |
| **Thrive Premier** | $129/month | Families who want dedicated, hands-on support |

**Gift subscriptions:** Available in 1, 3, 6, and 12-month increments for all plans.

**Memory Book:** Free for Complete and Premier. $14.99–$19.99 one-time for Basics and Connect. Memorial Edition available for inactive members.

**B2B pricing:**
- Employer benefits: $8–$22 PEPM (per employee per month)
- University partnerships: $5K–$20K per year
- Agency/enterprise: Custom PMPM (per member per month) contracts

---

## Technical Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 16, Tailwind CSS v4, TypeScript | Web application |
| Database | Supabase (PostgreSQL) | All data storage |
| Auth | Supabase Auth | User authentication and roles |
| Realtime | Supabase Realtime + Edge Functions | Live alerts and notifications |
| AI (stub) | Anthropic Claude API | Call summaries, care plans, celebrations |
| Voice calls (stub) | Retell AI + Twilio | Aria daily check-in calls |
| SMS (stub) | Twilio | Family SMS notifications |
| Email (stub) | SendGrid | Family email notifications |
| Payments | Stripe | Subscriptions, one-time purchases |
| Hosting | Vercel | Application deployment and cron jobs |
| Storage | Supabase Storage | Documents, life story attachments, memory books |

**Stub providers:** All paid external services are built with stub implementations that log what they would do. They activate automatically when API credentials are added — zero code changes needed.

---

## What Is Built (Complete as of June 2026)

### Foundation + Family Layer (M1–M6) — COMPLETE
- Next.js application deployed on Vercel
- Supabase database with 45+ tables, RLS policies, audit logging
- Role-based auth: family, navigator, admin, volunteer, student, employer_admin
- Senior member enrollment (4-step onboarding form)
- Family dashboard: wellness card, mood timeline, real-time alerts
- Crisis detection with 5-step escalation
- Call history, family coordination tools (tasks, messaging, document vault)

### Add-Ons (M7–M12) — COMPLETE (paid services deferred)
- Navigator console — unified action feed, service dispatch, member detail panel
- Stripe billing — 4 subscription plans, gift subscriptions, Customer Portal
- Weekly/monthly digest crons, family nudge notifications
- Privacy policy, data deletion, HIPAA baseline, accessibility audit
- M8 AI Calls, M9 Concierge, M10 SMS/Email — deferred, activate with credentials

### Volunteer Network (M13) — COMPLETE
- Volunteer application with 20+ service sub-types and matching
- Veteran volunteer track with VSO fields
- Driver verification for transport volunteers
- Volunteer dashboard, student portal, admin matching UI

### Community Features (M14) — COMPLETE
- Communities — 12 cultural + 8 interest-based circles, recommended for you
- Platform-wide events, external events discovery, RSVP
- Skill exchange / time banking
- Benefits finder (15+ federal programs)
- Employer portal MVP

### Celebrations & Life Story (M15) — COMPLETE
- Birthday detection, milestone recognition
- Life story archive — era timeline, 7 entry types, file attachments
- Memory Book (PDF) + Memory Collage (frameable) with Shutterfly-quality design
- Draft system, preview before payment, pricing by plan tier, Memorial Edition

### Grief & Life Transitions (M16) — COMPLETE
- Grief & Transition Support — 4 pathways + 5 life transition pathways
- Prolonged grief detection, anniversary sensitivity
- Professional referral tracking in navigator console

### Services Marketplace (M17) — IN PROGRESS
- Services hub with 7 categories and 30+ sub-types (Transport, Home, Meals, Health, Legal/Financial, Tech Help, Companionship & Social)
- Navigator dispatch panel with inline volunteer assignment, reassign, reschedule, cancel with reason
- Service sub-type matching — volunteers matched to specific sub-types not just broad categories
- Service request details on family dashboard with plain-English status
- Home services, meals, health, legal, tech help, companions — in progress

### Revenue Features (M17 additions) — IN PROGRESS
- **Prescription Refill Management** — refill intent detection in Aria calls, 28-day cycle prediction, refill coordination workflow, pharmacy stub integration
- **Gift Sending** — gift intent detection in calls, gift marketplace (flowers, food, gift cards, handwritten cards), 15% platform commission, delivery tracking
- **Family-Initiated Celebrations** — special occasion requests, three coordination tiers (Digital free / Enhanced $25 / Premier $75), family coordination room, personalized Aria celebration calls using life story entries

### Family Events & Senior Gift-Giving (M17 additions) — IN PROGRESS
- Family events calendar — birthdays, anniversaries, graduations, travel, parties, holidays, new babies
- Aria mentions upcoming family events naturally in check-in calls 7 days before and day-of
- Senior sends gift to family — platform coordinates via 1-800-Flowers, Goldbelly, Amazon Gift Cards (stub)
- Senior sends physical card — $4.99, platform prints and mails with senior's name
- Celebration notes — free digital message from senior to family, shareable link or PDF
- Family travel awareness — Aria adjusts call tone when family member is traveling
- New baby/milestone events — Aria congratulates senior, platform helps coordinate gift

### Platform Automations (M17 additions) — IN PROGRESS
- **Health:** Prescription refill prediction (28-day), doctor appointment reminder (90-day chronic condition check), vaccination reminders (seasonal), isolation detection (7 consecutive calls no social contact)
- **Safety:** Extreme weather alerts, seasonal home safety checks, fall risk flag (dizziness + mobility device + going out alone)
- **Social:** Volunteer re-engagement (30-day no visit), event no-show follow-up, benefits renewal reminder (60-day)
- **Administrative:** Subscription value summary (7 days before renewal), inactive family nudge (30-day), onboarding completion reminder, navigator caseload warning (120+ members)
- **Services:** Transport follow-up, tech help success check, meal delivery feedback
- **Global rules:** Audit logged, family opt-out per member, max 2 automated notifications per family per day

### Enterprise + Partner Portals (M18–M19) — NOT STARTED
- Outcomes dashboard, employer portal, university portal, Medicare Advantage API
- School partner portal, VSO portal, nonprofit portal
- Agency portal, white-label, clinical documentation, multi-location management

### Community Organizations (M20) — DEFERRED
- Villages, AAAs, senior centers — build only when prospect identified

---

## Deferred Services — Activate When Ready

| Service | Activates With | Cost | Unlocks |
|---------|---------------|------|---------|
| Retell AI (Aria calls) | RETELL_API_KEY + RETELL_AGENT_ID | ~$0.05–0.11/min | Real daily AI calls |
| Twilio Voice + SMS | TWILIO_ACCOUNT_SID + AUTH_TOKEN + PHONE | ~$0.013/min + $0.008/SMS | Calls and SMS notifications |
| Anthropic API | ANTHROPIC_API_KEY | ~$0.003/1K tokens | Real AI summaries and care plans |
| SendGrid | SENDGRID_API_KEY | Free to 100/day | Email notifications |
| Checkr | Business account + API key | ~$30/check | Volunteer background checks |
| Lyft Healthcare | Commercial partnership | Per-ride | Transport dispatch |
| Instacart Business | Business account | Per-order | Grocery delivery |
| Teladoc | Healthcare partnership | Per-consultation | Telehealth |
| Language Line | Service agreement | Per-minute | 240+ language support |
| Artifact Uprising | Developer API | Per-book | Memory Book printing |

---

## Go-to-Market Plan

### Phase 1 — Seed (Months 1–3): 0–20 subscribers
Enroll 20 families manually in ONE metro area (Bay Area recommended). Be their concierge. Learn what matters. Activate Retell AI and Twilio. Don't charge yet or charge $1.
**Success signal:** 3 families say "I would pay $39/month for this." First local chapter taking shape.

### Phase 2 — Early Revenue (Months 4–6): 20–100 subscribers
Charge real prices. Collect testimonials. Join caregiver communities online. Pitch local press.
**Target:** $3K–$10K MRR

### Phase 3 — Growth (Months 7–12): 100–500 subscribers
Bay Area chapter reaches 50+ members → officially activate. Launch second chapter (Chicago or New York). First employer pilot. Senior center partnerships. First volunteer cohort per chapter.
**Target:** $15K–$50K MRR

### Phase 4 — Scale (Year 2): 500–5,000 subscribers
First employer contract. First Medicare Advantage conversation (need 12+ months of data). First university partnership. Hire first navigator.
**Target:** $100K+ MRR

### Phase 5 — Enterprise (Year 3): 5,000+ subscribers
First Medicare Advantage contract. 10+ employer clients. Agency portal live.
**Target:** $500K+ MRR

---

## Actions Required Before First Real User

### Legal (Critical — do before enrolling any real senior)
- [ ] Register business entity (LLC or C-Corp) + EIN + business bank account
- [ ] Sign Supabase BAA (requires Pro plan upgrade — $25/mo)
- [ ] Sign Twilio BAA (twilio.com/hipaa)
- [ ] Sign Retell AI BAA (contact their support)
- [ ] Sign Anthropic BAA (enterprise@anthropic.com)
- [ ] Sign SendGrid BAA
- [ ] Attorney draft Terms of Service + Volunteer Agreement + Navigator Agreement
- [ ] File trademark for "ThriveAtHome" with USPTO
- [ ] Get General Liability + Professional Liability (E&O) insurance
- [ ] Write emergency response protocol

### Technical
- [ ] Upgrade Supabase to Pro plan
- [ ] Create Retell AI account and build Aria agent in their dashboard
- [ ] Purchase Twilio phone numbers
- [ ] Create Anthropic API account with $25/mo spending limit
- [ ] Add all credentials to Vercel environment variables
- [ ] Set up custom domain (thriveathome.com or thriveathome.care)
- [ ] Disable Vercel deployment protection for public access
- [ ] Complete 65+ usability test with a real older adult

### Business
- [ ] Identify first 20 families for seed cohort
- [ ] Recruit 2–3 part-time care navigators (contractors initially)
- [ ] Set up customer support email and response process
- [ ] Create manual onboarding call script

---

## Key Metrics to Track

| Metric | Month 6 Target | Month 12 Target |
|--------|---------------|----------------|
| Active subscribers | 50 | 200 |
| Monthly churn | < 5% | < 3% |
| Check-in completion rate | > 85% | > 90% |
| Family dashboard DAU/MAU | > 40% | > 50% |
| Net Promoter Score | > 50 | > 60 |
| Alert-to-action rate | > 70% | > 80% |

---

## Competitive Landscape

| Competitor | Gap ThriveAtHome Fills |
|-----------|----------------------|
| Amazon Alexa Together | No AI conversation, no community, requires device |
| Life Alert / Medical Guardian | Reactive only, no daily connection, no family dashboard |
| Honor / CareLinx | Services only, no AI, no community layer |
| Papa | Single service, no family dashboard, no AI |
| Wellthy | No AI calls, no senior product, B2B only |
| Current Health | Clinical/medical, requires wearables, no community |

**The gap:** No company combines daily AI connection + family real-time visibility + genuine community + full services marketplace into one trusted consumer brand. ThriveAtHome is the first.

---

## Member Safety & Verification Policy

**Age verification:** Soft verification via date of birth at enrollment. Members must be 60+ to enroll as a senior. No ID upload required at launch. Medicare/Medicaid contracts will require formal age verification — handled at the B2B contract level when needed.

**Background checks:**
- Senior members: ❌ Never — deeply undignified and a barrier to adoption
- Family members: ❌ Not required
- Volunteers: ✅ Required via Checkr before first visit
- Paid companions: ✅ Required
- Care navigators: ✅ Required
- Agency care workers: ✅ Required

**Fraud protection (built into platform):**
- Aria detects gift card requests, new friend money requests, tech support scams, lottery scams, romance scams in call transcripts
- Large purchase notifications to family (any transaction over $50)
- New vendor contact alerts to family
- Fraud flag system visible to family and navigator
- Scam education content in tech help section
- "Report a concern" button on family dashboard

---

## What This Platform Is NOT

- Does not replace a doctor or provide medical advice
- Does not operate as a licensed home health agency
- Does not provide emergency medical dispatch (routes to humans and 911)
- Does not guarantee physical safety
- Does not replace human caregivers (augments and coordinates)
- Does not conduct background checks on senior members (this would be inappropriate and harmful)

---

## Document Reference

| Document | Purpose |
|----------|---------|
| `ThriveAtHome_Platform_Overview.md` | This document — single source of truth |
| `ThriveAtHome_Build_Phases_v4.md` | Detailed build status for all 62+ phases |
| `prompt-advanced.md` | Build instructions for M13–M20 |
| `prompt-addons.md` | Build instructions for M7–M12 |
| `partnerships-tracker.md` | All integration and partnership tracking |
| `legal-tracker.md` | Legal documents and compliance tracking |
| `progress.md` | Build session log (ongoing) |

---

*Version 1.0 — June 2026*
*Owner: Monica Mallick*
*Next review: When M17 completes or strategy changes*
