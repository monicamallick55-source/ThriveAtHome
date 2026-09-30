# GAP BUILD SPEC G6 — New Features: Home Safety, Home Sharing, Encore Careers, Member-in-Need Campaigns

> Gap Build series (G1–G6), written 2026-09-30. Requested by the founder on Sept 30, 2026.
> Same loop and rules as `gaps/GAP_BUILD_PROMPT.md`. Build after G5. G6.0 creates `community_partners`, which G5.1 also uses — G5.1 runs first, so it creates the table using the G6.0 schema, and G6.0 then only adds what's missing. G6 also relies on `acting_member_ids()` and `is_staff()` from G2.0.
> Medicare work requested at the same time is in **G5.1**.

**Partner facts in this file were checked on Sept 30, 2026, but the human must confirm every phone number, eligibility rule and referral process with the partner before a partner record is set to `active`.** Partner rows are seeded as `status='pending_confirmation'` and are hidden from members until an admin activates them.

---

## PHASE G6.0 — Community partners (shared foundation)

One table for every outside organisation ThriveAtHome refers members **out to** (home sharing, home repair, SCSEP, HICAP, job centres…).

**Do not confuse with the existing `referral_partners` table** (migration 058, `/api/admin/referral-partners`): that one lists hospices and hospital social workers who refer people **in** to ThriveAtHome. Leave it unchanged.

**Migration (next free number, e.g. 09X_community_partners.sql):**
```sql
CREATE TABLE IF NOT EXISTS community_partners (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        timestamptz DEFAULT now() NOT NULL,
  name              text NOT NULL,
  category          text NOT NULL CHECK (category IN
                    ('home_sharing','home_repair','home_modification','employment','scsep',
                     'medicare_counseling','housing','other')),
  description       text,
  service_counties  text[] NOT NULL DEFAULT '{}',   -- e.g. {'San Mateo'}
  service_zip_prefixes text[] NOT NULL DEFAULT '{}',
  phone             text,
  website           text,
  referral_method   text NOT NULL DEFAULT 'warm_call' CHECK (referral_method IN ('warm_call','member_calls','online_form','email','api')),
  referral_email    text,
  eligibility_notes text,
  cost_to_member    text,                          -- 'Free', 'Sliding scale', etc.
  status            text NOT NULL DEFAULT 'pending_confirmation'
                    CHECK (status IN ('pending_confirmation','active','paused')),
  confirmed_by      uuid REFERENCES family_members(id),
  confirmed_at      timestamptz,
  mou_signed        boolean NOT NULL DEFAULT false
);
ALTER TABLE community_partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cp_read_active" ON community_partners FOR SELECT USING (status = 'active' OR is_staff());
CREATE POLICY "cp_staff_write" ON community_partners FOR ALL USING (is_staff());

CREATE TABLE IF NOT EXISTS partner_referrals (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at     timestamptz DEFAULT now() NOT NULL,
  member_id      uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  partner_id     uuid NOT NULL REFERENCES community_partners(id),
  program        text NOT NULL,                     -- 'home_sharing_provider', 'safe_at_home', 'scsep', …
  consent_given  boolean NOT NULL DEFAULT false,    -- member consented to sharing contact details
  consent_at     timestamptz,
  status         text NOT NULL DEFAULT 'requested' CHECK (status IN
                 ('requested','sent','partner_contacted','in_progress','completed','declined','closed')),
  navigator_task_id uuid REFERENCES navigator_tasks(id),
  notes          text,
  next_check_in  date
);
ALTER TABLE partner_referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pr_own_or_staff" ON partner_referrals FOR ALL
  USING (member_id = ANY(acting_member_ids()) OR is_staff())
  WITH CHECK (member_id = ANY(acting_member_ids()) OR is_staff());
```
(If G5.1 already created `community_partners`, add any missing columns instead.)

**Rules for every referral:**
- Explicit consent screen before any member detail leaves ThriveAtHome: what is shared, with whom, why. No consent → the member gets the partner's phone number to call themselves (`member_calls`).
- Each referral creates a navigator task and a follow-up check-in (default 14 days) so no referral goes silent.
- `/admin/community-partners`: list, add, confirm, pause partners; filter by category and county. (Separate from `/admin/partners` in G5.9, which manages FHIR API partners.)

**Seed (status `pending_confirmation`):**

