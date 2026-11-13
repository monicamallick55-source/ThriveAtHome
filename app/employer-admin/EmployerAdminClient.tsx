'use client'

export default function EmployerAdminClient() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Employer Admin Portal</h1>
      <p>Manage your corporate wellness program and employee benefits.</p>

      <section style={{ marginTop: '1.5rem', display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
          <h3>Member Count</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#7c3aed' }}>142</p>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Active enrolled employees</p>
        </div>
        <div style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
          <h3>Volunteer Hours</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#059669' }}>1,284</p>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Total hours logged</p>
        </div>
        <div style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
          <h3>Corporate Tier</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#d97706' }}>Silver</p>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Bronze → Silver → Gold</p>
        </div>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>Corporate Volunteer Program</h2>
        <div style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem' }}>
          <div style={{ padding: '1rem', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fcd34d' }}>
            <strong>Bronze Tier</strong> — 0–500 hours
          </div>
          <div style={{ padding: '1rem', background: '#d1fae5', borderRadius: '8px', border: '1px solid #6ee7b7' }}>
            <strong>Silver Tier</strong> — 501–1,500 hours ← Current
          </div>
          <div style={{ padding: '1rem', background: '#ede9fe', borderRadius: '8px', border: '1px solid #c4b5fd' }}>
            <strong>Gold Tier</strong> — 1,500+ hours
          </div>
        </div>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>Invite Employees</h2>
        <p>Send invitations to enroll employees in the Thrive@Home program.</p>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
          <input type="email" placeholder="employee@company.com" style={{ flex: 1, padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }} />
          <button style={{ padding: '0.5rem 1rem', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            Send Invite
          </button>
        </div>
      </section>

      <section style={{ marginTop: '2rem', background: '#f5f3ff', border: '1px solid #ede9fe', borderRadius: 12, padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1f2937', margin: '0 0 0.5rem' }}>Corporate Volunteer Tier Progress</h2>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 1rem' }}>
          Partner: 50–200 hrs/yr &nbsp;·&nbsp; Champion: 200–500 hrs/yr &nbsp;·&nbsp; Leader: 500+ hrs/yr
        </p>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          {(['Partner', 'Champion', 'Leader'] as const).map((tier) => (
            <div key={tier} style={{ flex: 1, background: '#fff', border: '1px solid #ede9fe', borderRadius: 8, padding: '0.75rem 1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{tier}</div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 2 }}>
                {tier === 'Partner' ? '50–200 hrs' : tier === 'Champion' ? '200–500 hrs' : '500+ hrs'}
              </div>
            </div>
          ))}
        </div>
        <div style={{ background: '#ede9fe', borderRadius: 999, height: 10, overflow: 'hidden' }}>
          <div style={{ background: '#7c3aed', height: '100%', width: '26%', borderRadius: 999, transition: 'width 0.5s' }} />
        </div>
        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>1,284 of 5,000 annual hours toward Leader tier</p>
      </section>
    </div>
  )
}
