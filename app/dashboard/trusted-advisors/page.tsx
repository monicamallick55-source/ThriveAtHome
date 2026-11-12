'use client'
export default function TrustedAdvisorsPage() {
  const advisors = [
    { role: 'therapist', label: 'Therapist', emoji: '🧠', desc: 'Licensed mental health support', available: true },
    { role: 'attorney', label: 'Elder Law Attorney', emoji: '⚖️', desc: 'Legal planning and elder rights', available: true },
    { role: 'financial_planner', label: 'Financial Planner', emoji: '💰', desc: 'Retirement and benefits planning', available: true },
    { role: 'chaplain', label: 'Chaplain / Spiritual Care', emoji: '🕊️', desc: 'Request an introduction', available: false, onRequest: true },
    { role: 'grief_counselor', label: 'Grief Counselor', emoji: '💜', desc: 'Available on request only', available: false, onRequest: true },
  ]
  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: 8 }}>Trusted Advisors</h1>
      <p style={{ color: '#6b7280', marginBottom: 32 }}>Connect with licensed professionals who specialize in senior wellbeing.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {advisors.map(a => (
          <div key={a.role} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 28 }}>{a.emoji}</span>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>{a.label}</div>
                <div style={{ fontSize: 13, color: '#6b7280' }}>{a.desc}</div>
              </div>
            </div>
            {a.onRequest ? (
              <button style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}>
                Request an introduction
              </button>
            ) : (
              <button style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}>
                Connect
              </button>
            )}
          </div>
        ))}
      </div>
    </main>
  )
}
