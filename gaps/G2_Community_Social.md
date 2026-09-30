# GAP BUILD SPEC G2 — Communities Social Layer

> Gap Build series (G1–G4), written 2026-09-30 from a code audit of commit `abdc412`.
> Same loop as prompt.md. Build after G1.
> Supersedes the SQL in Master Spec §6.6 — that SQL used `auth.uid() = member_id`, which is wrong for this schema (members are reached through `members.supabase_auth_id` or `family_members`).

## Already done — do not rebuild

- Post author names: `getCirclePosts` joins `members(preferred_name, full_name)`; `CircleDetailClient` renders `member_name` (§6.6 Bug 1 — fixed).
- Member directory: `/dashboard/directory` + `/api/directory` with `directory_opt_in` (§6.6 Gap 4 — fixed at org level; G2.4 adds the per-circle tab).

## Missing (confirmed by search — no table, route or component)

Comments · reporting · member-proposed events · Phase 41a event fields · friend connections · private messaging.

---

## PHASE G2.0 — Shared RLS helper

**Migration `supabase/migrations/086_community_social.sql` (first block):**

```sql
-- Every member id the current auth user may act for: the senior themself (direct login) or linked family.
CREATE OR REPLACE FUNCTION acting_member_ids()
RETURNS uuid[] LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT COALESCE(ARRAY_AGG(DISTINCT id), '{}') FROM (
    SELECT id FROM members WHERE supabase_auth_id = auth.uid()
    UNION
    SELECT member_id FROM family_members WHERE supabase_auth_id = auth.uid() AND member_id IS NOT NULL
  ) s;
$$;

CREATE OR REPLACE FUNCTION is_staff()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM family_members
                 WHERE supabase_auth_id = auth.uid() AND role IN ('admin','navigator'));
$$;
```

All G2 policies use these two functions.

---

## PHASE G2.1 — Comments on posts (P0)

**SQL (086, continued):**

```sql
CREATE TABLE IF NOT EXISTS circle_post_comments (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  post_id    uuid NOT NULL REFERENCES circle_posts(id) ON DELETE CASCADE,
  member_id  uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  content    text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
  is_hidden  boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_cpc_post ON circle_post_comments(post_id, created_at);
ALTER TABLE circle_post_comments ENABLE ROW LEVEL SECURITY;

-- Read: members of the post's circle, and staff
CREATE POLICY "cpc_read" ON circle_post_comments FOR SELECT USING (
  is_staff() OR EXISTS (
    SELECT 1 FROM circle_posts p JOIN circle_memberships cm ON cm.circle_id = p.circle_id
    WHERE p.id = circle_post_comments.post_id AND cm.member_id = ANY(acting_member_ids())
  )
);
-- Write: only as yourself, only in a circle you belong to
CREATE POLICY "cpc_insert" ON circle_post_comments FOR INSERT WITH CHECK (
  member_id = ANY(acting_member_ids()) AND EXISTS (
    SELECT 1 FROM circle_posts p JOIN circle_memberships cm ON cm.circle_id = p.circle_id
    WHERE p.id = post_id AND cm.member_id = circle_post_comments.member_id
  )
);
CREATE POLICY "cpc_delete_own_or_staff" ON circle_post_comments FOR DELETE USING (
  is_staff() OR member_id = ANY(acting_member_ids())
);
CREATE POLICY "cpc_staff_hide" ON circle_post_comments FOR UPDATE USING (is_staff());

ALTER TABLE circle_posts ADD COLUMN IF NOT EXISTS comment_count int NOT NULL DEFAULT 0;
ALTER TABLE circle_posts ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION bump_comment_count() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN UPDATE circle_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSE UPDATE circle_posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id; END IF;
  RETURN NULL;
END $$;
CREATE TRIGGER trg_comment_count AFTER INSERT OR DELETE ON circle_post_comments
  FOR EACH ROW EXECUTE FUNCTION bump_comment_count();
```

**Data layer — `lib/data/circles.ts`:** add `getPostComments(postId)` (joins `members(preferred_name, full_name)`, excludes `is_hidden`, oldest first, returns `{data, error}`), `addPostComment(memberId, postId, content)`, `deletePostComment(commentId)`. Filter `is_hidden = false` in `getCirclePosts` too.

**API — `app/api/circles/posts/[postId]/comments/route.ts`:** `GET` (list), `POST` (create; resolve member with `resolveMemberContext`; 403 if not in circle). `DELETE /api/circles/comments/[commentId]`.

