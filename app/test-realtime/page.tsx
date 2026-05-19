// Temporary test page for Phase 9 Realtime verification — DELETE after approval.
// Visit /test-realtime while logged in, then insert a row via Supabase SQL Editor.
import { Metadata } from 'next'
import RealtimeTestClient from './RealtimeTestClient'

export const metadata: Metadata = { title: 'Realtime Test — ThriveAtHome' }

export default function RealtimeTestPage() {
  return <RealtimeTestClient />
}
