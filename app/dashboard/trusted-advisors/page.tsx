'use client'
export default function TrustedAdvisorsPage() {
  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1rem' }}>
      <h1>Trusted Advisors</h1>
      <p>Connect with professionals who understand the needs of older adults.</p>
      <div style={{ display: 'grid', gap: '1.5rem', marginTop: '1.5rem' }}>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '1.5rem' }}>
          <h2>Therapist</h2>
          <p>Licensed therapists specializing in aging, grief, and life transitions.</p>
          <button>Schedule a Session</button>
        </div>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '1.5rem' }}>
          <h2>Attorney</h2>
          <p>Elder law attorneys for estate planning, Medicare, and housing.</p>
          <button>Schedule a Consultation</button>
        </div>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '1.5rem' }}>
          <h2>Financial Planner</h2>
          <p>Fee-only financial planners focused on retirement and long-term care.</p>
          <button>Schedule a Meeting</button>
        </div>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '1.5rem' }}>
          <h2>Grief Counselor</h2>
          <p>Specialized support for loss, bereavement, and major life changes.</p>
          <button>Request an Introduction</button>
        </div>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '1.5rem' }}>
          <h2>Chaplain / Spiritual Care</h2>
          <p>Interfaith spiritual support — available on request for members who want it.</p>
          <button>Request an Introduction</button>
        </div>
      </div>
    </main>
  )
}