**Notifications:** new comment → Realtime notification to the post author ("Margaret replied to your post"), not to the commenter themself.

**UI — `components/circles/CircleDetailClient.tsx`:**
- Under each post: "💬 N comments" button (min 48px touch target, 18px+ text). Collapsed by default.
- Expanded: comments oldest-first with name + date, then a textarea (max 1000, live count) and "Reply" button.
- Own comments show "Delete" (confirm dialog).
- Optimistic append; roll back with a friendly error on failure.
- Name fallback "A member" when both names are null.

**Checklist:**
```
PHASE G2.1 CHECKLIST
[ ] Member A comments on Member B's post → B sees it after refresh; count shows 1
[ ] B receives Realtime "replied to your post" notification within 2s
[ ] Member not in circle → POST returns 403; direct SQL insert blocked by RLS
[ ] Delete own comment → count back to 0; cannot delete another member's comment
[ ] 1001-character comment rejected with readable message
[ ] Senior logged in directly (members.supabase_auth_id) can comment — not only family
[ ] axe-cli on circle page → zero wcag2aa violations
[ ] npx tsc --noEmit passes
```

---

## PHASE G2.2 — Report & moderation

**SQL (086, continued):**

```sql
CREATE TABLE IF NOT EXISTS community_reports (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   timestamptz DEFAULT now() NOT NULL,
  post_id      uuid REFERENCES circle_posts(id) ON DELETE CASCADE,
  comment_id   uuid REFERENCES circle_post_comments(id) ON DELETE CASCADE,
  reported_by  uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  reason       text NOT NULL CHECK (reason IN ('unkind','spam','scam_or_fraud','private_info','worried_about_member','other')),
  details      text CHECK (char_length(details) <= 500),
  status       text NOT NULL DEFAULT 'open' CHECK (status IN ('open','dismissed','content_hidden')),
  resolved_by  uuid REFERENCES family_members(id),
  resolved_at  timestamptz,
  CHECK (num_nonnulls(post_id, comment_id) = 1),
  UNIQUE (reported_by, post_id, comment_id)
);
ALTER TABLE community_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports_insert_self" ON community_reports FOR INSERT WITH CHECK (reported_by = ANY(acting_member_ids()));
CREATE POLICY "reports_staff_all"   ON community_reports FOR ALL USING (is_staff());
```

**API:** `POST /api/circles/report` `{postId | commentId, reason, details}` → insert report + `navigator_tasks` row (`task_type='community_report'`, priority `high` for `scam_or_fraud` and `worried_about_member`, else `medium`; `member_id` = the **author** of the reported content). `PATCH /api/navigator/community-reports/[id]` `{action: 'dismiss' | 'hide'}` → hide sets `is_hidden=true` on the post/comment, resolves the report and completes the task.

`worried_about_member` reason → also creates a navigator task for the author's wellbeing (reuse the buddy concern-flag wording). `scam_or_fraud` → also inserts into `fraud_flags` once G3.4 exists.

**UI:** "⋯" menu on each post/comment → "Report" → modal with reasons as large radio buttons in plain words ("This seems unkind", "This looks like a scam", "I'm worried about this person"…). Confirmation: "Thank you. A care team member will look at this." Navigator console: new "Community reports" filter in the unified action feed showing the content inline with Dismiss / Hide buttons.

**Checklist:**
```
PHASE G2.2 CHECKLIST
[ ] Report a post → community_reports row + navigator task, reporter sees confirmation
[ ] Reporting the same post twice → friendly "You've already reported this"
[ ] Navigator hides → post disappears for members, still visible to staff
[ ] "I'm worried about this person" → extra wellbeing task on the author
[ ] Non-staff cannot read community_reports (RLS)
[ ] npx tsc --noEmit passes
```

---

## PHASE G2.3 — Member-proposed events + Phase 41a

**SQL (086, continued):**

