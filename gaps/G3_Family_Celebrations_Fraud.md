# GAP BUILD SPEC G3 — Family Celebrations, Gifts & Fraud Protection

> Gap Build series (G1–G4), written 2026-09-30 from a code audit of commit `abdc412`.
> Same loop as prompt.md. Build after G1 (Aria/Joy mentions depend on the working call pipeline). G3.4 (fraud) can run in parallel with G2.
> Covers spec Phases 50b, 50c, 50d, 50g — none of which exist in code (no tables, routes or UI found).

## What already exists and must be reused

- `celebration_events` table + `app/api/cron/celebrations` (birthday D-7 / D-0) and `cron/milestones`.
- `AiProvider.generateCelebrationPersonalisation(member, type)`.
- Stripe one-time Checkout pattern in `app/api/life-story/memory-book/payment/route.ts`.
- Navigator "Flag potential fraud / scam concern" dispatch button in `components/navigator/MemberDetailPanel.tsx` (UI only, no table).
- Joy outbound agent (wired in G1.6).

---

## Shared: one-time payments in the Stripe webhook

`app/api/webhooks/stripe/route.ts` → `checkout.session.completed` currently assumes a subscription (reads `session.subscription`). Add a branch **first**:

```ts
const purpose = session.metadata?.purpose   // 'celebration' | 'gift' | 'card' | 'memory_book' | undefined
if (purpose && session.mode === 'payment') {
  await handleOneTimePayment(purpose, session)   // lib/stripe/oneTime.ts
  break
}
```

`handleOneTimePayment` sets the matching row's `payment_status='paid'`, `stripe_payment_intent_id`, and fires that feature's "paid" side effects. Idempotent on `stripe_payment_intent_id`. Move the memory book's existing payment handling into this function too.

---

## PHASE G3.1 — Family Events Calendar (50d)

**Migration `supabase/migrations/088_family_celebrations.sql`:**

```sql
CREATE TABLE IF NOT EXISTS family_events (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       timestamptz DEFAULT now() NOT NULL,
  member_id        uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,   -- the senior
  created_by       uuid REFERENCES family_members(id) ON DELETE SET NULL,
  person_name      text NOT NULL,                  -- "Sophie (granddaughter)"
  relationship     text,
  event_type       text NOT NULL CHECK (event_type IN
                   ('birthday','anniversary','graduation','new_baby','wedding','travel','party','holiday','other')),
  title            text NOT NULL,
  event_date       date NOT NULL,
  end_date         date,                           -- travel
  recurs_yearly    boolean NOT NULL DEFAULT false,
  notes            text,
  aria_can_mention boolean NOT NULL DEFAULT true,
  mailing_address  text                            -- for cards/gifts; family-entered, never shown to other members
);
CREATE INDEX IF NOT EXISTS idx_family_events_member_date ON family_events(member_id, event_date);
ALTER TABLE family_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fe_own" ON family_events FOR ALL
  USING (member_id = ANY(acting_member_ids()) OR is_staff())
  WITH CHECK (member_id = ANY(acting_member_ids()) OR is_staff());
```

