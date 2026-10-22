cat > components/shared/SiteNav.tsx << 'NAVEOF'
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

// B2C links — for seniors, families, and volunteers
const B2C_LINKS = [
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Volunteer', href: '/for-volunteers' },
  { label: 'Pricing', href: '/pricing' },
]

// B2B links — organizations, employers, partners
const B2B_LINKS = [
  { label: 'For Employers', href: '/employers' },
  { label: 'For Partners', href: '/for-organizations' },
]

const linkStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body, DM Sans, sans-serif)',
  textDecoration: 'none', padding: '8px 12px',
  fontSize: '15px', color: 'var(--color-text-secondary, #475569)',
  whiteSpace: 'nowrap',
}

const b2bLinkStyle: React.CSSProperties = {
  ...linkStyle,
  fontSize: '14px',
  color: 'var(--color-navy,#1e3a5f)',
  fontWeight: 500,
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

const mobileGroupLabel: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '11px', fontWeight: 700,
  letterSpacing: '0.1em', textTransform: 'uppercase',
  color: 'var(--color-text-muted,#64748b)',
  padding: '16px 4px 4px',
}

export default function SiteNav() {
  const pathname = usePathname()
  const [openOn, setOpenOn] = useState<string | null>(null)
  const open = openOn === pathname
  const setOpen = (next: boolean | ((o: boolean) => boolean)) =>
    setOpenOn((typeof next === 'function' ? next(open) : next) ? pathname : null)

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

        {/* Logo */}
        <Link href="/" style={{ fontFamily:'var(--font-display,Cormorant Garamond,serif)',fontSize:'22px',color:'var(--color-navy,#1e3a5f)',fontWeight:500,letterSpacing:'-0.01em',textDecoration:'none',flexShrink:0 }}>
          ThriveAtHome
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Main" className="hidden lg:flex" style={{ alignItems:'center',gap:'2px',flex:1,justifyContent:'flex-end' }}>

          {/* B2C links */}
          {B2C_LINKS.map(l => (
            <Link key={l.href} href={l.href} style={linkStyle}>{l.label}</Link>
          ))}

          {/* Separator */}
          <div style={{ width:'1px',height:'20px',backgroundColor:'var(--color-warm-grey,#e8e4dc)',margin:'0 8px',flexShrink:0 }} aria-hidden="true" />

          {/* B2B links */}
          {B2B_LINKS.map(l => (
            <Link key={l.href} href={l.href} style={b2bLinkStyle}>{l.label}</Link>
          ))}

          {/* Separator */}
          <div style={{ width:'1px',height:'20px',backgroundColor:'var(--color-warm-grey,#e8e4dc)',margin:'0 8px',flexShrink:0 }} aria-hidden="true" />

          {/* Auth */}
          <Link href="/donate" style={{ ...linkStyle,color:'var(--color-teal,#0d9488)',fontWeight:700 }}>♥ Donate</Link>
          <Link href="/login" style={{ ...linkStyle,color:'var(--color-navy,#1e3a5f)',fontWeight:500 }}>Sign in</Link>
          <Link href="/signup" className="inline-flex" style={{ ...getStartedStyle, marginLeft:'6px' }}>Get started</Link>
        </nav>

        {/* Mobile: Get started + hamburger */}
        <div className="flex lg:hidden" style={{ alignItems:'center',gap:'8px' }}>
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

            {/* FOR YOU — B2C */}
            <div style={mobileGroupLabel}>For You</div>
            {B2C_LINKS.map(l => (
              <Link key={l.href} href={l.href} style={mobileLinkStyle}>{l.label}</Link>
            ))}

            {/* FOR ORGANIZATIONS — B2B */}
            <div style={{ ...mobileGroupLabel, marginTop: '4px' }}>For Organizations</div>
            {B2B_LINKS.map(l => (
              <Link key={l.href} href={l.href} style={mobileLinkStyle}>{l.label}</Link>
            ))}

            {/* Donate + Auth */}
            <div style={{ height:'8px' }} />
            <Link href="/donate" style={{ ...mobileLinkStyle,color:'var(--color-teal,#0d9488)',fontWeight:700 }}>♥ Donate</Link>
            <Link href="/login" style={{ ...mobileLinkStyle,fontWeight:600 }}>Sign in</Link>
            <Link href="/signup" className="flex" style={{ ...getStartedStyle, minHeight:'52px', fontSize:'17px', marginTop:'16px' }}>Get started</Link>
          </nav>
        </div>
      )}
    </header>
  )
}
NAVEOF