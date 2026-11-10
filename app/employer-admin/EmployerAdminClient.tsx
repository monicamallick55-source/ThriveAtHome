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
    </div>
  )
}
