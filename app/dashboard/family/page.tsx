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
        <h2>Family Events Calendar</h2>
        <p>Upcoming family events and important dates.</p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2>Mood &amp; How They're Feeling</h2>
        <p>Mood timeline — track emotional wellbeing over time.</p>
      </section>
    </main>
  )
}
