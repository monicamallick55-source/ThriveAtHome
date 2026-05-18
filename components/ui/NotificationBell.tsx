'use client'

export interface NotificationBellProps {
  count: number
  onClick?: () => void
  label?: string
}

export function NotificationBell({ count, onClick, label = 'Notifications' }: NotificationBellProps) {
  const hasUnread = count > 0

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={hasUnread ? `${label}: ${count} unread` : `${label}: no unread`}
      className="relative inline-flex items-center justify-center w-12 h-12 min-h-[52px] rounded-full hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3A6B] focus-visible:ring-offset-2 transition-colors"
    >
      <svg
        aria-hidden="true"
        className={`w-6 h-6 ${hasUnread ? 'text-[#1B3A6B]' : 'text-gray-400'}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      {hasUnread && (
        <span
          aria-hidden="true"
          className="absolute top-1 right-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-xs font-bold"
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  )
}
