'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NotificationBell } from '@/components/ui/NotificationBell'

interface DashNavProps {
  seniorName: string
  familyInitial: string
  unreadCount: number
  onMarkAllRead: () => void
}

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/calls', label: 'History' },
  { href: '/dashboard/family', label: 'Family' },
  { href: '/dashboard/documents', label: 'Documents' },
]

export function DashNav({ seniorName, familyInitial, unreadCount, onMarkAllRead }: DashNavProps) {
  const pathname = usePathname()

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        backgroundColor: 'white',
        borderBottom: '1px solid var(--color-warm-grey)',
        boxShadow: 'var(--shadow-sm)',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
      }}
      aria-label="Dashboard navigation"
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        {/* Wordmark */}
        <Link
          href="/dashboard"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '22px',
            fontWeight: 500,
            color: 'var(--color-navy)',
            textDecoration: 'none',
            letterSpacing: '-0.01em',
            flexShrink: 0,
          }}
        >
          ThriveAtHome
        </Link>

        {/* Center nav — desktop only */}
        <div
          style={{ display: 'flex', gap: '4px', flex: 1, justifyContent: 'center' }}
          className="dash-nav-links"
        >
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname?.startsWith(link.href))
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '18px',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--color-navy)' : 'var(--color-text-secondary)',
                  textDecoration: 'none',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isActive ? 'var(--color-teal-muted)' : 'transparent',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                }}
              >
                {link.label}
              </Link>
            )
          })}
        </div>

        {/* Right: Bell + avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <NotificationBell
            count={unreadCount}
            onClick={onMarkAllRead}
            label="Notifications"
          />
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-teal)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-body)',
              fontSize: '18px',
              fontWeight: 600,
              flexShrink: 0,
            }}
            aria-label={`${seniorName}'s family dashboard`}
          >
            {familyInitial}
          </div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="dash-mobile-nav">
        {NAV_LINKS.map((link) => {
          const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname?.startsWith(link.href))
          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-body)',
                fontSize: '11px',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--color-teal)' : 'var(--color-text-muted)',
                textDecoration: 'none',
                padding: '8px 4px',
                gap: '2px',
              }}
            >
              <span style={{ fontSize: '20px' }}>
                {link.label === 'Dashboard' ? '🏠' : link.label === 'History' ? '📋' : link.label === 'Family' ? '👥' : '📁'}
              </span>
              {link.label}
            </Link>
          )
        })}
      </div>

      <style>{`
        .dash-nav-links { display: none !important; }
        .dash-mobile-nav { display: none; position: fixed; bottom: 0; left: 0; right: 0; z-index: 50; background: white; border-top: 1px solid var(--color-warm-grey); height: 60px; flex-direction: row; }
        @media (min-width: 768px) {
          .dash-nav-links { display: flex !important; }
          .dash-mobile-nav { display: none !important; }
        }
        @media (max-width: 767px) {
          .dash-mobile-nav { display: flex !important; }
        }
      `}</style>
    </nav>
  )
}