| Name | Category | County | Phone | Note |
|---|---|---|---|---|
| HIP Housing — Home Sharing Program | home_sharing | San Mateo | 650-348-6660 | Interviews, references, income check and photo ID; matches home providers and seekers; Living Together Agreement; ongoing follow-up; home visits for homebound seniors. Rent exchange or service exchange. www.hiphousing.org |
| Rebuilding Together Peninsula — Safe at Home | home_repair | San Mateo; north Santa Clara | 650-366-6597 | Free safety/health repairs and modifications for low-income homeowners |
| Center for Independence of Individuals with Disabilities (CID) | home_modification | San Mateo | 650-645-1780 | Grab bars, railings, ramps for people with disabilities |
| Felton Institute — SCSEP | scsep | San Mateo; Marin | (confirm) | Senior Community Service Employment Program provider per California Dept. of Aging list |
| NOVAworks Job Center — San Mateo | employment | San Mateo | (confirm) | 1777 Borel Place, Suite 500, San Mateo |
| HICAP of San Mateo County | medicare_counseling | San Mateo | (confirm) | Free Medicare counselling (used by G5.1) |

```
PHASE G6.0 CHECKLIST
[ ] Seeded partners hidden from members until activated; visible to staff
[ ] Admin confirms a partner → status active, confirmed_by/at set
[ ] Referral without consent → no contact details stored for partner; member shown partner phone instead
[ ] Referral with consent → partner_referrals row + navigator task + 14-day check-in
```

---

## PHASE G6.1 — Home Safety Program

**What:** Helpful Village villages commonly run home-safety programmes (volunteer home safety checks and small fixes). I could not confirm the exact scope of Helpful Village's own module, so this is designed from village practice and the platform's existing fall-risk data. Ask the human to compare with a Helpful Village demo account and note any gap.

**Flow:**
1. **Request** — member, family, navigator, or automatically suggested when: Aria/Grace hears a fall mention, `fall_risk_scores` is MEDIUM/HIGH, the member returns home from hospital (G5.4), or a yearly re-check is due. Suggestion = a card + navigator task, never an automatic visit.
2. **Visit** — a trained volunteer (requires the G4.7 module "Home safety check") or a navigator does an in-home or **virtual (video) walkthrough** using the checklist. The $49 **Home Safety Assessment (virtual)** premium add-on is this virtual walkthrough by a navigator; in-person volunteer checks stay free.
3. **Checklist** — room by room (entrances/steps, living areas, kitchen, bathroom, bedroom, stairs, lighting, emergency). Each item: ok / concern / not applicable, photo optional, note. Include: loose rugs and cords, night lighting path bedroom→bathroom, grab bars at toilet and shower, non-slip mats, stair rails both sides, reachable storage, smoke and CO alarms tested, fire extinguisher, emergency numbers posted, medication storage, working phone within reach of the floor, entrance lighting and house number visible. Store the checklist items in a config file so the programme can edit them without code changes.
4. **Report** — plain-language PDF for member and family (if allowed): what's fine, what to fix, why it matters. No scores that sound like grades.
5. **Fixes** — each concern becomes a fix item routed to: a volunteer handyman (existing `home_service` sub-types: `minor_repairs`, `safety_assessment`), a paid provider (`service_providers`), or a partner referral via G6.0 (Rebuilding Together Peninsula for low-income homeowners; CID for grab bars/ramps). Track each fix to done.
6. **Follow-up** — Grace reminder call 30 days later ("Were the grab bars installed?"); annual re-check item in Important Dates.

**Tables:** `home_safety_checks` (member_id, requested_by, trigger, mode `in_person|virtual`, assessor_volunteer_id, assessor_family_member_id, scheduled_at, completed_at, status, report_pdf_path) · `home_safety_items` (check_id, room, item_key, result, note, photo_path) · `home_safety_fixes` (check_id, item_id, route `volunteer|provider|partner|member`, service_booking_id, partner_referral_id, status, completed_at).

**Privacy:** photos stored in a private bucket; family sees the report only when `family_can_see_service_history`; volunteers see only the checks assigned to them.

**Org admins:** villages can run the programme for their members from `/org-admin` (list of checks, fixes outstanding, volunteer hours) — this is the Helpful Village parity piece.

```
PHASE G6.1 CHECKLIST
[ ] Fall mention in a real test call → home-safety suggestion card + navigator task (no automatic booking)
[ ] Volunteer without the training module cannot claim a check
[ ] Completed checklist → PDF report generated; family sees it only when allowed
[ ] "Grab bars needed" → fix item; route to CID partner creates partner_referral with consent
[ ] $49 virtual assessment purchasable in Stripe test mode → navigator task
[ ] 30-day Grace follow-up scheduled; annual re-check item created
[ ] Org admin sees their members' checks and open fixes only
```

---

## PHASE G6.2 — Home Sharing (referral partner model)

**What:** ThriveAtHome does **not** match housemates itself — screening, background checks and agreements stay with experienced local programmes. ThriveAtHome identifies interest, explains options, makes a warm referral with consent, and supports the member through it. First partner: **HIP Housing** (San Mateo County).

