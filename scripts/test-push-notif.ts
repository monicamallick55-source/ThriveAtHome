// Test script: verifies pushRealtimeNotification does not throw on failure.
// Per Phase 9 checklist: call with non-existent member_id — must log, not throw.
import { pushRealtimeNotification } from '../lib/realtime/notifications'

async function main() {
  console.log('Testing pushRealtimeNotification with non-existent member_id...')
  let threw = false
  try {
    await pushRealtimeNotification({
      type: 'system_message',
      memberId: '00000000-0000-0000-0000-000000000000',
      title: 'Test',
      body: 'Test body',
      severity: 'info',
    })
  } catch {
    threw = true
    console.error('❌ pushRealtimeNotification THREW — this is a bug')
  }
  if (!threw) {
    console.log('✅ pushRealtimeNotification did not throw (error was logged only) — PASSED')
  } else {
    process.exit(1)
  }
}

main()
