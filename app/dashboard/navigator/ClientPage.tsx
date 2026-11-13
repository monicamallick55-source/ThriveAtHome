'use client'
export default function ClientPage() {
  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
      <noscript>Navigator: task guide, care navigator, personal guide for seniors.</noscript>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: 4 }}>Navigator Dashboard</h1>
      <p style={{ color: '#6b7280', marginBottom: 32 }}>Manage your assigned members and care coordination tasks.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16 }}>
        {[['My Members','View all assigned members','/navigator/members'],['Task Queue','Pending follow-ups and check-ins','/navigator/tasks'],['Care Plans','Active care plans and goals','/navigator/care-plans'],['Reports','Weekly activity summary','/navigator/reports']].map(([title,desc,href]) => (
          <a key={title as string} href={href as string} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, textDecoration: 'none', color: 'inherit', display: 'block' }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{title}</div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>{desc}</div>
          </a>
        ))}
      </div>
    </main>
  )
}
