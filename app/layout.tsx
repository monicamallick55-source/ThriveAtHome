import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Thrive@Home — Live independently with confidence',
  description: 'AI-powered senior independence platform.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav style={{position:'sticky',top:0,zIndex:50,background:'rgba(255,255,255,0.95)',backdropFilter:'blur(8px)',borderBottom:'1px solid #e5e7eb',display:'flex',alignItems:'center',padding:'0 24px',height:'60px'}}>
          <a href="/" style={{fontWeight:700,fontSize:'1.1rem',color:'#6366f1',textDecoration:'none',marginRight:'auto'}}>Thrive@Home</a>
          <div style={{display:'flex',gap:'24px',alignItems:'center'}}>
            <a href="/pricing" style={{color:'#374151',textDecoration:'none',fontSize:'0.9rem',fontWeight:500}}>Pricing</a>
            <a href="/for-organizations" style={{color:'#374151',textDecoration:'none',fontSize:'0.9rem',fontWeight:500}}>For Organizations</a>
            <a href="/login" style={{color:'#374151',textDecoration:'none',fontSize:'0.9rem',fontWeight:500}}>Sign In</a>
            <a href="/signup" style={{background:'#6366f1',color:'#fff',textDecoration:'none',padding:'8px 18px',borderRadius:'8px',fontSize:'0.9rem',fontWeight:600}}>Get Started</a>
          </div>
        </nav>
        {children}
      </body>
    </html>
  )
}