```sql
ALTER TABLE circle_events
  ADD COLUMN IF NOT EXISTS status            text NOT NULL DEFAULT 'approved'
                                             CHECK (status IN ('proposed','approved','rejected','cancelled')),
  ADD COLUMN IF NOT EXISTS proposed_by       uuid REFERENCES members(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS review_note       text,
  ADD COLUMN IF NOT EXISTS reviewed_by       uuid REFERENCES family_members(id),
  ADD COLUMN IF NOT EXISTS website_link      text,
  ADD COLUMN IF NOT EXISTS external_rsvp_url text,
  ADD COLUMN IF NOT EXISTS location_text     text;

-- circle_id is already nullable (migration 012): NULL = "All Communities"

DROP POLICY IF EXISTS "anyone_can_read_circle_events" ON circle_events;
CREATE POLICY "read_approved_or_own_or_staff" ON circle_events FOR SELECT USING (
  status = 'approved' OR is_staff() OR proposed_by = ANY(acting_member_ids())
);
CREATE POLICY "members_propose_in_own_circle" ON circle_events FOR INSERT WITH CHECK (
  status = 'proposed' AND proposed_by = ANY(acting_member_ids()) AND circle_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM circle_memberships cm WHERE cm.circle_id = circle_events.circle_id AND cm.member_id = proposed_by)
);

DROP POLICY IF EXISTS "family_can_manage_own_rsvps" ON circle_event_rsvps;
CREATE POLICY "rsvps_read_authenticated" ON circle_event_rsvps FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "rsvps_manage_own" ON circle_event_rsvps FOR ALL
  USING (member_id = ANY(acting_member_ids())) WITH CHECK (member_id = ANY(acting_member_ids()));
```

(Existing admin policy `admin_can_manage_circle_events` stays.)

**API:**
- `POST /api/circles/events/propose` — members; fields: circleId, title, description, date, time, format (`phone|video|in_person`), dial-in number/code, video link, location_text, recurring. Inserts `status='proposed'` + navigator task `task_type='event_proposal'`.
- `PATCH /api/admin/circles/events/[id]/review` — staff; `{decision:'approve'|'reject', note}`. Approve → `status='approved'` → Realtime notification to all circle members ("New event: …") and to the proposer. Reject → proposer notified with the note.
- `GET /api/circles/events?circle_id=` — returns approved events for that circle **plus** `circle_id IS NULL` events, upcoming only, with `attendees: {count, names: first 3 preferred_names}` from RSVPs. Dial-in/video fields returned **only** if the requester has RSVP'd or is staff.
- Existing `POST /api/admin/circles/events` — accept `website_link`, `external_rsvp_url`, and "All Communities" (circle_id null).

**UI:**
- `components/circles/CircleEvents.tsx` — expandable cards: format badge, "All Communities" badge, avatar stack + "Margaret, Robert and 3 others are going", RSVP button (internal toggle, or "RSVP on their website ↗" when `external_rsvp_url`), dial-in shown after RSVP, website link. Mount in `/dashboard/communities/[circleId]` (and the `cultural-circles` redirect target).
- "Propose an event" button on the circle page → form (same large-field style as onboarding), success: "Thanks! A coordinator will review your event, usually within 2 days."
- `/admin/events/create`: add circle selector with "All Communities", website link, external RSVP URL.
- `/admin/communities` + navigator feed: "Event proposals" list with Approve / Reject + note.

**Checklist:**
```
PHASE G2.3 CHECKLIST
[ ] Member proposes event → not visible to other members; proposer sees "Awaiting review"
[ ] Navigator approves → visible to circle; members notified
[ ] Reject with note → proposer sees the note
[ ] Admin creates an "All Communities" event → visible in every circle
[ ] Circle-specific event not visible in a different circle
[ ] Dial-in number hidden until RSVP
[ ] Social proof shows first names of attendees
[ ] external_rsvp_url event shows external link instead of internal RSVP
[ ] npx tsc --noEmit passes
```

---

## PHASE G2.4 — Circle members tab

Reuse `/api/directory` rules: `GET /api/circles/[circleId]/members` returns circle members with `directory_opt_in = true` (preferred_name, city, directory_bio, joined date). Requester must be in the circle. Add a "Members (N)" tab on the circle page; link the member count on circle cards to it. No phone, email or address ever returned.

```
PHASE G2.4 CHECKLIST
[ ] Opted-out member does not appear
[ ] Non-circle member gets 403
[ ] Response JSON contains no phone/email/address fields
```

---

## PHASE G2.5 — Friend connections + private messages (Layer 2)

**SQL (`supabase/migrations/087_member_connections.sql`):**