**Member paths:**
- **"I have a spare room"** (home provider) — may want rent income, help around the house, or company.
- **"I need an affordable place to live"** (home seeker) — including seniors facing housing insecurity (links from G5.5 pathway).
- Both explain the two common arrangements plainly: **rent exchange** (reduced rent) and **service exchange** (light chores, cooking or errands instead of some rent — not personal or medical care).

**Flow:** `/dashboard/home-sharing` (and a member-portal card) → short interest form (role, county, timing, what they hope for, any worries) → the platform finds active `home_sharing` partners serving the member's county → consent screen → referral created (G6.0) → navigator task "Warm handoff to HIP Housing" (navigator calls the partner or helps the member call) → check-ins at 14 days and 60 days.
- No partner in the member's county → show "We don't have a home-sharing partner in your area yet" + save interest to `home_sharing_interest` for demand tracking; admin dashboard shows demand by county.
- **Safety content** on the page: the partner screens both sides; never pay deposits or share bank details before meeting through the programme; a family member or navigator can join meetings; the navigator is there if anything feels wrong. Aria/Rosa scam detection (G3.4) also watches for rent-scam patterns ("wire the deposit", "can't meet in person").
- **Family:** family can start the interest form for the member, but the member must give consent themselves (portal, or navigator records verbal consent with date and time).
- **Aria/Rosa:** "home sharing" or "renting out a room" intent → Rosa creates the interest record and navigator task.

**Tables:** `home_sharing_interest` (member_id, role `provider|seeker`, county, timeline, hopes text, concerns text, status, partner_referral_id).

```
PHASE G6.2 CHECKLIST
[ ] San Mateo member → sees HIP Housing (once activated); consent → referral + navigator task + check-ins at 14 and 60 days
[ ] Santa Clara member with no partner → "not in your area yet" + interest saved for demand report
[ ] Family-started request stays pending until member consent recorded
[ ] Rosa test call "I want to rent out my spare room" → interest record + task
[ ] Page includes the safety guidance; no partner details shown for inactive partners
```

---

## PHASE G6.3 — Encore Careers: purpose, volunteering and paid work

**What:** A career-transition hub for members who want meaningful roles — volunteer leadership, part-time paid work, paid community service training (SCSEP), or starting something of their own. It builds on the existing skill exchange profile and retired-professionals volunteer track.

**Partners to identify and contact (human confirms each before activation):**

| Partner | What they offer | Status |
|---|---|---|
| Felton Institute — SCSEP (San Mateo & Marin) | Federally funded paid part-time community service training for low-income adults 55+ | Listed by California Dept. of Aging as the San Mateo County SCSEP provider — confirm contact |
| NOVAworks Job Center (San Mateo) | Public workforce board job centre: job search, training, career coaching | Location confirmed; confirm services for older workers |
| San Mateo County Libraries | Free job and career resources, computer help | Confirm programmes |
| AARP Foundation (Back to Work 50+ and SCSEP nationally) | Job search support for 50+ | National — confirm current programme names |
| AmeriCorps Seniors (RSVP, Senior Companion, Foster Grandparent) | Volunteer service with stipends in some programmes | Find local sponsors |
| CoGenerate (formerly Encore.org) | Encore fellowships, intergenerational roles | Confirm current programmes |
| ThriveAtHome itself | Paid roles: buddy lead, navigator assistant (`/careers/navigator` exists), cultural circle facilitator, peer grief facilitator | Internal |
| Employer partners (M18) and corporate volunteer programmes | Age-friendly part-time roles | From existing employer accounts |

**Build:**
- **Career profile** (opt-in, member portal tab "Purpose & Work"): past roles, skills (reuse skill exchange skills), what they're looking for (`volunteer_leadership | part_time_paid | scsep | mentoring | start_something`), hours/week, remote/in-person, travel radius (G4.3), accommodations needed.
- **Opportunities board:** table `opportunities` (title, org, partner_id, type `volunteer|paid_part_time|scsep|fellowship|internal`, description, location, remote, hours_per_week, pay_range, age_friendly_attested boolean, apply_method `internal|partner_referral|external_link`, status, expires_on). Admin, org admins and employer admins can post (moderated: admin approval before publishing). Filter by type, distance, remote.
- **Matching:** suggest opportunities from the career profile; weekly digest (email/text per preference) of new matches.
- **Apply:** internal roles → application stored and sent to the posting admin; partner programmes → G6.0 referral with consent; external links → open in new tab, record interest.
- **Support:** "Talk to someone about work" → navigator task (or partner referral to NOVAworks). Resume help as a volunteer service sub-type `resume_help` under `tech_help` or a new `career` category in `SERVICE_TYPES`.
- **Safety:** job-scam guard — postings require approval; members warned never to pay to apply or share SSN/bank details before a verified offer; G3.4 detector scans messages about jobs ("pay for training kit", "reship packages").
- **Income note:** a plain-language reminder that earnings can affect some benefits (SSI, Medi-Cal) with a link to benefits counselling — no individual advice.

