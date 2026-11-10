export default function TrustedAdvisorsPage() {
  const advisors = [
    { name: 'Sarah Mitchell, Esq.', specialty: 'Elder Law Attorney', bio: 'Elder law specialist with 20 years experience.', telehealth: true },
    { name: 'Robert Chen, CFP', specialty: 'Financial Planner', bio: 'Certified financial planner focused on retirement planning.', telehealth: true },
    { name: 'Dr. Angela Torres', specialty: 'Geriatric Care Manager', bio: 'Geriatric care manager specializing in aging in place.', telehealth: false },
    { name: 'Dr. Lisa Nguyen', specialty: 'Licensed Therapist', bio: 'Licensed therapist specializing in life transitions and grief.', telehealth: true },
  ]

  return (
    <div style={{ padding: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
      <h1>Trusted Advisors</h1>
      <p>Connect with vetted professionals who specialize in elder care and senior support.</p>

      <div style={{ display: 'grid', gap: '1rem', marginTop: '1.5rem' }}>
        {advisors.map((a, i) => (
          <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem' }}>
            <h2 style={{ margin: 0 }}>{a.name}</h2>
            <p style={{ color: '#2563eb', fontSize: '0.9rem', margin: '0.25rem 0' }}>{a.specialty}</p>
            <p style={{ color: '#4b5563', fontSize: '0.9rem' }}>{a.bio}</p>
            {a.telehealth && <span style={{ fontSize: '0.75rem', background: '#d1fae5', color: '#065f46', padding: '2px 8px', borderRadius: '4px' }}>Telehealth available</span>}
            <button style={{ marginTop: '0.75rem', display: 'block', width: '100%', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', padding: '0.5rem', cursor: 'pointer' }}>
              Request Consultation
            </button>
          </div>
        ))}
      </div>

      <section style={{ marginTop: '2rem', padding: '1rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <h2>On-Request Specialists</h2>
        <p>These specialists are available by request only. Contact your navigator to be connected.</p>
        <div style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem' }}>
          <div style={{ padding: '0.75rem', background: 'white', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
            <strong>Chaplain / Spiritual Care</strong>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0' }}>Non-denominational chaplain and grief counselor available for spiritual support.</p>
            <button style={{ marginTop: '0.5rem', background: 'white', border: '1px solid #2563eb', color: '#2563eb', borderRadius: '4px', padding: '0.4rem 1rem', cursor: 'pointer' }}>
              Request an introduction
            </button>
          </div>
          <div style={{ padding: '0.75rem', background: 'white', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
            <strong>Grief Counselor</strong>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0' }}>Specialized grief counselor for loss, transitions, and bereavement support.</p>
            <button style={{ marginTop: '0.5rem', background: 'white', border: '1px solid #2563eb', color: '#2563eb', borderRadius: '4px', padding: '0.4rem 1rem', cursor: 'pointer' }}>
              Request an introduction
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
