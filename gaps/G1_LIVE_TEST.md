# G1 Live Test Script — Voice Call Pipeline

Run this **after** you merge the `gaps/g1` pull request and Vercel shows the deploy as **Ready**.
Site: https://thrive-at-home-pied.vercel.app

Everything you create is labelled `[TEST]`. The cleanup SQL is at the end.
Real calls go **only to your own mobile**. Never commit your number; paste it into the SQL in the Supabase editor only.

Report results as `L1 PASS`, `L4 FAIL: <what you saw>`, and so on. I'll fix any failures on a new branch.

---

## Before you start (5 minutes)

**P1. Vercel env vars** (Project → Settings → Environment Variables → Production). Check that each is set:
- `RETELL_API_KEY`
- all 12 agent IDs: `RETELL_AGENT_ID` (Aria) and `RETELL_ROSA_AGENT_ID`, `RETELL_JOY_AGENT_ID`, `RETELL_GRACE_AGENT_ID`, `RETELL_HOPE_AGENT_ID`, `RETELL_CLAIRE_AGENT_ID`, `RETELL_SAM_AGENT_ID`, `RETELL_MORGAN_AGENT_ID`, `RETELL_NOVA_AGENT_ID`, `RETELL_ALEX_AGENT_ID`, `RETELL_QUINN_AGENT_ID`, `RETELL_JORDAN_AGENT_ID`
- `TWILIO_ACCOUNT_SID`, which **must start with `AC`**. The copy pulled into the Codespace didn't, and Twilio rejected it.
- `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `CRON_SECRET`
- `ANTHROPIC_API_KEY`. **The Anthropic account needs credit.** In the Codespace every request came back "credit balance is too low", which means every call summary would be empty. Check console.anthropic.com → Billing.
- `RETELL_WEBHOOK_SECRET` is optional. If it is set, it is used for signature checks instead of `RETELL_API_KEY` (see L3).
- **`CARE_TEAM_PHONE` (new, required)**: the on-call mobile that receives urgent crisis texts, in E.164 format (e.g. `+14155550100`). Use your own mobile for this test. If it is missing, crisis texts are skipped and an error is logged, but the navigator task and alert are still created.

**P2. Retell dashboard.** For **every** agent:
- Webhook URL = `https://thrive-at-home-pied.vercel.app/api/webhooks/retell`
- Custom function URLs, only on the agents that use them:

| Function | URL |
|---|---|
| `create_service_request` | `https://thrive-at-home-pied.vercel.app/api/retell/tools/service-request` |
| `flag_welfare_concern` | `…/api/retell/tools/welfare-check` |
| `request_callback` | `…/api/retell/tools/request-callback` |
| `log_mood_score` | `…/api/retell/tools/log-mood-score` |
| `create_navigator_alert` | `…/api/retell/tools/navigator-alert` |
| `update_call_preferences` | `…/api/retell/tools/update-call-preferences` |

**P3. Create your `[TEST]` member** (Supabase → SQL Editor). Replace `+1XXXXXXXXXX` with your mobile in E.164 format:

```sql
INSERT INTO members (full_name, preferred_name, date_of_birth, phone_number, plan_tier,
                     aria_call_opted_in, checkin_preference, onboarding_call_completed,
                     call_frequency_preference, family_can_see_call_summaries)
VALUES ('[TEST] G1 Live', 'Tester', '1945-06-01', '+1XXXXXXXXXX', 'basics',
        true, 'aria', true, 'daily', true)
RETURNING id;
```

Keep the returned `id`. It is `<TEST_ID>` below.

---

## Tests

**L1. Webhook is live**
```bash
curl https://thrive-at-home-pied.vercel.app/api/webhooks/retell
```
Expect: `{"status":"ThriveAtHome Retell webhook active"}`

**L2. Unsigned requests are rejected**
```bash
curl -i -X POST https://thrive-at-home-pied.vercel.app/api/webhooks/retell \
  -H 'Content-Type: application/json' -d '{"event":"call_ended","call":{"call_id":"[TEST]-unsigned"}}'
curl -i -X POST https://thrive-at-home-pied.vercel.app/api/retell/tools/welfare-check \
  -H 'Content-Type: application/json' -d '{"args":{}}'
```
Expect: `HTTP/2 401` for both.

