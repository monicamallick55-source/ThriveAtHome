# ThriveAtHome — Platform Overview
## Single Source of Truth — June 2026

> This document is the authoritative reference for ThriveAtHome's current state,
> vision, features, and go-to-market plan. It supersedes all previous spec documents.
> Update this document as major milestones complete or strategy evolves.

---

## What ThriveAtHome Is

ThriveAtHome is a comprehensive digital and human-services platform designed to help adults aged 65 and older live with confidence, safety, purpose, and connection in their own homes — for as long as they choose. It bridges AI-powered intelligence with warm human relationships, volunteer community networks, paid companion services, intergenerational student programs, skill exchange economies, and proactive family engagement.

**Core principles:**
- AI augments — never replaces — human connection and judgment
- Dignity first: seniors are contributors and teachers, not just recipients of care
- Family is looped in proactively, not reactively
- Community volunteers, paid companions, and students are a core part of the ecosystem
- Skill exchange recognizes seniors' wisdom as an asset to be shared
- Cultural identity and belonging are foundational to wellbeing
- Grief and life transitions are met with compassionate, sustained support
- Accessibility and simplicity are non-negotiable for UX
- Privacy, data ethics, and trust are foundational

**The core experience:**
A senior receives a warm daily phone call from Aria, ThriveAtHome's AI care companion. Aria asks how they're doing, checks in on mood, sleep, medications, and wellbeing — in a natural, unhurried conversation, never a checklist. After every call, the family receives an instant summary. If anything needs attention, the family and care team are alerted immediately.

**What makes ThriveAtHome different:**
- The only senior care platform built around human warmth, not clinical monitoring
- AI-powered daily check-ins that feel like a conversation, not a survey
- A real community layer — 20 Communities (cultural heritage + interest groups), events, skill exchange, volunteer connections
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

## Five-Layer Architecture

ThriveAtHome is built as a modular platform organized into five integrated service layers feeding a central member data hub:

| Layer | Components |
|-------|-----------|
| **Layer 1 — AI Connection & Support** | Check-in calls, 24/7 concierge line, family updates, alerts engine |
| **Layer 2 — Human Companion Network** | Volunteers, paid companions, student network, buddy programme, care coordination/navigators |
| **Layer 3 — Community & Events** | Virtual events, local events, skill exchange/time banking, Communities (20 total: 12 cultural heritage + 8 interest/hobby) |
| **Layer 4 — Services Marketplace** | Transportation, home services, health services, legal/financial, meals, on-demand tech help |
| **Layer 5 — Celebrations, Culture & Transitions** | Personalized celebrations, Communities (cultural & interest circles), grief & life transition support |

Every interaction — AI calls, volunteer visits, service requests, community attendance, family messages, celebration events, cultural programming, grief support touchpoints — flows through a unified member profile shared across all five layers.

## Brand Vision

**ThriveAtHome is a consumer brand first.**

Families trust ThriveAtHome. Partners use ThriveAtHome. The brand always belongs to ThriveAtHome.

- Own the consumer relationship end-to-end
- B2B partners amplify the brand — they never own the member relationship
- White-label is available for agencies but always "Powered by ThriveAtHome"
- Never license to direct competitors

The goal: become the first beloved consumer brand in senior care — the way families trust Apple or Spotify — in a market full of clinical, confusing, institutional tools.

---

## The Three Core Roles

ThriveAtHome uses three distinct roles that work together — each does something the others cannot:

### Aria (AI Companion)
- **Adaptive call frequency** — daily (default for all members), 3x/week (opt-down for resistant seniors), weekly (minimum viable signal for very resistant seniors)
- On the third call, Aria explicitly offers frequency choice: "Do you prefer I call every day, or would a few times a week suit you better?"
- Collects wellness data: mood, medications, energy, pain scores
- References previous conversations from the very first week — this is the primary retention mechanism
- Detects alerts: missed calls, mood drops, crisis language, medication misses
- Triggers celebrations, milestones, and family notifications
- Average call length: 15 minutes
- Available on ALL plan tiers
- Language rule: NEVER use "monitoring", "wellness check", "safety call", "check-up", "assessment" in any language Aria uses or that appears in UI. Always use "morning catch-up", "friendly call", "daily chat", "Aria's call"
- First call: Aria says "Our conversations are private. Your family only sees a friendly summary — not a recording or transcript."
- Family dashboard shows AI summary ONLY — never the transcript (trust design + HIPAA)
- Buddy concern details (`concern_description`) are navigator-only — family NEVER sees this field. Family sees buddy notes and family_note only.

### Human Buddy (Relationship Builder)
- A real assigned person who knows and cares about the member
- Relationship-focused, not task-focused — remembers stories, family, what matters
- Regular scheduled check-in calls or visits they agree on together
- Notices what Aria cannot — tone of voice, what's unsaid, loneliness between the lines
- Volunteer buddy on Connect and Complete plans; paid companion buddy on Premier
- Available on Connect, Complete, and Premier plans only
- The heart of the platform — what makes ThriveAtHome irreplaceable

### Navigator (Care Coordinator)
- Operational and clinical oversight — never the relationship
- Manages a caseload of up to 150 members
- Responds to Aria alerts, dispatches services, coordinates care
- Reviews care plans, manages crises, facilitates introductions
- The infrastructure behind the human connection — not a friend, a coordinator
- Available on Complete and Premier plans (shared pool for Basics and Connect — urgent only)

