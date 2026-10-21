'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NO_NAV_PREFIXES = [
  '/dashboard','/member-portal','/admin','/employer-admin',
  '/agency-admin','/org-admin','/network-admin','/k12-admin',
  '/senior-center-admin','/nonprofit-admin','/navigator',
  '/onboarding','/login','/signup','/join',
]

const linkStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body, DM Sans, sans-serif)',
  textDecoration: 'none', padding: '8px 14px',
  fontSize: '15px', color: 'var(--color-text-secondary, #475569)',
}

export default function SiteNav() {
  const pathname = usePathname()
  const hide = NO_NAV_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'))
  if (hide) return null
  return (
    <header style={{ position:'sticky',top:0,zIndex:50,backgroundColor:'rgba(250,250,245,0.95)',backdropFilter:'blur(8px)',borderBottom:'1px solid var(--color-warm-grey,#e8e4dc)' }}>
      <div style={{ maxWidth:1200,margin:'0 auto',padding:'0 24px',height:'68px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'16px' }}>
        <Link href="/" style={{ fontFamily:'var(--font-display,Cormorant Garamond,serif)',fontSize:'22px',color:'var(--color-navy,#1e3a5f)',fontWeight:500,letterSpacing:'-0.01em',textDecoration:'none' }}>ThriveAtHome</Link>
        <nav style={{ display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap' }}>
          <Link href="/for-volunteers" style={linkStyle}>For Volunteers</Link>
          <Link href="/partner-directory" style={linkStyle}>Find Local Help</Link>
          <Link href="/pricing" style={linkStyle}>Pricing</Link>
          <Link href="/for-organizations" style={linkStyle}>For Organizations</Link>
          <Link href="/donate" style={{ ...linkStyle,color:'var(--color-teal,#0d9488)',fontWeight:700 }}>♥ Donate</Link>
          <Link href="/login" style={{ ...linkStyle,color:'var(--color-navy,#1e3a5f)',fontWeight:500 }}>Sign in</Link>
          <Link href="/signup" style={{ display:'inline-flex',alignItems:'center',backgroundColor:'var(--color-navy,#1e3a5f)',color:'var(--color-cream,#fafaf5)',fontFamily:'var(--font-body,DM Sans,sans-serif)',fontWeight:600,fontSize:'15px',padding:'10px 20px',borderRadius:'var(--radius-md,8px)',textDecoration:'none' }}>Get started</Link>
        </nav>
      </div>
    </header>
  )
}
