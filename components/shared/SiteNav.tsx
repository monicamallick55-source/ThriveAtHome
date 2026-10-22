'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const NO_NAV_PREFIXES = [
  '/dashboard','/member-portal','/admin','/employer-admin',
  '/agency-admin','/org-admin','/network-admin','/k12-admin',
  '/senior-center-admin','/nonprofit-admin','/navigator',
  '/onboarding','/login','/signup','/join',
]

// Audience tabs — Families & Seniors is the landing page itself.
// There is no /partners page; partners land on /for-organizations.
const AUDIENCE_TABS = [
  { label: 'For Families & Seniors', href: '/', match: (p: string) => p === '/' || p.startsWith('/for-families') },
  { label: 'For Employers', href: '/employers', match: (p: string) => p.startsWith('/employers') },
  { label: 'For Partners', href: '/for-organizations', match: (p: string) => p.startsWith('/for-organizations') },
]

const SECONDARY_LINKS = [
  { label: 'For Volunteers', href: '/for-volunteers' },
  { label: 'Find Local Help', href: '/partner-directory' },
  { label: 'Pricing', href: '/pricing' },
]

const linkStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body, DM Sans, sans-serif)',
  textDecoration: 'none', padding: '8px 12px',
  fontSize: '15px', color: 'var(--color-text-secondary, #475569)',
  whiteSpace: 'nowrap',
}

const getStartedStyle: React.CSSProperties = {
  alignItems: 'center', justifyContent: 'center',
  backgroundColor: 'var(--color-navy,#1e3a5f)', color: 'var(--color-cream,#fafaf5)',
  fontFamily: 'var(--font-body,DM Sans,sans-serif)', fontWeight: 600, fontSize: '15px',
  padding: '10px 20px', minHeight: '44px', borderRadius: 'var(--radius-md,8px)',
  textDecoration: 'none', whiteSpace: 'nowrap',
}

const mobileLinkStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', minHeight: '52px', padding: '0 4px',
  fontFamily: 'var(--font-body, DM Sans, sans-serif)', fontSize: '18px',
  color: 'var(--color-navy,#1e3a5f)', textDecoration: 'none',
  borderBottom: '1px solid var(--color-warm-grey,#e8e4dc)',
}

export default function SiteNav() {
  const pathname = usePathname()
  // The menu is open only for the path it was opened on, so navigating closes it
  const [openOn, setOpenOn] = useState<string | null>(null)
  const open = openOn === pathname
  const setOpen = (next: boolean | ((o: boolean) => boolean)) =>
    setOpenOn((typeof next === 'function' ? next(open) : next) ? pathname : null)

  // Close the mobile menu on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenOn(null) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const hide = NO_NAV_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'))
  if (hide) return null

  return (
    <header style={{ position:'sticky',top:0,zIndex:50,backgroundColor:'rgba(250,250,245,0.97)',backdropFilter:'blur(8px)',borderBottom:'1px solid var(--color-warm-grey,#e8e4dc)' }}>
      <div style={{ maxWidth:1280,margin:'0 auto',padding:'0 20px',height:'68px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'16px' }}>
        <Link href="/" style={{ fontFamily:'var(--font-display,Cormorant Garamond,serif)',fontSize:'22px',color:'var(--color-navy,#1e3a5f)',fontWeight:500,letterSpacing:'-0.01em',textDecoration:'none',flexShrink:0 }}>ThriveAtHome</Link>

        {/* Desktop: audience tabs */}
        <nav aria-label="Audience" className="hidden lg:flex" style={{ alignItems:'center',gap:'4px',backgroundColor:'var(--color-warm-white,#f5f4ef)',border:'1px solid var(--color-warm-grey,#e8e4dc)',borderRadius:'999px',padding:'4px' }}>
          {AUDIENCE_TABS.map(tab => {
            const active = tab.match(pathname)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                style={{
                  ...linkStyle, fontSize:'14px', padding:'8px 16px', borderRadius:'999px',
                  fontWeight: active ? 600 : 500,
                  backgroundColor: active ? 'var(--color-navy,#1e3a5f)' : 'transparent',
                  color: active ? 'var(--color-cream,#fafaf5)' : 'var(--color-navy,#1e3a5f)',
                }}
              >
                {tab.label}
              </Link>
            )
          })}
        </nav>

        {/* Desktop: secondary links + auth */}
        <nav aria-label="Main" className="hidden lg:flex" style={{ alignItems:'center',gap:'2px' }}>
          {SECONDARY_LINKS.map(l => (
            <Link key={l.href} href={l.href} className="hidden xl:inline" style={linkStyle}>{l.label}</Link>
          ))}
          <Link href="/donate" style={{ ...linkStyle,color:'var(--color-teal,#0d9488)',fontWeight:700 }}>♥ Donate</Link>
          <Link href="/login" style={{ ...linkStyle,color:'var(--color-navy,#1e3a5f)',fontWeight:500 }}>Sign in</Link>
          <Link href="/signup" className="inline-flex" style={{ ...getStartedStyle, marginLeft:'6px' }}>Get started</Link>
        </nav>

        {/* Mobile: Get started + hamburger */}
        <div className="flex lg:hidden" style={{ alignItems:'center',gap:'8px' }}>
          {/* Very narrow phones: Get started lives in the menu only, so the bar never overflows */}
          <Link href="/signup" className="inline-flex max-[379px]:hidden" style={{ ...getStartedStyle, fontSize:'14px', padding:'10px 14px' }}>Get started</Link>
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            aria-expanded={open}
            aria-controls="site-nav-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            style={{ width:'48px',height:'48px',display:'inline-flex',alignItems:'center',justifyContent:'center',background:'none',border:'1px solid var(--color-warm-grey,#e8e4dc)',borderRadius:'var(--radius-md,8px)',cursor:'pointer',color:'var(--color-navy,#1e3a5f)' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {open
                ? <path d="M6 6l12 12M18 6L6 18" />
                : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      {open && (
        <div id="site-nav-menu" className="lg:hidden" style={{ borderTop:'1px solid var(--color-warm-grey,#e8e4dc)',backgroundColor:'var(--color-cream,#fafaf5)',maxHeight:'calc(100vh - 68px)',overflowY:'auto' }}>
          <nav aria-label="Mobile" style={{ padding:'8px 20px 24px',display:'flex',flexDirection:'column' }}>
            <div style={{ fontFamily:'var(--font-body)',fontSize:'12px',fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--color-text-muted,#64748b)',padding:'12px 4px 4px' }}>I&apos;m looking for</div>
            {AUDIENCE_TABS.map(tab => {
              const active = tab.match(pathname)
              return (
                <Link key={tab.href} href={tab.href} aria-current={active ? 'page' : undefined}
                  style={{ ...mobileLinkStyle, fontWeight: active ? 700 : 500, color: active ? 'var(--color-teal,#0d9488)' : mobileLinkStyle.color }}>
                  {tab.label}
                </Link>
              )
            })}
            <div style={{ height:'12px' }} />
            {SECONDARY_LINKS.map(l => (
              <Link key={l.href} href={l.href} style={mobileLinkStyle}>{l.label}</Link>
            ))}
            <Link href="/donate" style={{ ...mobileLinkStyle,color:'var(--color-teal,#0d9488)',fontWeight:700 }}>♥ Donate</Link>
            <Link href="/login" style={{ ...mobileLinkStyle,fontWeight:600 }}>Sign in</Link>
            <Link href="/signup" className="flex" style={{ ...getStartedStyle, minHeight:'52px', fontSize:'17px', marginTop:'16px' }}>Get started</Link>
          </nav>
        </div>
      )}
    </header>
  )
}