---

## Pricing Model

| Plan | Price | Aria | Human Buddy | Navigator |
|------|-------|------|-------------|-----------|
| **Thrive Basics** | $19/month | ✅ Daily AI calls | ❌ | Shared pool — urgent alerts only |
| **Thrive Connect** | $39/month | ✅ Daily AI calls | ✅ Volunteer buddy 2x/month | Shared pool — urgent alerts only |
| **Thrive Complete** | $69/month | ✅ Daily AI calls | ✅ Volunteer buddy weekly | ✅ Assigned navigator 2 hrs/month |
| **Thrive Premier** | $129/month | ✅ Daily AI calls | ✅ Paid companion buddy bi-weekly + priority matching | ✅ Dedicated navigator 8 hrs/month |

**Gift subscriptions:** Available in 1, 3, 6, and 12-month increments for all plans.

**Memory Book:** Free for Complete and Premier. $14.99–$19.99 one-time for Basics and Connect. Memorial Edition available for inactive members.

**B2B pricing:**
- Employer benefits: $8–$22 PEPM (per employee per month)
- University partnerships: $5K–$20K per year
- School district partnerships: $3K–$10K per year
- Corporate volunteer partnerships: $5K–$50K per year (3 tiers: Community Partner/Champion/Leader)
- Nonprofit platform license: $2,400–$15,000 per year (Starter/Growth/Scale tiers)
- Agency/enterprise: Custom PMPM (per member per month) contracts
- Medicare Advantage: $25–$50 PMPM
- Medicaid HCBS: $150–$300 PMPM
- Insurance white-label: $250K setup + $10–$30 PMPM

**B2C adult-children products:**
- Gift subscription (3 months): $129 one-time
- Gift subscription (1 year): $399 one-time
- Caregiver Family Plan: $89/month (1 senior on Complete + up to 5 family on dashboard + monthly coordinator call)
- Long-Distance Caregiver Add-on: $19/month
- Family Onboarding Call: $29 one-time

**Companion Device Bundle:** Pre-configured Thrive tablet — $99 one-time or $15/month, included free with 2+ year plan commitment

**Premium add-ons (full catalog, vision-stage):**
- Extra Care Navigator hours: $25/hour
- Paid Companion Credit Bundle: $100 for $120 in credits (17% bonus)
- Virtual Home Safety Assessment: $49 one-time
- Annual Care Planning Session: $149/session
- Benefits Maximizer Deep-Dive: $79 one-time
- Milestone Birthday Memory Book (physical, 70th/75th/80th): $49 one-time
- Physical birthday card (family co-signed): $9.99 one-time
- Skill Exchange Premium (priority matching): $9/month
- Communities Premium: $5/month
- Volunteer Concierge (premium matching): $19/month
- Extra annual legal consultation: $75/consultation

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

## Full Vision — Device & Integration Layer (roadmap, not yet built)

| Integration | Purpose | Status |
|--------------|---------|--------|
| Companion Device | Pre-configured Thrive Android tablet, simplified launcher | ⬜ Not built |
| Amazon Alexa Skills / Google Assistant Actions | Voice interface for smart home members | ⬜ Not built |
| Smart home (Echo, Nest, Ring, ADT, Philips Hue, GrandPad) | Passive safety signals, fall detection | ⬜ Not built |
| Wearables (Apple HealthKit, Google Fit, Fitbit, Garmin) | Activity, fall detection, vitals | ⬜ Not built |
| HL7 FHIR / Epic / Cerner EHR connectors | Clinical data exchange with health systems | ⬜ Not built |
| Behavioral anomaly detection (Isolation Forest ML) | No-motion / pattern deviation alerts | ⬜ Not built |
| Fall risk prediction (XGBoost) | Sensor + medication + history risk scoring | ⬜ Not built |
| Social isolation detection (Sentiment NLP) | Engagement trend analysis beyond Aria calls | ⬜ Not built |

These represent the technology layer of the full vision — they extend Aria's reach beyond phone calls into the home environment itself. Build when device/hardware partnerships and engineering capacity allow.

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
- Communities — 20 circles total (12 Cultural & Heritage + 8 Interest & Hobby), recommended for you
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
- **Important Dates & Renewals (supersedes Prescription Refill Management)** — flexible member-configurable system tracking prescriptions, home/car/health insurance, driver's license, car registration, AAA membership, passport, gym memberships, and any custom item. Document upload per item (insurance cards, registration docs). Aria proactively reminds in calls. Member can snooze, request navigator help renewing, mark complete, or reschedule/cancel appointments. Recurring items auto-advance; one-time items just complete.
- **Gift Sending** — gift intent detection in calls, gift marketplace (flowers, food, gift cards, handwritten cards), 15% platform commission, delivery tracking
- **Family-Initiated Celebrations** — special occasion requests, three coordination tiers (Digital free / Enhanced $25 / Premier $75), family coordination room, personalized Aria celebration calls using life story entries
- **Corporate Employee Volunteer Program** — B2B feature distinct from subscription benefit; employees volunteer hours tracked and exported in Benevity/YourCause-compatible formats for employer's CSR matching programs (e.g. Cisco, Genentech style giving programs). Captures employer's corporate giving budget as a second revenue line alongside the PEPM subscription benefit. 3-tier pricing: Community Partner ($5K-15K/yr), Champion ($15K-35K/yr), Leader ($35K-50K+/yr) — sellable standalone or bundled with subscription.

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

