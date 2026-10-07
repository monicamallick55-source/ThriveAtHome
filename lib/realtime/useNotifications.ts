'use client'
// React hook that subscribes to realtime_notifications for a given member.
// Shows a toast on new notifications and tracks the unread count.
import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast, type ToastSeverity } from '@/components/ui/Toast'
import type { Tables } from '@/types/database'
type NotifSeverity = any
type NotifType = any

export interface NotificationRow {
  id: string
  created_at: string
  member_id: string
  type: NotifType
  title: string
  body: string
  severity: NotifSeverity
  call_id: string | null
  alert_id: string | null
  read: boolean
  read_at: string | null
}

export function useNotifications(memberId: string | null) {
  const [notifications, setNotifications] = useState<NotificationRow[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()
  const { push } = useToast()
  // Track channel ref to safely remove on unmount
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  // Fetch initial unread notifications once memberId is known
  useEffect(() => {
    if (!memberId) return
    async function fetchInitial() {
      const { data } = await supabase
        .from('realtime_notifications')
        .select('*')
        .eq('member_id', memberId!)
        .order('created_at', { ascending: false })
        .limit(50)
      if (data) {
        setNotifications(data as NotificationRow[])
        setUnreadCount(data.filter((n: any) => !n.read).length)
      }
    }
    fetchInitial()
  }, [memberId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Subscribe to realtime INSERT events for this member
  useEffect(() => {
    if (!memberId) return

    const channel = supabase
      .channel(`notifications:${memberId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'realtime_notifications',
          filter: `member_id=eq.${memberId}`,
        },
        (payload) => {
          const newNotif = payload.new as NotificationRow
          setNotifications((prev) => [newNotif, ...prev])
          setUnreadCount((prev) => prev + 1)
          // NotifSeverity values match ToastSeverity directly
          push({
            title: newNotif.title,
            body: newNotif.body,
            severity: newNotif.severity as ToastSeverity,
          })
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [memberId]) // eslint-disable-line react-hooks/exhaustive-deps

  const markRead = useCallback(
    async (notificationId: string) => {
      const { error } = await supabase
        .from('realtime_notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)
      if (error) {
        console.error('[useNotifications] markRead failed:', error)
        return
      }
      setNotifications((prev) =>
        prev.map((n: any) =>
          n.id === notificationId ? { ...n, read: true, read_at: new Date().toISOString() } : n
        )
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    },
    [supabase]
  )

  const markAllRead = useCallback(async () => {
    if (!memberId) return
    const { error } = await supabase
      .from('realtime_notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('member_id', memberId)
      .eq('read', false)
    if (error) {
      console.error('[useNotifications] markAllRead failed:', error)
      return
    }
    setNotifications((prev) =>
      prev.map((n: any) => ({ ...n, read: true, read_at: n.read_at ?? new Date().toISOString() }))
    )
    setUnreadCount(0)
  }, [memberId, supabase])

  return { notifications, unreadCount, markRead, markAllRead }
}
