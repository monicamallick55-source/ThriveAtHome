'use client'

export default function GriefSupportPage() {
  const pathways = [
    { name: 'Loss of a Loved One', desc: 'Compassionate support after the death of a spouse, partner, sibling, or close friend.' },
    { name: 'Major Health Diagnosis', desc: 'Coping with a new diagnosis of cancer, heart disease, or other serious condition.' },
    { name: 'Major Life Change', desc: 'Navigating retirement, relocation, or other significant transitions.' },
    { name: 'Caregiver Support', desc: 'Support for those caring for a spouse, parent, or other loved one.' },
    { name: 'Loss of Driving', desc: 'Adjusting to life after giving up your driver\'s license.' },
    { name: 'Late-Life Divorce & Separation', desc: 'Processing grief from divorce or separation later in life.' },
    { name: 'Dementia & MCI Diagnosis', desc: 'Support for members and families navigating memory loss.' },
    { name: 'Adult Child Moving Away', desc: 'Coping with the emotional impact of family moving far away.' },
    { name: 'Housing Insecurity & Forced Move', desc: 'Support during unexpected housing transitions or forced relocation.' },
  ]

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Grief Support</h1>
      <p>You are not alone. We offer compassionate support through every stage of grief.</p>
      <section>
        <h2>Support Pathways</h2>
        <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
          {pathways.map((p, i) => (
            <div key={i} style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
              <h3>{p.name}</h3>
              <p>{p.desc}</p>
              <button style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', backgroundColor: '#7c3aed', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Get Support
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