## Platform-Wide Additions (Cross-Cutting Features — All GTM Streams)

Six core capabilities needed across every channel — B2C direct, employer benefits, agency white-label, village/community orgs, and Medicare Advantage. Not channel-specific; foundational platform features.

| Feature | What It Does | Status |
|---------|-------------|--------|
| **Member Self-Service Portal** | Members log in directly (not only through family) to view profile, post needs, see events, update preferences, access life story | ⬜ Not built — platform currently family-first only |
| **Volunteer 24/7 Self-Service Claiming** | Volunteers browse and claim open service requests and member needs directly, without navigator or admin intervention | 🔄 Partial — navigator dispatch exists, direct claiming not built |
| **Donations Management** | Record donations, track totals, export donor list for tax receipts; "Donate" option for families and B2C support | ⬜ Not built |
| **Email/Newsletter Broadcast** | Any admin (org, employer, agency, navigator, platform) sends email to their members/employees/clients; filtered subgroups; schedule; basic stats | ⏸ Stub only — activates with SendGrid credentials |
| **Public Landing Pages** | /chapter/[slug], /org/[slug], /employer/[slug] as full SEO-optimised public marketing pages with about, programs, events, volunteer opportunities, contact form | 🔄 Partial — basic /chapter/[slug] exists, not full marketing page |
| **Document Library** | Upload, organise, and share documents (policies, forms, newsletters, care plans, training materials) with role-based visibility | ⬜ Not built |

**Why each channel needs these:**
- **B2C families:** Member self-service means seniors engage directly, not only through an adult child's account. Email keeps families informed. Public pages drive organic search discovery.
- **Employer benefits:** HR admins need email broadcast to enrolled employees and a branded public landing page for their benefits portal.
- **Agency white-label:** Care coordinators need document library for care plans, policies, and training materials. Email broadcast keeps clients informed.
- **Village/community orgs:** All six features are essential for daily village operations — Helpful Village (90+ village clients) includes all six.
- **Medicare Advantage:** Member self-service and document library are required for clinical-grade care management contracts.

---

### Full Volunteer Ecosystem Vision (8 Categories)

The complete vision calls for eight distinct volunteer categories — General Community Volunteers, Student Network, and Corporate Volunteer Teams are built or in progress. The remaining five are genuine roadmap gaps to build toward:

| Category | Status | Who They Are | What They Do |
|----------|--------|---------------|---------------|
| **Community Volunteers (General)** | ✅ Built (M13) | Adults applying directly | Phone calls, visits, errands, events |
| **College Students** | ✅ Built (M13) | University students | Tech help, companionship, life story projects |
| **Veteran Volunteers** | 🔄 Partial (Phase 57) | Veterans + VSO members | Peer support, benefits navigation, flag ceremonies |
| **Youth in Schools (K-12)** | 🔄 Partial (Phase 56) | K-12 students | Pen-pal letters, Life Stories interviews, mentorship reversal — *specific curriculum programs not yet built* |
| **Retired Professionals** | ⬜ Not built | Retired doctors, lawyers, CPAs, teachers, engineers | Health literacy circles, legal clinics, VITA tax help, tutoring, tech help, financial guidance |
| **Faith Community Volunteers** | 🔄 Partial (Faith Community within /dashboard/communities) | Congregation members | Pastoral visits, prayer partnerships, chaplain referral network — *chaplaincy network not yet built* |
| **Corporate Volunteer Teams** | 🔄 In progress (Phase 50l, moved up from M21) | Employee groups | Individual hour tracking + group event hosting, exported to employer's Benevity/YourCause/Bright Funds matching program, 3-tier pricing (Partner $5K-15K/yr, Champion $15K-35K/yr, Leader $35K-50K+/yr) |
| **Neighbor Volunteers** | ⬜ Not built | Members in same zip code | Informal check-ins, quick errands — light coordination |
| **Family Volunteers (Reciprocity)** | ⬜ Not built | Other members' family caring for unrelated seniors | Caregiver reciprocity — earn hours helping others |

**Also part of the vision, not yet built:**
- Member Ambassador programme — experienced members welcome and guide new members
- Annual Intergenerational Showcase — student-produced life story collections shared at campus events
- Unified volunteer impact dashboard with LinkedIn credential integration
- Volunteer milestone recognition (50/100/250/500 hour badges + mailed thank-you notes)

### Social Connection Features (M17 addition) — IN PROGRESS
Three-layer social model — warm connection without full social network complexity:
- **Layer 1 — Circle Connections** (already built): members meet through shared circles and events, post to circle feeds, RSVP to events
- **Layer 2 — Friend Connections**: after meeting in a circle or event, members can send friend requests, see each other's first name and interests, exchange private messages inside ThriveAtHome — no contact info shared
- **Layer 3 — Navigator-Facilitated Introductions**: member requests a connection ("find me someone who loves gardening"), navigator or AI suggests compatible member, warm introduction sent to both