(`acting_member_ids()` / `is_staff()` come from G2.0; if G2 isn't built yet, create them here.)

**Behaviour:**
- `/dashboard/celebrations` → new "Family calendar" tab: month view + list, "Add a family date" form (large fields, preset event types with icons). Member portal gets the same, read + add.
- New cron step inside `app/api/cron/celebrations/route.ts`: for events 7 days out and day-of (yearly recurrence handled by comparing month/day), write the upcoming events into the member's next Aria call context — add `upcoming_family_events` to `CallContext` and to Retell `retell_llm_dynamic_variables` (e.g. "Sophie's graduation is Saturday"). Only when `aria_can_mention`.
- Travel events: between `event_date` and `end_date` pass `family_travel` so Aria can say "I hope David's trip to Portland is going well."
- Day-of: Realtime notification to the senior's dashboard with **Send a card** / **Send a gift** / **Send a note** buttons.
- New-baby event → notification to family: "Grandma may want to send a gift — here's how."

**Checklist:**
```
PHASE G3.1 CHECKLIST
[ ] Family adds granddaughter's birthday → appears on senior's calendar and family calendar
[ ] Senior logged in directly can see and add dates
[ ] Yearly event shows next year's date correctly
[ ] 7 days before → next Aria call context includes the event (verify stub log dynamic vars)
[ ] aria_can_mention=false → not included
[ ] Day-of notification shows the three send buttons
[ ] Another family's member cannot read these rows (RLS)
[ ] npx tsc --noEmit passes
```

---

## PHASE G3.2 — Senior-to-family cards, notes & gifts (50b)

**SQL (088, continued):**

```sql
CREATE TABLE IF NOT EXISTS gift_orders (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at          timestamptz DEFAULT now() NOT NULL,
  member_id           uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  direction           text NOT NULL CHECK (direction IN ('from_member','to_member')),
  ordered_by_family   uuid REFERENCES family_members(id),        -- set when family orders to or on behalf of the senior
  family_event_id     uuid REFERENCES family_events(id) ON DELETE SET NULL,
  kind                text NOT NULL CHECK (kind IN ('note','card','flowers','food','book','gift_card','basket')),
  recipient_name      text NOT NULL,
  recipient_address   text,                                      -- required for physical kinds
  recipient_email     text,                                      -- note / e-gift card
  message             text CHECK (char_length(message) <= 1000),
  sign_as             text,                                      -- "Love, Grandma Rose"
  catalog_item_id     text,
  subtotal_cents      int NOT NULL DEFAULT 0,
  platform_fee_cents  int NOT NULL DEFAULT 0,                    -- 15% on goods; cards are flat $4.99
  total_cents         int NOT NULL DEFAULT 0,
  payment_status      text NOT NULL DEFAULT 'not_required'
                      CHECK (payment_status IN ('not_required','pending','paid','refunded','failed')),
  stripe_payment_intent_id text UNIQUE,
  fulfillment_status  text NOT NULL DEFAULT 'draft'
                      CHECK (fulfillment_status IN ('draft','awaiting_approval','ordered','shipped','delivered','cancelled')),
  fulfillment_partner text,                                      -- 'stub','1800flowers','goldbelly','amazon_gc','lob'
  partner_order_id    text,
  tracking_url        text,
  needs_family_approval boolean NOT NULL DEFAULT false
);
ALTER TABLE gift_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "go_own" ON gift_orders FOR ALL
  USING (member_id = ANY(acting_member_ids()) OR is_staff())
  WITH CHECK (member_id = ANY(acting_member_ids()) OR is_staff());
```

**Catalog:** `lib/gifts/catalog.ts` — static list (id, kind, title, image, price_cents, partner). Start with ~12 items across the six categories. Cards: $4.99 flat, printed + mailed. Notes: free (email or shareable link/PDF).

**Provider:** add `GoodsProvider.placeOrder(order)` to the existing `goodsProvider` interface (stub already exists per providers.ts list). Stub logs `[STUB][Goods] …` and returns a fake order id; real partners slot in later (1-800-Flowers, Goldbelly, Amazon gift cards, Lob for printed cards).

**Safety (required):**
- Any `from_member` order over **$75**, or a gift card of any amount to a recipient not in `family_events`/family_members → `needs_family_approval=true`, status `awaiting_approval`. The primary family contact approves from the dashboard. (Gift cards to strangers are the #1 elder-scam payout method.)
- Every `from_member` gift-card order is also checked by `scanForFraudPatterns` context (G3.4) — e.g. recent call transcript mentioned "IRS", "grandson in jail".

**Flow:** choose → personalise (message, sign-as; AI "Help me write it" using `generateCelebrationPersonalisation`) → address → Stripe Checkout (`metadata.purpose='gift'`, `gift_order_id`) → paid → `goodsProvider.placeOrder` → `ordered`. Family dashboard shows "Rose sent Sophie flowers 🌷 — delivered Tue" (delivery tracking card).

**Aria gift intent:** in G1.4 post-call processing, if the summary/transcript shows gift intent ("I should send Sophie something"), create a Realtime notification to family: "Rose mentioned wanting to send Sophie a gift." Use a simple keyword pass first (`send (her|him|them)? ?(a )?(gift|card|flowers)`), refine with the AI provider later.

**Checklist:**
```
PHASE G3.2 CHECKLIST
[ ] Free note → recipient email receives it (stub log) + PDF/link available
[ ] $4.99 card → Stripe test checkout → paid → goods stub order logged
[ ] Flowers $60 → 15% platform fee recorded; total correct
[ ] $120 basket from senior → awaiting_approval; family approves → ordered
[ ] Gift card to unknown recipient → awaiting_approval regardless of amount
[ ] Stripe webhook replay → no duplicate order (idempotent)
[ ] Family dashboard shows the gift with status
[ ] npx tsc --noEmit passes
```

---

## PHASE G3.3 — Family-initiated celebrations (50c)

**SQL (088, continued):**

```sql
CREATE TABLE IF NOT EXISTS celebration_requests (
  id                 uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at         timestamptz DEFAULT now() NOT NULL,
  member_id          uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  requested_by       uuid NOT NULL REFERENCES family_members(id),
  occasion           text NOT NULL CHECK (occasion IN ('birthday','anniversary','homecoming','recovery_milestone','holiday','other')),
  occasion_date      date NOT NULL,
  tier               text NOT NULL CHECK (tier IN ('digital','enhanced','premier')),   -- free / $25 / $75
  price_cents        int NOT NULL,
  payment_status     text NOT NULL DEFAULT 'not_required',
  stripe_payment_intent_id text UNIQUE,
  notes_for_team     text,
  status             text NOT NULL DEFAULT 'requested'
                     CHECK (status IN ('requested','planning','scheduled','completed','cancelled')),
  navigator_task_id  uuid REFERENCES navigator_tasks(id),
  celebration_event_id uuid REFERENCES celebration_events(id)
);
CREATE TABLE IF NOT EXISTS celebration_messages (             -- the family coordination room
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  timestamptz DEFAULT now() NOT NULL,
  request_id  uuid NOT NULL REFERENCES celebration_requests(id) ON DELETE CASCADE,
  author_id   uuid NOT NULL REFERENCES family_members(id),
  content     text NOT NULL CHECK (char_length(content) <= 2000),
  is_card_message boolean NOT NULL DEFAULT false               -- included in the digital family card
);
ALTER TABLE celebration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE celebration_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cr_family" ON celebration_requests FOR ALL USING (
  is_staff() OR EXISTS (SELECT 1 FROM family_members fm WHERE fm.supabase_auth_id = auth.uid() AND fm.member_id = celebration_requests.member_id));
CREATE POLICY "cm_family" ON celebration_messages FOR ALL USING (
  is_staff() OR EXISTS (SELECT 1 FROM celebration_requests r JOIN family_members fm ON fm.member_id = r.member_id
                        WHERE r.id = request_id AND fm.supabase_auth_id = auth.uid()));
```

Note: family-only room — the senior does **not** see it (it's a surprise). The senior sees the resulting celebration.

**Tiers:**

| Tier | Price | What happens |
|---|---|---|
| Digital | Free | Joy (or Aria if Joy unset) places a personalised call on the day using life-story entries; digital family card compiled from `is_card_message` messages, shown on the senior's dashboard + printable PDF |
| Enhanced | $25 | Digital + volunteer visit (creates a `services` booking of type friendly_visit for that date) + gift coordination (links a `gift_orders` draft) |
| Premier | $75 | Enhanced + navigator-scheduled family video gathering (video link on the celebration) + physical memory book (reuses memory-book generator; order created at $0 since included) |

**Flow:** `/dashboard/celebrations` → "Plan a celebration" → occasion, date, tier cards → pay (enhanced/premier via Stripe `purpose='celebration'`) → on paid/free: create `celebration_events` row, navigator task (`task_type='celebration_coordination'`, due 5 days before; digital tier: no task), invite all linked family (Realtime + email) into the coordination room at `/dashboard/celebrations/[requestId]`.

Grief guard: if the occasion date is within 30 days of a recorded loss anniversary (`grief_support_requests`), show family a gentle warning and route to navigator review.

**Checklist:**
```
PHASE G3.3 CHECKLIST
[ ] Digital request → celebration_events row; Joy call scheduled for the date (stub log)
[ ] Family members post card messages → card PDF compiles them
[ ] Senior cannot see the coordination room (RLS)
[ ] Enhanced → $25 checkout → volunteer visit booking + navigator task
[ ] Premier → $75 → video link field + memory book order at $0
[ ] Date near loss anniversary → warning + navigator review
[ ] npx tsc --noEmit passes
```

---

## PHASE G3.4 — Fraud & scam protection (50g)

**SQL (`supabase/migrations/089_fraud_flags.sql`):**

```sql
CREATE TABLE IF NOT EXISTS fraud_flags (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at    timestamptz DEFAULT now() NOT NULL,
  member_id     uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  source        text NOT NULL CHECK (source IN ('call_transcript','private_message','community_post','gift_order','navigator','family','buddy')),
  source_id     uuid,
  scam_type     text NOT NULL CHECK (scam_type IN
                ('gift_card','government_impersonation','grandparent','romance','tech_support','lottery_prize',
                 'investment_crypto','charity','large_purchase','other')),
  matched_text  text,               -- short excerpt only (<= 200 chars), never the full transcript
  severity      text NOT NULL DEFAULT 'concern' CHECK (severity IN ('concern','urgent')),
  status        text NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewing','confirmed','false_positive','resolved')),
  family_notified_at timestamptz,
  resolved_by   uuid REFERENCES family_members(id),
  resolution_note text
);
CREATE INDEX IF NOT EXISTS idx_fraud_member ON fraud_flags(member_id, created_at DESC);
ALTER TABLE fraud_flags ENABLE ROW LEVEL SECURITY;
-- Family CAN see fraud flags (protective, per spec §2.2) — unlike grief data
CREATE POLICY "ff_family_read" ON fraud_flags FOR SELECT USING (member_id = ANY(acting_member_ids()) OR is_staff());
CREATE POLICY "ff_staff_write" ON fraud_flags FOR ALL USING (is_staff());
CREATE POLICY "ff_family_report" ON fraud_flags FOR INSERT WITH CHECK (
  source = 'family' AND member_id = ANY(acting_member_ids()));
```

Note: `ff_family_read` also lets a directly-logged-in senior see their own flags — show them in plain, non-alarming language ("We noticed something that looked like a common scam. Your care team is checking in.").

**Detector — `lib/fraud/detect.ts`:** `scanForFraudPatterns(text): {scamType, severity, excerpt}[]`. Pattern groups (case-insensitive, word boundaries), each with ≥ 6 phrases, e.g.:
- gift_card: "gift card(s)", "google play card", "itunes card", "read me the numbers on the back"
- government_impersonation: "IRS", "social security (is|has been) suspended", "warrant for your arrest", "medicare (is|will be) cancelled"
- grandparent: "in jail", "bail money", "don't tell mom/dad", "I'm in trouble grandma/grandpa"
- tech_support: "virus on your computer", "remote access", "Microsoft/Apple support called"
- lottery_prize: "you've won", "processing fee", "claim your prize"
- romance: "send money", "plane ticket", "can't video call", combined with "love"
- investment_crypto: "bitcoin", "crypto ATM", "guaranteed return"
Severity `urgent` when a payment method (gift card / wire / crypto / cash courier) **and** urgency ("today", "right now", "before") both appear.

False-positive guard: skip when the member is talking *about* scams ("a scam call", "I hung up on"). Unit test both directions.

**Hook points:**
1. G1.4 `processCallEnded` → scan member speech → insert flags (source `call_transcript`).
2. G2.5 private messages and G2.1 comments/posts → scan before insert.
3. G3.2 gift-card orders → `large_purchase`/`gift_card` flag when approval required.
4. Navigator "Flag potential fraud" button in `MemberDetailPanel` → `POST /api/navigator/fraud-flags` (source `navigator`). Wire the existing button — it currently saves nothing.
5. Family "Report a scam concern" button on the family dashboard → source `family`.

**On any new flag:** navigator task (`task_type='fraud_review'`, priority `critical` for urgent, else `high`) · Realtime alert to family (if `family_can_see_alerts`) "Possible scam contact — the care team is on it" · for `urgent`, also SMS/email to primary family contact via providers. Aria's next call context gets `recent_scam_concern=true` so she can gently say "If anyone asks you for gift cards, it's always OK to hang up and call us."

**UI:** navigator feed "Fraud" filter with excerpt, member, type, and actions (Call member · Mark false positive · Confirm & resolve with note). Family dashboard: "Scam protection" card with open/closed flags and the scam education link.

**Checklist:**
```
PHASE G3.4 CHECKLIST
[ ] scripts/test-fraud-detect.ts: 20 scam sentences → all flagged with correct type; 10 benign ("I got a scam call and hung up") → none
[ ] Test call transcript with "buy Google Play cards today" → urgent gift_card flag, critical task, family alert
[ ] Navigator fraud button now creates a fraud_flags row
[ ] Family "Report a scam concern" creates a flag + task
[ ] Family sees flags; grief records still hidden from family (regression check)
[ ] matched_text never exceeds 200 characters
[ ] npx tsc --noEmit passes
```

## Human review (G3 exit gate)

As family: add a granddaughter's birthday, plan an Enhanced celebration, post a card message. As senior: send her a $4.99 card and try a $100 gift card. As navigator: approve the celebration task, see the gift-card flag and resolve it.
