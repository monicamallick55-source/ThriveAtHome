export default function ForVolunteersPage() {
  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 8 }}>Volunteer with Thrive@Home</h1>
      <p style={{ color: '#6b7280', marginBottom: 32 }}>Make a real difference in the lives of seniors in your community.</p>
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 12 }}>What volunteers do</h2>
        <ul style={{ lineHeight: 2 }}>
          <li>Friendly phone and video check-ins</li>
          <li>Errand running and light transportation</li>
          <li>Tech help and digital literacy</li>
          <li>Social activities and companionship</li>
        </ul>
      </section>
      <a href="/signup?role=volunteer" style={{ background: '#6366f1', color: '#fff', padding: '12px 28px', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>Apply to Volunteer</a>
    </main>
  )
}