**L3. Real Retell signature is accepted.** Do this during L4.
After L4's call, open Vercel → Logs and filter on `Retell Webhook`.
- **PASS:** you see `Event: call_ended` and **no** `Rejected request with missing/invalid signature`.
- **FAIL:** you see the rejection line. That means Retell signs with the other key:
  - If `RETELL_WEBHOOK_SECRET` is set, delete it. If it isn't set, add it (copy the webhook secret from Retell).
  - Redeploy and repeat L4.
- Tell me which key worked so I can record it.

**L4. Inbound Rosa call from your phone** (human review #1)
Call **Rosa's number** from your mobile. Say "Hi, I'm doing fine today, just testing," chat briefly, then hang up. Within about a minute, run:
```sql
SELECT agent_name, direction, caller_role, from_number, status, duration_seconds,
       ai_summary, mood_score, processed_at
FROM check_in_calls WHERE member_id = '<TEST_ID>' ORDER BY created_at DESC LIMIT 1;
```
Expect:
- `agent_name = rosa`, `direction = inbound`, `caller_role = member`, `status = completed`
- an `ai_summary` sentence, a `mood_score` from 1 to 10, and `processed_at` filled in

**L5. Unknown caller.** Call Rosa from a phone that isn't in the system (a friend's, or a second line):
```sql
SELECT agent_name, caller_role, from_number, ai_summary, needs_followup
FROM inbound_call_log ORDER BY created_at DESC LIMIT 1;
```
Expect: `caller_role = unknown`, with a summary.

**L6. Hope always escalates.** Call **Hope's number** from your mobile and have a calm conversation with no crisis words:
```sql
SELECT priority, description FROM navigator_tasks
WHERE member_id = '<TEST_ID>' AND description LIKE 'Hope crisis-line call%';
```
Expect: 1 row, `priority = critical`.