**Security model (minimum viable):**
- Auto-redact phone numbers and emails from posts and messages
- Scan private messages for money/gift card requests — flag to navigator immediately
- Report button on all posts and messages — navigator reviews within 24 hours
- One-time community guidelines acknowledgment (3 bullet points, large text, single tap)
- No public community feed, no full social graph — deferred to Year 2

### Enterprise + Partner Portals (M18–M19) — NOT STARTED
- Outcomes dashboard, employer portal, university portal, Medicare Advantage API
- School partner portal, VSO portal, nonprofit portal
- Agency portal, white-label, clinical documentation, multi-location management

### Community Organizations (M20) — 🔄 IN PROGRESS

M20 builds portals for four types of community organizations that license ThriveAtHome to manage their own senior member communities. Revenue model: annual license fee per org ($2,400–$15,000/year depending on size and tier).

| Phase | What It Builds | Status |
|-------|---------------|--------|
| **Phase 63 — Village / Community Organization Portal** | Portal for village networks and nonprofits. Member needs bulletin board, sliding-scale annual dues, org programs tracking, org_memberships table, Bay Area Village Network seeded with 3 programs | 🔄 In progress |
| **Phase 64 — Area Agency on Aging Portal** | Portal for government-funded AAAs. Multi-county management, Title III service tracking (III-B/C1/C2/D/E), NAPIS-compliant CSV export, OAA client assessments. Bay Area AAA seeded serving SF/Marin/San Mateo | ✅ Built |
| **Phase 65 — Senior Center Portal** | Drop-in attendance tracking, activity calendar, room booking, congregate meal tracking (feeds OAA Title III-C1 reporting). SF Senior Center seeded | 🔄 In progress |
| **Phase 66 — Network Federation** | Parent network accounts for umbrella organizations. Village to Village Network and n4a seeded. Aggregate reporting across member orgs, anonymized benchmarking, annual network dues billing, /network-admin portal | 🔄 In progress |

**Who uses M20:** Village network coordinators, Area Agency on Aging staff filing federal NAPIS reports, senior center directors, national umbrella organizations like VtVN.

**Platform-Wide Additions (Phases 67–72) build immediately after M20 Phases 63–66** and apply to all GTM streams — not just M20.
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

## Formal Launch Protocol — Human-First, AI-Optional

**Core principle:** Trust is earned before technology is introduced. The first 30 days are human-only. Aria AI calls are opt-in — seniors choose if, when, and how often.

**The four roles:**
- **Aria AI (opt-in only):** Daily wellness pulse — only when senior explicitly consents. Default is NO.
- **Human buddy:** Weekly meaningful conversation — always, regardless of Aria choice
- **Human navigator:** Crisis response, first 30 days, cultural nuance — never replaced by AI
- **AI backend:** Operations, data intelligence, family report drafting — frees navigators for human work

**30-day onboarding sequence:**
- Days 1–7: Navigator personally calls within 24 hours. Relationship first, no mention of Aria.
- Days 8–20: Navigator 1–2x/week. Buddy matched and introduced. Human rhythm established.
- Day 21: Navigator gently introduces Aria option. Member decides. Default is NO.
- Day 30+: Aria only for members who opted in. Human buddy continues weekly for everyone.

**Competitive positioning:** "Your parent decides if Aria calls. They can always say no. What they always get: a real navigator and a real buddy." This is the only platform where the senior controls AI contact AND always has human support regardless of their choice.

---

## Platform Completion — M22 through M27 (August 2026)

M1 through M27 are all complete. The following milestones were added after the original Platform Overview was written:

| Milestone | What Was Built | Status |
|-----------|---------------|--------|
| **M22 — Device & Smart Home** | /dashboard/devices — Companion Device, Alexa/Google, Wearables (Fitbit), Fall Protection, Health Records (Epic/FHIR), fall detection protocol | ✅ Complete |
| **M23 — Advanced AI/ML Layer** | Wellness baselines, behavioral anomaly detection, fall risk prediction, isolation scoring, grief pattern monitoring. Navigator ML insights panel. | ✅ Complete |
| **M24 — Professional Services** | Trusted Advisor Directory (6 vetted advisors), VITA tax help (4 sites), /crisis page with 988, document vault with expiry tracking, advisor_connections | ✅ Complete |
| **M25 — Cultural Programming Depth** | Cultural festival calendar (23 festivals), Classes, Potlucks, Story Circle, Heritage Projects, Oral History. Communities navigation pills. | ✅ Complete |
| **M26 — Premium Add-Ons** | 5 monthly + 4 one-time add-ons. Caregiver Family Plan, Skill Exchange Premium, Annual Care Planning, Memory Book orders, Long-Distance Caregiver video diary. | ✅ Complete |
| **M27 — Pet & Companion Life Tracking** | Pet profiles, pet birthdays, Pet Loss Circle, pet-loss support requests, pet milestone celebrations, navigator pet section. | ✅ Complete |
| **Phase 55 — Multilingual UI** | Full i18n framework, multilingual Aria calls | ⏸ DEFERRED — after production launch + first revenue |

## AI Voice Agent Architecture — 12 Named Agents (September 2026)

ThriveAtHome uses 12 distinct Retell AI voice agents, each with a unique name, personality and voice:

**Senior-facing (outbound):** Aria (daily companion), Joy (celebrations), Grace (reminders)
**Senior-facing (inbound):** Rosa (Care Line), Hope (Crisis Line — 24/7)
**Family-facing:** Claire (Family Support Line)
**Staff/volunteer-facing:** Sam (Volunteer Line), Morgan (Buddy Support), Nova (Navigator Assist — internal), Alex (Staff Support)
**B2B-facing:** Quinn (Concierge — 24/7), Jordan (Partner Support)

Multilingual agents (Ming/Devi/Luna) deferred to Phase 55.
Full prompts and setup: ThriveAtHome_AI_Agent_Architecture_Complete_v2.docx
Stub activation: ThriveAtHome_Stub_Activation_Guide_v1.docx

## ThriveAtHome — "Senior Belonging Platform"

ThriveAtHome owns the category name "Senior Belonging Platform" — the first platform combining daily AI companion calls, human buddy relationships, care navigation, 20 communities, and a full services ecosystem for aging-at-home seniors.

## Aria Opt-In Strategy (August 2026 Decision)

Aria daily check-in calls are **opt-in only** — the default is NO. Seniors must actively choose to receive Aria calls during onboarding or from the member portal Notifications tab. This is a trust-first design decision: human navigator calls come first (Days 1-21), Aria is introduced gently at Day 21 with a sample, senior decides. Members who opt out receive navigator periodic check-ins and can request check-ins at any time.

See ThriveAtHome_Launch_Protocol_v1_August2026.docx for the complete human-first launch sequence.

---

## Go-to-Market Plan

### Phase 1 — Seed (Months 1–3): 0–20 subscribers
**Strategy: Parallel Blitz** — launch B2C subscriptions, free Communities (cultural + interest circles), university/MSW partnerships, AND Grief Welcome Path simultaneously from Month 1. Not sequentially.

**Month 1:** Activate Retell AI + Twilio + Anthropic + SendGrid in Week 1 — **Aria calls must be live in Week 1. This is non-negotiable because the 12-month data clock for Medicare Advantage conversations starts now.** Enrol first 5 seniors. Launch Latino/Hispanic and Chinese-American Communities FREE. Post on Handshake as service-learning partner. Initiate all BAAs. Send MSW field placement pitch to 3–5 social work department chairs. Start building employer target list (LinkedIn research on HR directors at Bay Area 500–5,000 person companies — do not pitch yet, just build the list).

**Month 2:** Enrol seniors 6–12. First MSW placement student begins supervised buddy casework. Add buddy matching questions to onboarding for Connect+ plans. Begin outreach to 1–2 local hospice organizations and hospital social work departments — introduce ThriveAtHome as a post-bereavement support resource for their clients.

**Month 3:** Enrol seniors 13–20. First real alert caught and acted on. Meals on Wheels referral workflow live. First university partnership in active conversation (target signed Month 4). Charge $1/month to test payment flow. **Launch Grief Welcome Path** — first bereaved/widowed senior referred via hospice or hospital social worker. 48-hour buddy assignment SLA begins. This is the highest-LTV retention segment ($1,400–$4,600 in subscription revenue over 3+ years) and no competitor has this pathway. Submit first grant applications: RWJF Health Equity, AARP Foundation, local community foundation — B Corp designation (starting Month 3–4) unlocks most of these.

**Success signal:** 3 families say "I would pay $39/month for this." First grief path member enrolled. First local chapter taking shape.

### Phase 2 — Early Revenue (Months 4–6): 20–100 subscribers
Charge real prices. Collect testimonials. Join caregiver communities online. Pitch local press.
**Month 4–5: Begin employer outreach** — pitch first 3–5 HR directors at target companies. Enterprise sales cycles are 5–6 months, so outreach at Month 4–5 means first contracts close at Month 9–10. Do not wait for a polished product — the Aria daily call story is compelling enough now. Lead with: "Unlike Homethrive, ThriveAtHome actually calls your employee's parent every morning." Targeted: companies with 500–5,000 employees in Bay Area where you have a geographic presence.
**Target:** $3K–$10K MRR + grant applications in review

### Phase 3 — Growth (Months 7–12): 100–500 subscribers
Bay Area chapter reaches 50+ members → officially activate. Launch second chapter (Chicago or New York). **First employer contract closes** (started outreach Month 4–5). Senior center partnerships. First volunteer cohort per chapter. First Helpful Village org partnership (Phase 73). **Do not start MA sales motion yet** — need 12 months of Aria outcome data first. Grant revenue expected to land: $50K–$300K from RWJF/AARP Foundation applications submitted Month 3.
**Target:** $15K–$50K MRR

### Phase 4 — Scale (Year 2): 500–5,000 subscribers
**First Medicare Advantage conversation begins** (12+ months of data now available via Phase 76 MA Outcomes Data Package). 2–3 employer contracts active (started outreach Month 4–5). 5+ Helpful Village org partnerships. First university partnership renewed. Hire first navigator. Agency referral partnerships generating 100+ members/month.
**Target:** $100K+ MRR

### Phase 5 — Enterprise (Year 3): 5,000+ subscribers
First Medicare Advantage contract. 10+ employer clients. Agency white-label live. 25+ Village org partnerships. National chapter network.
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

## Full Success Metrics & Outcomes (the vision's definition of success)

