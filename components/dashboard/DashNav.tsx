'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { NotificationBell } from '@/components/ui/NotificationBell'
import { createClient } from '@/lib/supabase/client'

interface DashNavProps {
  seniorName: string
  unreadCount: number
  onMarkAllRead: () => void
}

const NAV_LINKS = [
  { href: '/dashboard', label: 'Home', icon: '🏠' },
  { href: '/dashboard/calls', label: 'History', icon: '📋' },
  { href: '/dashboard/communities', label: 'Community', icon: '🌍' },
  { href: '/dashboard/friends', label: 'Friends', icon: '👥' },
  { href: '/dashboard/documents', label: 'Docs', icon: '📁' },
]

const DESKTOP_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/calls', label: 'History' },
  { href: '/dashboard/communities', label: 'Community' },
  { href: '/dashboard/friends', label: 'Friends' },
  { href: '/dashboard/family', label: 'Family' },
  { href: '/dashboard/documents', label: 'Documents' },
]

export function DashNav({ seniorName, unreadCount, onMarkAllRead }: DashNavProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

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
          {DESKTOP_LINKS.map((link: any) => {
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

        {/* Right: Bell + sign out */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <NotificationBell
            count={unreadCount}
            onClick={onMarkAllRead}
            label="Notifications"
          />
          <button
            onClick={handleSignOut}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '15px',
              fontWeight: 500,
              color: 'var(--color-navy)',
              background: 'none',
              border: '1.5px solid var(--color-navy)',
              borderRadius: 'var(--radius-md)',
              padding: '6px 16px',
              cursor: 'pointer',
              minHeight: '36px',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
            className="sign-out-btn"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="dash-mobile-nav">
        {NAV_LINKS.map((link: any) => {
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
                fontSize: '10px',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--color-teal)' : 'var(--color-text-muted)',
                textDecoration: 'none',
                padding: '6px 2px 4px',
                gap: '3px',
                minWidth: 0,
              }}
            >
              <span style={{ fontSize: '22px', lineHeight: 1 }}>{link.icon}</span>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', display: 'block', textAlign: 'center' }}>{link.label}</span>
            </Link>
          )
        })}
      </div>

      <style>{`
        .dash-nav-links { display: none !important; }
        .dash-mobile-nav { display: none; position: fixed; bottom: 0; left: 0; right: 0; z-index: 50; background: white; border-top: 1px solid var(--color-warm-grey); height: 62px; flex-direction: row; padding-bottom: env(safe-area-inset-bottom, 0px); }
        @media (min-width: 768px) {
          .dash-nav-links { display: flex !important; }
          .dash-mobile-nav { display: none !important; }
        }
        @media (max-width: 767px) {
          .dash-mobile-nav { display: flex !important; }
          .sign-out-btn { display: none !important; }
        }
      `}</style>
    </nav>
  )
}
