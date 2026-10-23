'use client'
import { useState } from 'react'
import { DashNav } from './DashNav'

interface DashNavClientProps {
  seniorName: string
  unreadMessages: number
}

export function DashNavClient({ seniorName, unreadMessages }: DashNavClientProps) {
  const [unreadCount, setUnreadCount] = useState(0)

  function handleMarkAllRead() {
    setUnreadCount(0)
    fetch('/api/notifications/mark-read', { method: 'POST' }).catch(() => null)
  }

  return (
    <DashNav
      seniorName={seniorName}
      unreadCount={unreadCount}
      onMarkAllRead={handleMarkAllRead}
      unreadMessages={unreadMessages}
    />
  )
}
