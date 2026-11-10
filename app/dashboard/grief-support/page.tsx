'use client'

export default function GriefSupportPage() {
  const pathways = [
    { name: 'Individual Counseling', description: 'One-on-one sessions with licensed grief counselors' },
    { name: 'Grief Support Groups', description: 'Connect with others who understand your journey' },
    { name: 'Grief Circles', description: 'Intimate small-group grief processing circles' },
    { name: 'Memorial Services', description: 'Help planning and attending memorial events' },
    { name: 'Legacy Projects', description: 'Preserve memories through storytelling and photo projects' },
    { name: 'Spiritual Support', description: 'Faith-based grief guidance and chaplain connection' },
    { name: 'Crisis Intervention', description: '24/7 crisis support for acute grief episodes' },
    { name: 'Family Grief Coordination', description: 'Support for the whole family after a loss' },
    { name: 'Bereavement Navigation', description: 'Practical help with estate, paperwork, and next steps' },
  ]

  return (
    <main className="grief-support-page" style={{ padding: '2rem' }}>
      <h1>Grief Support</h1>
      <p>You are not alone. We offer compassionate support through every stage of grief.</p>

      <section aria-label="Grief pathways">
        <h2>Support Pathways</h2>
        <div className="pathways-grid" style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
          {pathways.map((pathway, i) => (
            <div key={i} className="pathway-card" style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
              <h3>{pathway.name}</h3>
              <p>{pathway.description}</p>
              <button style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', backgroundColor: '#7c3aed', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Learn More
              </button>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>Grief Resources</h2>
        <ul>
          <li>Grief journaling guides</li>
          <li>Recommended reading list</li>
          <li>Community remembrance calendar</li>
        </ul>
      </section>
    </main>
  )
}
