# Joy Birthday Call Patch

Add this block inside the D-0 birthday section of `app/api/cron/celebrations/route.ts`,
after the community post is created:

```typescript
  // Joy call on birthday (opted-in members only, skip if in active grief)
  if (member.aria_call_opted_in) {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    const { count: griefCount } = await supabase
      .from('grief_support_requests')
      .select('id', { count: 'exact', head: true })
      .eq('member_id', member.id)
      .eq('status', 'active')
      .gte('created_at', ninetyDaysAgo)
    if (griefCount && griefCount > 0) {
      console.log(`[Cron/celebrations] skipping Joy call for ${member.id} — active grief support`)
    } else {
      const joyAgentId = process.env.RETELL_JOY_AGENT_ID
      if (joyAgentId && member.phone_number) {
        await fetch('https://api.retellai.com/v2/create-phone-call', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${process.env.RETELL_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from_number: process.env.TWILIO_PHONE_NUMBER,
            to_number: member.phone_number,
            agent_id: joyAgentId,
            metadata: { member_id: member.id, call_type: 'celebration', celebration_type: 'birthday' },
          }),
        }).catch(err => console.error('[Joy] call failed:', err))
      }
    }
  }
```