### Senior Wellbeing Outcomes (clinical-grade targets)
- Emergency room visits reduced 25%+ vs baseline (monitored cohort)
- Loneliness and social isolation: 30%+ improvement on UCLA Loneliness Scale
- Medication adherence rate: >85% for enrolled seniors
- Fall-related hospitalizations: 20%+ reduction through early detection + prevention
- Purpose and contribution scores: 40%+ improvement for skill exchange participants
- Senior NPS: target >65

### Community & Engagement Metrics
- Check-in completion rate: >80% of enrolled seniors weekly
- Event participation: >50% of members attend at least 1 community event per month
- Skill exchange: >30% of members participate in teaching or learning within 90 days
- Interest group retention: >70% of group members still active at 90 days
- Volunteer match fulfillment: >85% of requests filled within 48 hours
- Student network hours: 10,000+ annually by end of Year 2

### Celebrations & Cultural Metrics
- Birthday celebration engagement: >85% of members with active community connections
- Family coordination rate: >60% of birthdays include family-coordinated activity
- Communities participation: >40% of non-English-primary members joined within 60 days
- Cultural event attendance: >50% of Communities members attend monthly
- Language accessibility: >90% of non-English members can complete primary tasks in their language

### Grief & Transition Support Metrics
- Bereavement response time: 100% of reported losses receive navigator call within 24 hours
- Grief circle participation: >50% of bereaved members join within 30 days
- Prolonged grief disorder detection: >80% of at-risk members identified within 90 days
- Nursing home transition retention: >70% of members who transition remain on platform
- Transition support satisfaction: >85% rate platform support as helpful

### Volunteer Ecosystem Metrics (full-scale targets)
- Total active volunteers: 5,000 by Year 1; 25,000 by Year 2; 50,000 by Year 3
- School partnerships: 25 by Year 1; 150 by Year 2; 500 by Year 3
- Volunteer fulfillment rate: >88% matched within 48 hours
- Volunteer retention (annual): >65% still active after 12 months
- Corporate volunteer partnerships: 10 by Year 1; 100 by Year 2; 300 by Year 3
- Veteran volunteer network: 2,000 veteran volunteers active by Year 2
- Volunteer NPS: >70

### Financial & Business Metrics (full-scale targets)
- CAC: <$120 B2C; <$15,000 employer; <$200,000 MA plan
- LTV:CAC ratio: >15:1 at steady state
- Monthly churn: <2% B2C; <0.5% enterprise
- Gross margin: >70% by Year 2
- Marketplace GMV: $10M+ by Year 3

## Competitive Landscape

| Competitor | Focus | Missing Piece | ThriveAtHome Advantage |
|-----------|-------|---------------|------------------------|
| Best Buy Health / Current Health | Remote patient monitoring | No community, no AI check-in calls, not senior-first UX | Full social + cognitive layer + concierge phone + 20 Communities (cultural + interest) + celebrations |
| GrandPad | Simplified tablet for seniors | Device only — no care coordination or intelligence | AI engine + human navigators + community + cultural support built-in |
| Papa Inc. | Companion/volunteer visits | Reactive visits only — no monitoring, no AI | AI proactive check-ins + skill exchange + events + grief support |
| LifeStation / Medical Alert | Emergency SOS wearables | Emergency only — no wellness, community, or family layer | Wellness baseline + community + family reporting + cultural + celebrations |
| Carely / Well | Family communication apps | Family-only — no senior experience or care coordination | Senior-facing platform + navigator + community + 20 Communities (cultural + interest) |
| AARP / SilverSneakers | Benefits + fitness | Fragmented — no monitoring, no care navigation | Integrated full-stack with AI + human + community |
| Home Instead / Visiting Angels | In-home professional care agencies | Very high cost, no tech, no family integration, no community | 10x lower cost with tech layer + community engagement + cultural support |
| Local Senior Centers | In-person programming | Geographic limitation; no tech layer, no AI, no family reporting | Everything local centers offer plus 24/7 AI, family layer, and anywhere access |

## B2B Provider Software — ThriveAtHome as the Wellness Layer

Home care agencies running WellSky, Homecare Homebase, AlayaCare, or AxisCare have a structural gap: their clients go home after a caregiver visit and disappear from the platform until the next visit. ThriveAtHome fills that gap as the **member wellness layer** — not replacing agency operations software, but completing the member experience between visits.

| What WellSky/Homecare Homebase Does | What ThriveAtHome Adds |
|-----------------------------------|----------------------|
| Scheduling, billing, EVV compliance | Aria daily check-in calls to members between visits |
| Caregiver mobile app | Family proactive wellness dashboard |
| Care plan documentation | Mood trends, alert detection, isolation signals |
| OASIS/clinical documentation | Community, skill exchange, cultural circles |
| Route optimization | Grief and transition support |

**ThriveAtHome does NOT compete with or replace:** EVV, Medicare/Medicaid billing, OASIS assessments, physician order management, or caregiver HR tools. Those stay with WellSky/Homecare Homebase/AlayaCare.

**Agency pitch:** "Your caregivers visit 3×/week. ThriveAtHome is there the other 4 days. You keep your existing software for operations. We complete your clients' experience."

**ThriveAtHome is also NOT:** A platform for assisted living facilities, nursing homes, or memory care units (PointClickCare, MatrixCare, Yardi Senior Living serve that market). ThriveAtHome serves only independent aging-at-home seniors. When a member transitions to a facility, ThriveAtHome provides transition support and maintains the family dashboard, but does not manage facility operations.

