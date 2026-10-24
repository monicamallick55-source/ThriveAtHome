'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

interface DashNavProps {
  seniorName: string
  unreadCount?: number
  onMarkAllRead?: () => void
  unreadMessages?: number
}

const NAV_LINKS = [
  { href: '/dashboard', label: 'Home', icon: '🏠' },
  { href: '/dashboard/history', label: 'History', icon: '📋' },
  { href: '/dashboard/communities', label: 'Community', icon: '👥' },
  { href: '/dashboard/messages', label: 'Messages', icon: '✉️' },
  { href: '/dashboard/documents', label: 'Docs', icon: '📄' },
]

const DESKTOP_LINKS = [
  { href: '/dashboard', label: 'Home' },
  { href: '/dashboard/history', label: 'History' },
  { href: '/dashboard/communities', label: 'Community' },
  { href: '/dashboard/family', label: 'Family' },
  { href: '/dashboard/messages', label: 'Messages' },
  { href: '/dashboard/buddy', label: 'Buddy' },
  { href: '/dashboard/documents', label: 'Documents' },
  { href: '/dashboard/settings', label: 'Settings' },
]

export function DashNav({ seniorName, unreadCount = 0, onMarkAllRead, unreadMessages = 0 }: DashNavProps) {
  const pathname = usePathname()
  const [showNotifs, setShowNotifs] = useState(false)

  return (
    <>
      {/* Desktop top nav */}
      <nav style={{
        display: 'none',
        position: 'sticky', top: 0, zIndex: 100,
        backgroundColor: 'white', borderBottom: '1px solid #E8E4DC',
        padding: '0 24px',
      }} className="desk-nav">
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '32px', height: '60px' }}>
          <Link href="/dashboard" style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--color-navy)', textDecoration: 'none' }}>
            ThriveAtHome
          </Link>
          <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
            {DESKTOP_LINKS.map(l => {
              const active = l.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(l.href)
              const isMessages = l.href === '/dashboard/messages'
              return (
                <Link key={l.href} href={l.href} style={{
                  position: 'relative',
                  padding: '6px 14px', borderRadius: '8px',
                  fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: active ? 600 : 400,
                  color: active ? 'var(--color-teal)' : 'var(--color-navy)',
                  backgroundColor: active ? 'rgba(0,150,136,0.08)' : 'transparent',
                  textDecoration: 'none',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  {l.label}
                  {isMessages && unreadMessages > 0 && (
                    <span style={{
                      backgroundColor: 'var(--color-teal)', color: 'white',
                      borderRadius: '10px', padding: '1px 6px',
                      fontSize: '11px', fontWeight: 700, lineHeight: '16px',
                    }}>{unreadMessages > 9 ? '9+' : unreadMessages}</span>
                  )}
                </Link>
              )
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              {seniorName}
            </span>
            {unreadCount > 0 && (
              <button onClick={() => { setShowNotifs(!showNotifs) }} style={{
                position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
              }}>
                🔔
                <span style={{
                  position: 'absolute', top: 0, right: 0,
                  backgroundColor: '#EF4444', color: 'white',
                  borderRadius: '50%', width: '16px', height: '16px',
                  fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        backgroundColor: 'white', borderTop: '1px solid #E8E4DC',
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        height: '64px', padding: '0 8px',
      }} className="mob-nav">
        {NAV_LINKS.map(l => {
          const active = l.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(l.href)
          const isMessages = l.href === '/dashboard/messages'
          return (
            <Link key={l.href} href={l.href} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
              textDecoration: 'none', padding: '8px 12px', borderRadius: '10px',
              backgroundColor: active ? 'rgba(0,150,136,0.08)' : 'transparent',
              position: 'relative',
            }}>
              <span style={{ fontSize: '20px', lineHeight: 1 }}>{l.icon}</span>
              <span style={{
                fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: active ? 600 : 400,
                color: active ? 'var(--color-teal)' : 'var(--color-text-secondary)',
              }}>{l.label}</span>
              {isMessages && unreadMessages > 0 && (
                <span style={{
                  position: 'absolute', top: '4px', right: '6px',
                  backgroundColor: 'var(--color-teal)', color: 'white',
                  borderRadius: '10px', padding: '1px 5px',
                  fontSize: '10px', fontWeight: 700, lineHeight: '14px',
                }}>{unreadMessages > 9 ? '9+' : unreadMessages}</span>
              )}
            </Link>
          )
        })}
      </nav>

      <style>{`
        @media (min-width: 768px) {
          .desk-nav { display: block !important; }
          .mob-nav { display: none !important; }
        }
      `}</style>
    </>
  )
}
