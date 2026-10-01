# G1 Live Test Script — Voice Call Pipeline

Run this **after** you merge the `gaps/g1` and `gaps/g1-transfer` pull requests and Vercel shows the deploy as **Ready**.
Site: https://thrive-at-home-pied.vercel.app

**Phone setup.** There are only two Twilio numbers:
- **Quinn's number (inbound).** Every inbound call is answered by Quinn, who uses Retell Agent Transfer to hand the call to Rosa, Hope, Claire, Sam, Morgan, Alex or Jordan. The call keeps one `call_id` and only Quinn's webhook fires. The app works out who else was on the call from the transcript and saves it in `agents_involved`.
- **Aria's number (outbound).** Used by Aria, Joy and Grace.
- Nova can't be reached from the public number.

Everything you create is labelled `[TEST]`. The cleanup SQL is at the end.
Real calls go **only to your own mobile**. Never commit your number; paste it into the SQL in the Supabase editor only.

Report results as `L1 PASS`, `L4 FAIL: <what you saw>`, and so on. I'll fix any failures on a new branch.

---

## Before you start (5 minutes)

**P1. Vercel env vars** (Project → Settings → Environment Variables → Production). Check that each is set:
- `RETELL_API_KEY`
- all 12 agent IDs: `RETELL_AGENT_ID` (Aria) and `RETELL_ROSA_AGENT_ID`, `RETELL_JOY_AGENT_ID`, `RETELL_GRACE_AGENT_ID`, `RETELL_HOPE_AGENT_ID`, `RETELL_CLAIRE_AGENT_ID`, `RETELL_SAM_AGENT_ID`, `RETELL_MORGAN_AGENT_ID`, `RETELL_NOVA_AGENT_ID`, `RETELL_ALEX_AGENT_ID`, `RETELL_QUINN_AGENT_ID`, `RETELL_JORDAN_AGENT_ID`
- `TWILIO_ACCOUNT_SID`, which **must start with `AC`**. The copy pulled into the Codespace didn't, and Twilio rejected it.
- `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` (Aria's outbound number), `CRON_SECRET`
- The agent IDs are still all needed: transfers are recognised by matching each agent's ID or name.
- `ANTHROPIC_API_KEY`. **The Anthropic account needs credit.** In the Codespace every request came back "credit balance is too low", which means every call summary would be empty. Check console.anthropic.com → Billing.
- `RETELL_WEBHOOK_SECRET` is optional. If it is set, it is used for signature checks instead of `RETELL_API_KEY` (see L3).
- **`CARE_TEAM_PHONE` (new, required)**: the on-call mobile that receives urgent crisis texts, in E.164 format (e.g. `+14155550100`). Use your own mobile for this test. If it is missing, crisis texts are skipped and an error is logged, but the navigator task and alert are still created.

**P1b. Run migration 088 first** (Supabase → SQL Editor): paste `supabase/migrations/088_agent_transfers.sql`.
⚠️ Do this **before** deploying `gaps/g1-transfer`. Until it runs, every call save fails on the missing `agents_involved` column.

**P2. Retell dashboard.**
- Phone numbers: Quinn's number → inbound agent **Quinn**. Aria's number → outbound agent **Aria** (Joy and Grace call from it too).
- **Quinn's Agent Transfer tools:** name each one after its destination, e.g. `transfer_to_rosa`, `transfer_to_hope`, `transfer_to_claire`. A name containing "transfer", "swap" or "handoff" plus the agent's name is how the app tells which agent took the call. In a conversation-flow agent, give the transfer node a name like "Transfer to Rosa".
- Webhook: Quinn's webhook must point at the URL below. Leave the transfer's webhook setting at the default, **only source agent**. Otherwise one call produces two webhooks.
- For **every** agent: Webhook URL = `https://thrive-at-home-pied.vercel.app/api/webhooks/retell`
- Custom function URLs, only on the agents that use them (including the ones Quinn transfers to):

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

**L4. Quinn → Rosa from your phone** (human review #1)
Call **Quinn's number** from your mobile. When Quinn answers, say **"I need help arranging a ride."** Quinn should hand you to Rosa. Tell Rosa "I'm doing fine today, just testing," chat briefly, then hang up. Within about a minute, run:
```sql
SELECT agent_name, agents_involved, direction, caller_role, from_number, status, duration_seconds,
       ai_summary, mood_score, processed_at
FROM check_in_calls WHERE member_id = '<TEST_ID>' ORDER BY created_at DESC LIMIT 1;
```
Expect:
- `agent_name = rosa`, `agents_involved = {quinn,rosa}`, `direction = inbound`, `caller_role = member`, `status = completed`
- an `ai_summary` sentence, a `mood_score` from 1 to 10, and `processed_at` filled in
- If `agents_involved = {quinn}`, the transfer wasn't recognised. Send me Quinn's transfer tool name and the call's `transcript_with_tool_calls` (Retell → Call History → the call → raw JSON).

**L5. Unknown caller.** Call **Quinn's number** from a phone that isn't in the system (a friend's, or a second line), and ask for a ride so you're transferred to Rosa:
```sql
SELECT agent_name, agents_involved, caller_role, from_number, ai_summary, needs_followup
FROM inbound_call_log ORDER BY created_at DESC LIMIT 1;
```
Expect: `caller_role = unknown`, `agents_involved = {quinn,rosa}`, with a summary.

**L6. Hope always escalates, even through Quinn.** Call **Quinn's number** from your mobile and say **"I'd like the support line."** Quinn should hand you to Hope. Have a calm conversation with no crisis words:
```sql
SELECT priority, description FROM navigator_tasks
WHERE member_id = '<TEST_ID>' AND description LIKE 'Hope crisis-line call%';
SELECT agent_name, agents_involved FROM check_in_calls WHERE member_id = '<TEST_ID>' ORDER BY created_at DESC LIMIT 1;
```
Expect: 1 task row with `priority = critical`. The call has `agent_name = hope` and `agents_involved = {quinn,hope}`.

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
WHERE member_id = '<TEST_ID>' AND metadata->>'source' = 'voice_call' ORDER BY created_at DESC LIMIT 1;
```
Expect: `alert_type = fall`, with `metadata` like `{"source":"voice_call","concern_type":"fall",...}`. Before migration 087 this insert failed silently.

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

**L13. Tools on an inbound call through Quinn.** Inbound calls carry no `member_id`, so every tool now finds the caller from their phone number. Call **Quinn's number** from your mobile, say "I need help arranging a ride" to reach Rosa, then ask, one at a time:
- **"Can someone call me back tomorrow morning?"** (`request_callback`)
- **"I'd rate my mood about a 4 out of 10 today."** (`log_mood_score`)
- **"Please let my navigator know my landlord hasn't fixed the heating."** (`create_navigator_alert`)
- **"I had a fall in the kitchen yesterday."** (`flag_welfare_concern`)
- **"Can you book me a ride to the clinic next Tuesday?"** (`create_service_request`)

Which tools fire depends on how Rosa is configured. Report any that Rosa doesn't call. Then run:
```sql
SELECT 'callback' AS kind, notes AS detail FROM callback_requests WHERE member_id = '<TEST_ID>'
UNION ALL SELECT 'mood', mood_score::text FROM check_in_calls WHERE member_id = '<TEST_ID>' AND mood_score IS NOT NULL
UNION ALL SELECT 'task:' || task_type, description FROM navigator_tasks WHERE member_id = '<TEST_ID>' AND task_type IN ('navigator_alert','service_request')
UNION ALL SELECT 'alert:' || alert_type, message FROM alerts WHERE member_id = '<TEST_ID>' AND metadata->>'source' = 'voice_call'
UNION ALL SELECT 'booking', service_type FROM service_bookings WHERE member_id = '<TEST_ID>';
```
Expect one row per tool that fired. The `mood` row should be `4`: the score you gave wins over the AI estimate. In Vercel logs, no tool request should get a `400` response.

**L14. Tools for a caller who isn't a member.** From the second phone in L5, call **Quinn's number**, get transferred, and say **"Can someone call me back? I'm asking about volunteering."**
```sql
SELECT task_type, caller_role, caller_phone, description FROM navigator_tasks
WHERE caller_phone = '<second phone, E.164>' ORDER BY created_at DESC;
```
Expect: a `callback_request` task with `caller_role = unknown`, your second number, and your message. If the agent tries `log_mood_score` or `update_call_preferences`, it should answer politely rather than error.

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
DELETE FROM callback_requests      WHERE member_id IN (SELECT id FROM members WHERE full_name LIKE '[TEST] G1%');
DELETE FROM service_bookings       WHERE member_id IN (SELECT id FROM members WHERE full_name LIKE '[TEST] G1%');
DELETE FROM check_in_calls         WHERE member_id IN (SELECT id FROM members WHERE full_name LIKE '[TEST] G1%');
DELETE FROM navigator_tasks        WHERE caller_phone = '<phone you used in L5/L14, E.164>';
DELETE FROM inbound_call_log       WHERE from_number = '<phone you used in L5, E.164>';
-- If you re-linked a family login in L12, restore its member_id before the next line.
DELETE FROM members                WHERE full_name LIKE '[TEST] G1%';
```
