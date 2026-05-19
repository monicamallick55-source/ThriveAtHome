'use client'
// Realtime test client — temporary, deleted after Phase 9 verification.
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ToastProvider } from '@/components/ui/Toast'
import { NotificationBell } from '@/components/ui/NotificationBell'
import { useNotifications } from '@/lib/realtime/useNotifications'

function RealtimePanel() {
  const supabase = createClient()
  const [memberId, setMemberId] = useState<string | null>(null)
  const [authId, setAuthId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showList, setShowList] = useState(false)

  const { notifications, unreadCount, markRead, markAllRead } = useNotifications(memberId)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('Not logged in — visit /login first'); setLoading(false); return }
      setAuthId(user.id)
      const { data } = await supabase
        .from('family_members')
        .select('member_id')
        .eq('supabase_auth_id', user.id)
        .maybeSingle()
      if (!data?.member_id) { setError('No member linked to this account — complete onboarding first'); setLoading(false); return }
      setMemberId(data.member_id)
      setLoading(false)
    }
    init()
  }, [supabase])

  if (loading) return <p className="text-gray-500 text-lg">Loading…</p>
  if (error) return <p className="text-red-600 text-lg">{error}</p>

  return (
    <div className="max-w-lg w-full space-y-6">
      <div className="bg-white rounded-2xl shadow p-6 space-y-3">
        <h2 className="text-xl font-semibold text-[#1B3A6B]">Connection info</h2>
        <p className="text-sm text-gray-600">Auth ID: <code className="bg-gray-100 px-1 rounded">{authId}</code></p>
        <p className="text-sm text-gray-600">Member ID: <code className="bg-gray-100 px-1 rounded">{memberId}</code></p>
        <p className="text-green-700 font-medium">✅ Realtime channel active — waiting for notifications</p>
      </div>

      <div className="bg-white rounded-2xl shadow p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[#1B3A6B]">Notification Bell</h2>
          <NotificationBell count={unreadCount} onClick={() => setShowList(v => !v)} />
        </div>
        <p className="text-gray-600">Unread count: <strong>{unreadCount}</strong></p>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-sm text-[#2A9D8F] underline hover:no-underline"
          >
            Mark all read
          </button>
        )}
      </div>

      {showList && (
        <div className="bg-white rounded-2xl shadow p-6 space-y-3">
          <h2 className="text-xl font-semibold text-[#1B3A6B]">Notifications ({notifications.length})</h2>
          {notifications.length === 0 && <p className="text-gray-500">No notifications yet.</p>}
          {notifications.map((n) => (
            <div key={n.id} className={`p-3 rounded-lg border ${n.read ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-[#1B3A6B]">{n.title}</p>
                  <p className="text-gray-600 text-sm">{n.body}</p>
                  <p className="text-gray-400 text-xs mt-1">{n.severity} · {new Date(n.created_at).toLocaleTimeString()}</p>
                </div>
                {!n.read && (
                  <button
                    onClick={() => markRead(n.id)}
                    className="text-xs text-[#2A9D8F] underline whitespace-nowrap"
                  >
                    Mark read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6 space-y-2">
        <h2 className="text-lg font-semibold text-amber-800">How to test</h2>
        <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
          <li>Open Supabase → SQL Editor</li>
          <li>Run the INSERT below (replace member_id with the value shown above)</li>
          <li>Watch for a toast to appear within 2 seconds — bell count increments</li>
          <li>Click bell → list → Mark read → count decrements</li>
        </ol>
        <pre className="bg-white rounded-lg p-3 text-xs text-gray-800 overflow-x-auto mt-2">{`INSERT INTO realtime_notifications
  (member_id, type, title, body, severity)
VALUES
  ('${memberId}', 'system_message',
   'Test Notification', 'Realtime is working!', 'info');`}</pre>
      </div>
    </div>
  )
}

export default function RealtimeTestClient() {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-start pt-16 px-4 space-y-4">
        <h1 className="text-3xl font-bold text-[#1B3A6B]">Phase 9 — Realtime Test</h1>
        <p className="text-gray-500">Temporary test page — will be deleted after approval.</p>
        <RealtimePanel />
      </div>
    </ToastProvider>
  )
}
