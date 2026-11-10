'use client'
const ADDONS = [
  { id: 'nav-hours', name: 'Extra Navigator Hours Block', desc: 'Add 2 extra navigator hours per month to your plan.', price: '$29/mo' },
  { id: 'premium-content', name: 'Premium Content Access', desc: 'Unlock all premium courses, workshops, and expert content.', price: '$9/mo' },
  { id: 'fraud', name: 'Enhanced Fraud Monitoring', desc: 'Advanced fraud detection and real-time alerts.', price: '$12/mo' },
  { id: 'family-care', name: 'Family Care Coordination', desc: 'Dedicated coordination for family members and caregivers.', price: '$19/mo' },
]
export default function AddonsPage() {
  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1rem' }}>
      <h1>Add-Ons</h1>
      <p>Enhance your plan with additional services.</p>
      <div style={{ display: 'grid', gap: '1.5rem', marginTop: '1.5rem' }}>
        {ADDONS.map(a => (
          <div key={a.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: '0 0 0.25rem' }}>{a.name}</h2>
              <p style={{ margin: '0 0 0.5rem', color: '#6b7280' }}>{a.desc}</p>
              <strong>{a.price}</strong>
            </div>
            <button>Add to plan</button>
          </div>
        ))}
      </div>
    </main>
  )
}
