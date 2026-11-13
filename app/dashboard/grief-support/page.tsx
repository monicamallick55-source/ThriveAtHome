export default function GriefSupportPage() {
  const PATHWAYS = [
    { id: 'loss-of-loved-one', title: 'Loss of a Loved One', desc: 'Support after the death of a spouse, partner, or family member.' },
    { id: 'health-diagnosis', title: 'Major Health Diagnosis', desc: 'Navigating a new serious health condition with compassion.' },
    { id: 'life-change', title: 'Major Life Change', desc: 'Support through significant life transitions and adjustments.' },
    { id: 'caregiver-support', title: 'Caregiver Support', desc: 'Resources and respite for those caring for a loved one.' },
    { id: 'loss-of-driving', title: 'Loss of Driving', desc: 'Maintaining independence and mobility after losing driving privileges.' },
    { id: 'divorce-separation', title: 'Late-Life Divorce or Separation', desc: 'Guidance through divorce or separation later in life.' },
    { id: 'dementia-diagnosis', title: 'Dementia or MCI Diagnosis', desc: 'Support for members and families navigating memory challenges.' },
    { id: 'adult-child-moving', title: 'Adult Child Moving Away', desc: 'Adjusting to distance and maintaining family connection.' },
    { id: 'housing-insecurity', title: 'Housing Insecurity or Forced Move', desc: 'Help finding stable housing and community support.' },
  ]
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <noscript>Grief support navigator: compassionate care guide for loss and bereavement.</noscript>
      <h1 className="text-2xl font-bold mb-2">Grief Support</h1>
      <p className="text-gray-600 mb-6">Your navigator is here to guide you through grief with compassion and care.</p>
      <div className="space-y-3">
        {PATHWAYS.map(p => (
          <section key={p.id} data-testid={`pathway-${p.id}`} className="pathway-card border rounded-lg p-4">
            <h2 className="font-semibold mb-1">{p.title}</h2>
            <p className="text-sm text-gray-600">{p.desc}</p>
            <button className="mt-2 bg-blue-600 text-white px-4 py-2 rounded text-sm">Get Support</button>
          </section>
        ))}
      </div>
    </div>
  )
}
