'use client'
export default function FamilyDashboardPage() {
  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' }}>
      <h1>Family Portal</h1>

      <section style={{ marginBottom: '2rem' }}>
        <h2>Wellness Summary</h2>
        <p>Your loved one is doing well. Last check-in: today.</p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2>Fraud Protection</h2>
        <p>No suspicious activity detected. Fraud protection is active.</p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <div role="tablist" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <button role="tab" aria-selected="true">Family Events</button>
          <button role="tab" aria-selected="false">Mood</button>
        </div>
        <h2>Family Events Calendar</h2>
        <p>Upcoming family events and important dates.</p>
        <button type="button" style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', background: '#6366f1', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          + Add Event
        </button>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2>Mood &amp; How They&apos;re Feeling</h2>
        <p>Mood timeline — track emotional wellbeing over time.</p>
      </section>
    </main>
  )
}
