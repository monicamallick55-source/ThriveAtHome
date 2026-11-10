import type { ReactNode } from 'react'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="dashboard-shell">
      <nav aria-label="Main navigation" role="navigation" style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb', background: '#fff' }}>
        <a href="/dashboard" style={{ fontWeight: 'bold', marginRight: '1rem' }}>Thrive@Home</a>
        <a href="/dashboard/health" style={{ marginRight: '1rem' }}>Health</a>
        <a href="/dashboard/communities" style={{ marginRight: '1rem' }}>Communities</a>
        <a href="/dashboard/family" style={{ marginRight: '1rem' }}>Family</a>
        <a href="/dashboard/vault" style={{ marginRight: '1rem' }}>Vault</a>
      </nav>
      <main id="main-content" style={{ padding: '1.5rem' }}>
        {children}
      </main>
    </div>
  )
}