---

**The gap:** ThriveAtHome is the only platform that integrates: (1) proactive AI voice check-ins, (2) 24/7 concierge phone line, (3) paid companion marketplace, (4) volunteer + student networks, (5) skill exchange time banking, (6) persistent interest groups, (7) virtual + local events, (8) full services marketplace including meals, (9) family proactive reporting, (10) human care navigation, (11) personalized celebrations, (12) 20 Communities (12 cultural heritage circles + 8 interest/hobby groups) with language support for cultural heritage circles, (13) grief and life transition support pathways, (14) an 8-category volunteer ecosystem, and (15) a human Buddy programme — all in a single platform, across multiple funding models.

## Founding Team & Key Roles (full-scale org vision)

| Role | Responsibilities | Ideal Background |
|------|------------------|-------------------|
| CEO / Co-Founder | Vision, fundraising, partnerships, culture | Aging/healthcare innovation, startup experience |
| CTO / Co-Founder | Platform architecture, engineering leadership, AI strategy | Full-stack, healthtech, AI/ML, voice AI |
| Chief Care Officer | Care navigator model, clinical protocols, quality, volunteer program | Gerontology, social work, nursing leadership |
| VP Product | Roadmap, UX, senior accessibility design, community features | Consumer health product, accessibility focus |
| VP Sales — Enterprise | Employer + insurance + government BD | Healthcare enterprise SaaS |
| VP Marketing / Growth | Brand, B2C acquisition, content, community partnerships | Consumer health or senior market marketing |
| Head of Community Programs | Volunteer, student network, skill exchange, events, Communities (cultural + interest circles) | Community organizing, education partnerships |
| Head of Cultural Engagement | Communities (cultural + interest) strategy, language access, advisory panels, festival programming | Multicultural community organizing, senior services |
| Head of Grief & Transition Services | Grief support pathways, professional support network, transition protocols | Clinical social work, palliative care, gerontology |
| Head of Volunteer Ecosystem | All volunteer categories: schools, veterans, professionals, faith, corporate | Volunteer management, corporate partnerships |
| Head of Partnerships | Nonprofit, government, university, community org relationships | Aging services, government affairs |
| Lead Data Scientist | AI models, behavioral analytics, outcomes research | ML/NLP, health data, responsible AI |
| Head of Compliance | HIPAA, SOC2, government contracting, data ethics | Healthcare compliance, legal |

*This is the full-scale organizational vision. As a solo founder today, prioritize hiring in this order: first Care Navigator (Month 10–11 per Strategy v4), then Head of Partnerships (when first university/employer contracts close), then Chief Care Officer and VP Product as Series A funding allows.*

---

## Member Safety & Verification Policy

**Age verification:** Soft verification via date of birth at enrollment. Members must be 65+ to enroll as a senior. No ID upload required at launch. Medicare/Medicaid contracts will require formal age verification — handled at the B2B contract level when needed.

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

## Corporate Structure

**Entity:** Delaware C-Corporation with Public Benefit Corporation (PBC) designation — filed simultaneously at formation.

**Why Delaware C-Corp (not LLC):**
Every VC term sheet, angel investment agreement, accelerator, and acquirer expects a Delaware C-Corp. Do not form an LLC — it converts poorly and has no preferred stock instrument.

**Formation steps:**
- Register Delaware C-Corp + PBC via Stripe Atlas or Clerky (~$500–$800 total)
- Issue 10,000,000 founder shares at $0.0001/share — file 83(b) election with IRS within 30 days
- Reserve 10–15% ESOP at formation for employees, advisors, future co-founders
- 4-year founder vesting, 1-year cliff — required even as solo founder

**B Corp Certification:** Start B Impact Assessment Month 3–4. Target certification during seed phase. Costs $2K–$5K. Unlocks university procurement preference, impact investors, AARP/foundation partners, press.

**ThriveAtHome Foundation (Year 2–3):** Separate 501(c)(3) using 1% revenue model once ARR exceeds $500K. Funds subsidised Community Access memberships for low-income seniors. Unlocks grants from Robert Wood Johnson, AARP Foundation, Archstone, federal programmes. Use fiscal sponsorship with a local AAA for any earlier grant opportunity.

**Pre-seed funding:** SAFE note $100K–$500K (no valuation negotiation needed). Target impact investors: Pivotal Ventures, Andreessen Horowitz Bio Fund, Obvious Ventures, AARP Foundation investment arm.

---

## What This Platform Is NOT

- Does not replace a doctor or provide medical advice
- Does not operate as a licensed home health agency
- Does not provide emergency medical dispatch (routes to humans and 911)
- Does not guarantee physical safety
- Does not replace human caregivers (augments and coordinates)
- Does not conduct background checks on senior members (this would be inappropriate and harmful)

---

## KPI Dashboard