**L7. Crisis phrase on an Aria call** (human review #2)
Aria calls you through the aria-calls cron.

⚠️ **The cron calls every real member who is due**, exactly as the daily 13:00 UTC run does. Either:
- **Option A:** wait for the scheduled 13:00 UTC run, or
- **Option B:** run it now. This only brings forward today's normal calls:
```bash
curl -H "Authorization: Bearer <CRON_SECRET>" https://thrive-at-home-pied.vercel.app/api/cron/aria-calls
```
On the call, say: **"I don't want to be here anymore."** Then tell Aria it's a test and hang up. Check:
```sql
SELECT 'task' AS kind, priority::text, description FROM navigator_tasks WHERE member_id = '<TEST_ID>' AND task_type = 'crisis'
UNION ALL SELECT 'alert', severity::text, message FROM alerts WHERE member_id = '<TEST_ID>' AND alert_type = 'crisis'
UNION ALL SELECT 'emergency_log', alert_type::text, triggered_phrase FROM emergency_log WHERE member_id = '<TEST_ID>';
```
Expect:
- a **critical task**, a **crisis alert** and an **emergency_log** row
- the call row saved with `agent_name = aria`
- **a text on the `CARE_TEAM_PHONE` mobile** within a minute, starting `🚨 URGENT — CRISIS ALERT for member …`
- if the `[TEST]` member has an assigned navigator with a phone, that navigator gets the same text. To test this, assign one:
  ```sql
  INSERT INTO navigator_assignments (member_id, navigator_id, is_primary)
  SELECT '<TEST_ID>', id, true FROM care_navigators WHERE email = '<a navigator whose phone is your 2nd number>';
  ```
- Vercel logs: no `CARE_TEAM_PHONE is not set` line

**L8. Tool call during a live call.** On any Aria call, say **"Please call me every day."**
```sql
SELECT call_frequency_preference FROM members WHERE id = '<TEST_ID>';
```
Expect: `daily`. Also check Vercel logs for a `200` on `/api/retell/tools/update-call-preferences` or a `Tool call: update_call_preferences` line.

**L8b. Welfare concern during a call saves an alert.** On any Aria call, say **"I had a fall in the kitchen yesterday."** Aria should use the `flag_welfare_concern` tool.
```sql
SELECT alert_type, severity, message, metadata FROM alerts
WHERE member_id = '<TEST_ID>' AND metadata->>'source' = 'aria_call' ORDER BY created_at DESC LIMIT 1;
```
Expect: `alert_type = fall`, with `metadata` like `{"source":"aria_call","concern_type":"fall",...}`. Before migration 087 this insert failed silently.

**L9. Launch Protocol: Aria off means no call** (human review #3)
```sql
INSERT INTO members (full_name, preferred_name, date_of_birth, phone_number, aria_call_opted_in)
VALUES ('[TEST] G1 No Aria', 'NoAria', '1945-06-01', '+1XXXXXXXXXX', false) RETURNING id;
```
Use your mobile again. After the next aria-calls run (Option A or B in L7):
- no call arrives on your phone for this member
- this query returns 1 row, `high`, due 24h after the member was created:
```sql
SELECT task_type, priority, due_by, description FROM navigator_tasks
WHERE member_id = '<NO_ARIA_ID>' AND task_type = 'welcome_call';
```

**L10. Joy birthday call**
```sql
INSERT INTO celebration_events (member_id, celebration_type, event_date, status)
VALUES ('<TEST_ID>', 'birthday', CURRENT_DATE, 'today');
```
```bash
curl -H "Authorization: Bearer <CRON_SECRET>" https://thrive-at-home-pied.vercel.app/api/cron/celebrations
```
Expect:
- Joy calls your phone.
- The response JSON has `"joy": {"called": 1, ...}` or more. Real members with a birthday today who were already called at 08:00 are not called twice.

**L11. Grace reminder call**
```sql
INSERT INTO tracked_items (member_id, item_type, category, item_name,
                           expiration_or_appointment_date, status, call_reminder)
VALUES ('<TEST_ID>', 'doctor_appointment', 'appointment', '[TEST] Dr Patel check-up',
        CURRENT_DATE + 1, 'active', true);
```
```bash
curl -H "Authorization: Bearer <CRON_SECRET>" https://thrive-at-home-pied.vercel.app/api/cron/tracked-item-reminders
```
Expect:
- Grace calls you about "[TEST] Dr Patel check-up" tomorrow.
- The response JSON has `"grace": {"called": 1, ...}`.

**L12. Family sees the summary, never the transcript**
Log in as a family account linked to `<TEST_ID>`. To link your own family login:
```sql
UPDATE family_members SET member_id = '<TEST_ID>' WHERE email = '<your family login email>';
```
Note its old `member_id` first if you want to restore it.
- Open `/dashboard/calls` and open DevTools → Network.
- Expect: the call summaries are visible, and searching the Network responses for `transcript` finds nothing.

---

## Cleanup (run after reporting results)

```sql
DELETE FROM navigator_assignments  WHERE member_id IN (SELECT id FROM members WHERE full_name LIKE '[TEST] G1%');
DELETE FROM navigator_tasks        WHERE member_id IN (SELECT id FROM members WHERE full_name LIKE '[TEST] G1%');
DELETE FROM alerts                 WHERE member_id IN (SELECT id FROM members WHERE full_name LIKE '[TEST] G1%');
DELETE FROM emergency_log          WHERE member_id IN (SELECT id FROM members WHERE full_name LIKE '[TEST] G1%');
DELETE FROM realtime_notifications WHERE member_id IN (SELECT id FROM members WHERE full_name LIKE '[TEST] G1%');
DELETE FROM celebration_events     WHERE member_id IN (SELECT id FROM members WHERE full_name LIKE '[TEST] G1%');
DELETE FROM tracked_items          WHERE member_id IN (SELECT id FROM members WHERE full_name LIKE '[TEST] G1%');
DELETE FROM check_in_calls         WHERE member_id IN (SELECT id FROM members WHERE full_name LIKE '[TEST] G1%');
DELETE FROM inbound_call_log       WHERE from_number = '<phone you used in L5, E.164>';
-- If you re-linked a family login in L12, restore its member_id before the next line.
DELETE FROM members                WHERE full_name LIKE '[TEST] G1%';
```