```sql
CREATE TABLE IF NOT EXISTS member_connections (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   timestamptz DEFAULT now() NOT NULL,
  requester_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','blocked')),
  intro_note   text CHECK (char_length(intro_note) <= 300),
  responded_at timestamptz,
  CHECK (requester_id <> recipient_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_member_pair ON member_connections
  (LEAST(requester_id, recipient_id), GREATEST(requester_id, recipient_id));
ALTER TABLE member_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mc_parties" ON member_connections FOR ALL USING (
  requester_id = ANY(acting_member_ids()) OR recipient_id = ANY(acting_member_ids()) OR is_staff()
);

CREATE TABLE IF NOT EXISTS private_messages (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at    timestamptz DEFAULT now() NOT NULL,
  connection_id uuid NOT NULL REFERENCES member_connections(id) ON DELETE CASCADE,
  sender_id     uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  content       text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  read_at       timestamptz,
  flagged       boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_pm_conn ON private_messages(connection_id, created_at);
ALTER TABLE private_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pm_parties" ON private_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM member_connections c WHERE c.id = connection_id
          AND (c.requester_id = ANY(acting_member_ids()) OR c.recipient_id = ANY(acting_member_ids())))
);
CREATE POLICY "pm_send_accepted_only" ON private_messages FOR INSERT WITH CHECK (
  sender_id = ANY(acting_member_ids()) AND EXISTS (
    SELECT 1 FROM member_connections c WHERE c.id = connection_id AND c.status = 'accepted'
    AND sender_id IN (c.requester_id, c.recipient_id))
);
ALTER PUBLICATION supabase_realtime ADD TABLE private_messages;
```

**Safety rules (senior-specific — required, not optional):**
- Connection requests only between members who **share a circle or an org**. API rejects others.
- Max 10 pending outgoing requests per member.
- Every message runs `scanForFraudPatterns` (G3.4) before insert: gift cards, wire transfers, crypto, "send money", bank/SSN/Medicare numbers, off-platform phone numbers in the first 5 messages. Match → message still delivered but `flagged=true`, plus a navigator task and fraud flag on the **recipient**. Money requests show the recipient a gentle banner: "ThriveAtHome members never need to ask each other for money. If this feels off, tap 'Get help'."
- Block = `status='blocked'`, hides the thread for both; the blocker can report.
- Family visibility: follow `members.family_can_see_service_history`-style setting — add `family_can_see_connections boolean DEFAULT true`. Family sees **who** the connections are, never message content.
- Grief/crisis phrases in messages → run `scanForCrisisPhrase`; match → navigator task (do not block the message).

**API:** `POST /api/connections` (request) · `PATCH /api/connections/[id]` (accept / decline / block) · `GET /api/connections` · `GET/POST /api/connections/[id]/messages` · `POST /api/connections/[id]/read`.

**UI:** "Add friend" on circle member cards → optional intro note. New `/dashboard/friends` page: Requests · Friends · a conversation view (large bubbles, 18px text, "Send" button, no typing-speed pressure). Unread count on the nav. Realtime delivery.

**Checklist:**
```
PHASE G2.5 CHECKLIST
[ ] A requests B (same circle) → B sees request; accept → both see each other in Friends
[ ] Request to a member with no shared circle/org → 403
[ ] Message before acceptance → blocked by RLS
[ ] Message arrives in real time (<2s)
[ ] "Can you buy me some gift cards" → delivered, flagged, navigator task + banner shown to recipient
[ ] Block hides thread for both
[ ] Family dashboard shows friend names, never message text
[ ] Unrelated member cannot read the thread (RLS test script)
[ ] npx tsc --noEmit passes
```

---

## PHASE G2.6 — Facilitated introductions (Layer 3)

Navigator-initiated warm introductions:
- Navigator console → member detail → "Suggest an introduction": pick a second member (search limited to same chapter/circle/org) + a note ("You both grew up in Ohio and love bridge").
- Creates `member_connections` row with `status='pending'`, new column `introduced_by uuid REFERENCES family_members(id)`, and notifies **both** members: "Your care coordinator thinks you and Robert would get along." Either can accept; connection becomes `accepted` only when **both** accept (add `requester_accepted boolean`, `recipient_accepted boolean`).
- Optional: add the introduction to the buddy's next pre-call brief.

```
PHASE G2.6 CHECKLIST
[ ] Navigator introduces A and B → both notified with the note
[ ] One accepts → still pending; both accept → accepted, messaging enabled
[ ] Intro shows on each member's family dashboard (names only)
```

## Human review (G2 exit gate)

Log in as two seniors in the same circle on two browsers: post, comment, reply, report, propose an event, get it approved as navigator, RSVP, send a friend request, exchange messages, send a "gift card" message and confirm the navigator sees the flag.