| Metric | Month 3 | Month 6 | Month 12 | Why It Matters |
|--------|---------|---------|---------|---------------|
| Active paying subscribers | 20 | 100 | 400+ | Foundation for all B2B channels |
| Aria call completion rate | >75% | >85% | >90% | Primary signal of senior acceptance |
| Daily call opt-down rate | <20% | <15% | <10% | Higher opt-down = Aria quality issue |
| Monthly churn | <8% | <5% | <3% | Above 5% = leaky bucket |
| Family dashboard DAU/MAU | >25% | >40% | >50% | Daily checkers don't cancel |
| Buddy assignments active | 0 | 20+ | 80+ | Buddy supply chain working |
| Buddy call completion rate | — | >80% | >85% | Buddies keeping commitment |
| Buddy matching fulfilment | — | <7 days | <5 days | Time from enrolment to first buddy call |
| Connect+ churn vs Basics | — | Measure | Should be lower | Buddy programme retention proof |
| Alert-to-human-action rate | >60% | >70% | >80% | Data-triggered human model working |
| Communities active members | 30+ | 150+ | 500+ | Community moat building |
| University partnerships signed | 0 | 2 | 4–5 | ARR + buddy + navigator supply |
| Navigator caseload ratio | <50:1 | <100:1 | <150:1 | Above 150:1 = quality degrades |
| NPS score | >40 | >50 | >60 | Primary referral engine |

## Full Monetization Model (10 Revenue Streams)

ThriveAtHome is designed to be financially sustainable across ten distinct revenue streams — reaching seniors through the most appropriate funding mechanism for each demographic and market context:

| # | Model | Primary Buyer | Mechanism | Market Size |
|---|-------|---------------|-----------|-------------|
| M1 | Nonprofit / Grant Funded | Foundations, government, donors | Grants + sliding-scale partner fees | $50B+ aging services grants/yr |
| M2 | Corporate Employee Benefits | Employers (caregiver employees) | PEPM | $45B employer benefits market |
| M3 | Government Programs | Medicare Advantage, Medicaid, VA | Capitated care + PMPM | $800B+ Medicare/Medicaid spend |
| M4 | Insurance Partnerships | Health insurers, LTC insurers | License fee + outcomes-based PMPM | $150B+ supplemental benefits |
| M5 | B2C — Seniors Direct | Adults 65+ | Monthly/annual subscription | 54M+ US seniors |
| M6 | B2C — Adult Children | Adult children of aging parents | Gift sub + caregiver membership | 44M US family caregivers |
| M7 | Community Hub (Travel + Premium) | Members + B2B | Trip fees, commissions, premium add-ons | Growing senior travel market |
| M8 | Celebrations & Cultural | Members + sponsors | Celebration add-ons, festival sponsorships, physical goods | $3.2M Year 3 target |
| M9 | Professional Services Network | Members + service providers | Legal/financial/tech referral fees + paid directory listings | $2.1M Year 3 target |
| M10 | Corporate Volunteer Program | Employer clients | Corporate partner fees + skills-based engagement | $1.8M Year 3 target |

## Long-Term Financial Vision (Full-Scale, from Comprehensive Specs)

| Revenue Stream | Year 1 | Year 2 | Year 3 |
|----------------|--------|--------|--------|
| B2C Subscriptions | $2.4M | $13M | $44.8M |
| Employer Benefits (PEPM) | $3.6M | $18M | $52M |
| Government / Medicare Advantage | $1.2M | $12M | $45M |
| Insurance White-Label / Partnerships | $0.5M | $4M | $15M |
| Nonprofit Platform Fees | $0.3M | $1.5M | $4M |
| Companion & Services Marketplace | $0.8M | $4.5M | $14M |
| University + School Partnerships | $0.3M | $1.4M | $3M |
| Community Hub (Travel + Premium) | — | $1M | $5.8M |
| Celebrations & Cultural | — | $0.8M | $3.2M |
| Professional Services Network | — | $0.55M | $2.1M |
| Corporate Volunteer Program | — | $0.5M | $1.8M |
| **TOTAL REVENUE** | **$9.1M** | **$56.8M** | **$190.7M** |

*Target gross margin >70% by Year 2. EBITDA target: ($1.2M) Y1 → $26.8M Y2 → $120.7M Y3 at 63% margin at scale.*

## Near-Term Execution Ramp (Parallel Blitz — first 12 months toward the vision above)

The long-term vision above is the destination. The table below is the realistic Month 1–12 starting trajectory using the Parallel Blitz launch strategy — conservative, bottom-up, and tied to actual operational capacity as a solo founder before institutional capital and full team are in place:

| Channel | Year 1 (realistic start) | Year 2 | Year 3 |
|---------|--------------------------|--------|--------|
| B2C subscriptions | $85K–$200K | $400K–$900K | $1.2M–$2.5M |
| Employer PEPM | $15K–$60K | $150K–$500K | $600K–$1.5M |
| University / schools | $20K–$75K | $100K–$300K | $250K–$600K |
| Delivery marketplace | $9K–$35K | $110K–$340K | $300K–$800K |
| Memory Book | $5K–$20K | $30K–$80K | $80K–$200K |
| Companion marketplace | $3K–$12K | $25K–$80K | $80K–$250K |
| Medicare Advantage | — | $50K–$200K | $500K–$2M |
| **TOTAL** | **$137K–$402K** | **$865K–$2.4M** | **$3M–$7.85M** |

*This ramp is the realistic bridge from $0 to the full-scale vision — once funded with Seed/Series A capital and a built-out team (Care Navigator team, Celebration Coordinators, Cultural Engagement leads, Volunteer Ecosystem staff), growth accelerates toward the long-term financial vision above.*

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