```
PHASE G6.3 CHECKLIST
[ ] Member builds a career profile → matching opportunities shown by type and distance
[ ] Employer admin posts a role → hidden until platform admin approves
[ ] Apply to SCSEP → partner referral with consent (partner active only after human confirmation)
[ ] Apply to internal role → application visible to posting admin only
[ ] Posting with "pay for your training kit" flagged by fraud detector and blocked from publishing
[ ] Weekly match digest sent to TEST_EMAIL for a test member
```

---

## PHASE G6.4 — Member-in-Need Campaigns (community giving)

**What:** Any member (or their family, or a navigator on their behalf) can ask for help with a specific need — e.g. a hearing aid, a ramp, a month of groceries after a hospital stay — and an admin helps set up a campaign the community can give to.

**Read this first — legal and payments (human must review before launch):**
- Gifts that benefit a specific individual are generally **not tax-deductible** as charitable contributions, even when routed through a charity, and ThriveAtHome is a PBC, not a 501(c)(3). Campaign pages must never promise a tax deduction. Only a partner 501(c)(3) can issue receipts, and only under its own rules.
- **Stripe:** crowdfunding-style fundraising has restrictions on Stripe's Prohibited and Restricted Businesses list. Before building payments, the human confirms with Stripe (or counsel) whether ThriveAtHome may operate member campaigns directly, or must route funds through a partner charity's account via Stripe Connect.
- Default design below is the conservative one: **funds go to a partner organisation (a village or charity) or directly to a vendor for the need — not as cash to the member.** This protects members from exploitation and from benefit-eligibility problems (cash gifts can affect SSI/Medi-Cal).

**Build:**
- **Request** (`/dashboard/campaigns/new`, also from navigator console): need category (health equipment, home repair/safety, food, utilities, transport, technology, other), what it costs, how it will be paid (vendor/invoice), story in the member's own words (optional), photo (optional), privacy level (`first_name_only | anonymous | full_name`), audience (`my_org | my_circles | platform`).
- **Admin review (required):** navigator or org admin verifies the need and cost (quote/invoice upload), checks it against existing free help first (benefits finder, G6.1 partners, Meals on Wheels), sets goal, deadline (max 60 days), recipient of funds (`partner_org` with its Stripe Connect account, or `vendor_payment` held by the org), and publishes. Two-person approval for goals over $1,000.
- **Campaign page:** story, progress bar, goal, days left, organiser org, "how funds are used", no tax-deduction claim unless the recipient org is a verified 501(c)(3) and the admin ticks that box. Donors can give anonymously and leave a short message (moderated). Visible only to the chosen audience; `platform` audience pages require login.
- **Giving:** Stripe Checkout (test mode) with funds to the recipient organisation's Connect account; ThriveAtHome takes **no fee** by default (configurable). Reuse the `donations` table with new columns `campaign_id`, `donor_message`, `is_anonymous`.
- **Closing:** at goal or deadline → admin records how funds were spent (receipt upload), campaign shows "Fulfilled" update; excess funds rule shown up-front (goes to the org's general fund for members in need). Donors get a thank-you and the fulfilled update.
- **Safeguards:** one active campaign per member; members can pause/close their own campaign anytime; the member (not family) must approve the story and privacy level; G3.4 fraud detector scans stories and messages; any donor asking to contact the member directly is refused; admins see a campaign audit trail.

**Tables:** `member_campaigns` (member_id, created_by, org_id, category, title, story, privacy_level, audience, goal_cents, raised_cents, deadline, status `draft|pending_review|live|paused|fulfilled|closed`, recipient_type, recipient_org_id, approved_by, second_approver, fulfilled_note, receipt_path) · `campaign_updates` (campaign_id, body, created_by, created_at).

```
PHASE G6.4 CHECKLIST
[ ] Member drafts a campaign → not visible until an admin approves
[ ] $1,500 goal needs two different approvers
[ ] Page never shows tax-deduction wording unless recipient org is marked verified 501(c)(3)
[ ] Donation in Stripe test mode goes to the recipient org's test Connect account; raised_cents updates via webhook
[ ] Anonymous donor name hidden on page and from member
[ ] Story containing "send me gift cards" flagged by fraud detector and blocked from publishing
[ ] Member closes campaign → donations stop; donors notified
[ ] Family cannot publish without member approval of story and privacy level
```

## Human review (G6 exit gate)

Confirm the six seeded partners by phone/website and activate them in `/admin/community-partners`. Walk a test member through a home safety check, a HIP Housing referral, an SCSEP referral and a small test campaign in Stripe test mode. Get the campaign legal/payments question answered (Stripe + counsel) before enabling G6.4 for real members.
